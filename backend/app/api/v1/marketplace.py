import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.permissions import get_current_user
from app.database.connection import supabase

router = APIRouter()
logger = logging.getLogger(__name__)

VALID_ORDER_STATUSES = {
    "PENDING", "ACCEPTED", "REJECTED", "PREPARING", "READY", "COMPLETED", "CANCELLED",
}

# Valid transitions — enforce business rules
VALID_TRANSITIONS = {
    "PENDING": {"ACCEPTED", "REJECTED", "CANCELLED"},
    "ACCEPTED": {"PREPARING", "CANCELLED"},
    "PREPARING": {"READY", "CANCELLED"},
    "READY": {"COMPLETED", "CANCELLED"},
    "COMPLETED": set(),
    "REJECTED": set(),
    "CANCELLED": set(),
}


# ---------- request bodies ----------

class AddToCart(BaseModel):
    product_id: str
    quantity: float


class UpdateCartItem(BaseModel):
    quantity: float


class CheckoutBody(BaseModel):
    customer_name: str
    phone: str
    delivery_location: str
    notes: Optional[str] = None
    payment_method: str


class OrderStatusUpdate(BaseModel):
    status: str


class ProductCreate(BaseModel):
    name: str
    category_id: Optional[str] = None
    category: Optional[str] = None  # legacy
    description: Optional[str] = None
    price: float
    quantity_available: float
    unit: Optional[str] = None
    image_url: Optional[str] = None


class CategoryCreate(BaseModel):
    name: str
    parent_id: Optional[str] = None


# ---------- helpers ----------

def _require_buyer(user: dict) -> None:
    if user.get("role") != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can perform this action.")


def _require_seller_or_admin(user: dict) -> None:
    if user.get("role") not in ("farmer", "admin"):
        raise HTTPException(status_code=403, detail="Only sellers or administrators can perform this action.")


def _require_admin(user: dict) -> None:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Administrators only.")


def _get_or_create_cart(buyer_id: str) -> dict:
    existing = supabase.table("carts").select("*").eq("buyer_id", buyer_id).limit(1).execute()
    if existing.data:
        return existing.data[0]
    created = supabase.table("carts").insert({"buyer_id": buyer_id}).execute()
    if not created.data:
        raise HTTPException(status_code=500, detail="Could not create cart.")
    return created.data[0]


def _cart_with_items(cart_id: str) -> dict:
    items_resp = (
        supabase.table("cart_items")
        .select("*, marketplace_products(id,name,price,unit,image_url,seller_id,quantity_available)")
        .eq("cart_id", cart_id)
        .execute()
    )
    items = items_resp.data or []
    total = 0.0
    enriched = []
    for row in items:
        product = row.get("marketplace_products") or {}
        price = float(product.get("price") or 0)
        qty = float(row.get("quantity") or 0)
        line_total = price * qty
        total += line_total
        enriched.append({
            "id": row["id"],
            "quantity": qty,
            "product": {
                "id": product.get("id"),
                "name": product.get("name"),
                "price": price,
                "unit": product.get("unit"),
                "image_url": product.get("image_url"),
                "seller_id": product.get("seller_id"),
                "quantity_available": float(product.get("quantity_available") or 0),
            },
            "line_total": line_total,
        })
    return {"id": cart_id, "items": enriched, "total": total}


# ---------- categories ----------

@router.get("/categories")
def list_categories():
    response = (
        supabase.table("marketplace_categories")
        .select("*")
        .eq("is_active", True)
        .order("name")
        .execute()
    )
    return response.data or []


@router.get("/categories/all")
def list_all_categories(current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    response = supabase.table("marketplace_categories").select("*").order("name").execute()
    return response.data or []


@router.post("/categories")
def create_category(body: CategoryCreate, current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Category name is required.")
    try:
        response = supabase.table("marketplace_categories").insert({
            "name": name,
            "parent_id": body.parent_id,
        }).execute()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not create category: {exc}")
    return response.data[0]


@router.delete("/categories/{category_id}")
def delete_category(category_id: str, current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    # Deactivate rather than delete — products may reference this category
    supabase.table("marketplace_categories").update({"is_active": False}).eq("id", category_id).execute()
    return {"message": "Category deactivated"}


# ---------- products ----------

@router.get("/products")
def get_products(category_id: Optional[str] = None):
    q = supabase.table("marketplace_products").select("*").eq("status", "Available")
    if category_id:
        q = q.eq("category_id", category_id)
    response = q.execute()
    return response.data or []


@router.get("/products/{product_id}")
def get_product(product_id: str):
    response = supabase.table("marketplace_products").select("*").eq("id", product_id).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Product not found.")
    return response.data[0]


@router.get("/listings/mine")
def get_my_listings(current_user: dict = Depends(get_current_user)):
    _require_seller_or_admin(current_user)
    response = (
        supabase.table("marketplace_products")
        .select("*")
        .eq("seller_id", current_user["sub"])
        .order("created_at", desc=True)
        .execute()
    )
    return response.data or []


@router.post("/products")
def create_product(body: ProductCreate, current_user: dict = Depends(get_current_user)):
    _require_seller_or_admin(current_user)
    if body.price <= 0:
        raise HTTPException(status_code=400, detail="Price must be greater than zero.")
    if body.quantity_available < 0:
        raise HTTPException(status_code=400, detail="Quantity cannot be negative.")

    row = {
        "seller_id": current_user["sub"],
        "name": body.name.strip(),
        "category_id": body.category_id,
        "description": body.description,
        "price": body.price,
        "quantity_available": body.quantity_available,
        "unit": body.unit,
        "image_url": body.image_url,
        "status": "Available",
    }
    # Look up legacy category string from the parent category for backward compat
    if body.category_id:
        cat = supabase.table("marketplace_categories").select("name,parent_id").eq("id", body.category_id).limit(1).execute()
        if cat.data:
            row["category"] = cat.data[0]["name"]

    response = supabase.table("marketplace_products").insert(row).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Could not create listing.")
    return response.data[0]


@router.put("/products/{product_id}")
def update_product(product_id: str, body: ProductCreate, current_user: dict = Depends(get_current_user)):
    _require_seller_or_admin(current_user)
    existing = supabase.table("marketplace_products").select("*").eq("id", product_id).limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Listing not found.")
    if current_user.get("role") != "admin" and existing.data[0]["seller_id"] != current_user["sub"]:
        raise HTTPException(status_code=403, detail="You can only edit your own listings.")

    updates = {
        "name": body.name.strip(),
        "category_id": body.category_id,
        "description": body.description,
        "price": body.price,
        "quantity_available": body.quantity_available,
        "unit": body.unit,
        "image_url": body.image_url,
    }
    response = supabase.table("marketplace_products").update(updates).eq("id", product_id).execute()
    return response.data[0] if response.data else existing.data[0]


@router.delete("/products/{product_id}")
def deactivate_product(product_id: str, current_user: dict = Depends(get_current_user)):
    _require_seller_or_admin(current_user)
    existing = supabase.table("marketplace_products").select("*").eq("id", product_id).limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Listing not found.")
    if current_user.get("role") != "admin" and existing.data[0]["seller_id"] != current_user["sub"]:
        raise HTTPException(status_code=403, detail="You can only deactivate your own listings.")

    supabase.table("marketplace_products").update({"status": "Inactive"}).eq("id", product_id).execute()
    return {"message": "Listing deactivated"}


# ---------- cart ----------

@router.get("/cart")
def get_cart(current_user: dict = Depends(get_current_user)):
    _require_buyer(current_user)
    cart = _get_or_create_cart(current_user["sub"])
    return _cart_with_items(cart["id"])


@router.post("/cart")
def add_to_cart(body: AddToCart, current_user: dict = Depends(get_current_user)):
    _require_buyer(current_user)
    if body.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than zero.")

    product_resp = supabase.table("marketplace_products").select("*").eq("id", body.product_id).limit(1).execute()
    if not product_resp.data:
        raise HTTPException(status_code=404, detail="Product not found.")
    product = product_resp.data[0]
    if product.get("status") != "Available":
        raise HTTPException(status_code=400, detail="This product is not available.")
    if float(product.get("quantity_available") or 0) < body.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock available.")

    cart = _get_or_create_cart(current_user["sub"])

    existing = (
        supabase.table("cart_items").select("*")
        .eq("cart_id", cart["id"]).eq("product_id", body.product_id).limit(1).execute()
    )
    if existing.data:
        new_qty = float(existing.data[0]["quantity"]) + body.quantity
        if new_qty > float(product.get("quantity_available") or 0):
            raise HTTPException(status_code=400, detail="Not enough stock available.")
        supabase.table("cart_items").update({"quantity": new_qty}).eq("id", existing.data[0]["id"]).execute()
    else:
        supabase.table("cart_items").insert({
            "cart_id": cart["id"], "product_id": body.product_id, "quantity": body.quantity,
        }).execute()

    return _cart_with_items(cart["id"])


@router.put("/cart/{item_id}")
def update_cart_item(item_id: str, body: UpdateCartItem, current_user: dict = Depends(get_current_user)):
    _require_buyer(current_user)
    if body.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than zero.")
    cart = _get_or_create_cart(current_user["sub"])
    item_resp = supabase.table("cart_items").select("*").eq("id", item_id).eq("cart_id", cart["id"]).limit(1).execute()
    if not item_resp.data:
        raise HTTPException(status_code=404, detail="Cart item not found.")

    product_resp = supabase.table("marketplace_products").select("quantity_available").eq("id", item_resp.data[0]["product_id"]).limit(1).execute()
    available = float((product_resp.data[0] if product_resp.data else {}).get("quantity_available") or 0)
    if body.quantity > available:
        raise HTTPException(status_code=400, detail="Not enough stock available.")

    supabase.table("cart_items").update({"quantity": body.quantity}).eq("id", item_id).execute()
    return _cart_with_items(cart["id"])


@router.delete("/cart/{item_id}")
def remove_cart_item(item_id: str, current_user: dict = Depends(get_current_user)):
    _require_buyer(current_user)
    cart = _get_or_create_cart(current_user["sub"])
    supabase.table("cart_items").delete().eq("id", item_id).eq("cart_id", cart["id"]).execute()
    return _cart_with_items(cart["id"])


# ---------- checkout ----------

@router.post("/checkout")
def checkout(body: CheckoutBody, current_user: dict = Depends(get_current_user)):
    _require_buyer(current_user)
    if body.payment_method not in ("CASH", "MOBILE_MONEY", "CARD"):
        raise HTTPException(status_code=400, detail="Invalid payment method.")

    cart = _get_or_create_cart(current_user["sub"])
    cart_data = _cart_with_items(cart["id"])
    if not cart_data["items"]:
        raise HTTPException(status_code=400, detail="Your cart is empty.")

    by_seller: dict[str, list] = {}
    for item in cart_data["items"]:
        by_seller.setdefault(item["product"]["seller_id"], []).append(item)

    checkout_group = str(uuid.uuid4())
    created_orders = []

    for seller_id, items in by_seller.items():
        total = sum(i["line_total"] for i in items)
        deducted = []
        try:
            for item in items:
                pid = item["product"]["id"]
                qty = item["quantity"]
                prod = supabase.table("marketplace_products").select("quantity_available").eq("id", pid).limit(1).execute()
                if not prod.data:
                    raise HTTPException(status_code=400, detail=f"Product {pid} no longer exists.")
                current_avail = float(prod.data[0]["quantity_available"] or 0)
                if current_avail < qty:
                    raise HTTPException(status_code=400, detail=f"Not enough stock for {item['product']['name']}.")
                supabase.table("marketplace_products").update({"quantity_available": current_avail - qty}).eq("id", pid).execute()
                deducted.append((pid, qty))

            order_resp = supabase.table("orders").insert({
                "buyer_id": current_user["sub"],
                "seller_id": seller_id,
                "checkout_group": checkout_group,
                "total": total,
                "status": "PENDING",
                "customer_name": body.customer_name,
                "phone": body.phone,
                "delivery_location": body.delivery_location,
                "notes": body.notes,
            }).execute()
            order = order_resp.data[0]

            supabase.table("order_items").insert([
                {
                    "order_id": order["id"],
                    "product_id": item["product"]["id"],
                    "product_name": item["product"]["name"],
                    "quantity": item["quantity"],
                    "unit_price": item["product"]["price"],
                } for item in items
            ]).execute()

            supabase.table("payments").insert({
                "order_id": order["id"],
                "amount": total,
                "method": body.payment_method,
                "status": "PENDING",
                "is_simulated": body.payment_method != "CASH",
                "reference": f"{checkout_group[:8]}-{order['id'][:8]}",
            }).execute()

            created_orders.append(order)
        except HTTPException:
            for pid, q in deducted:
                p = supabase.table("marketplace_products").select("quantity_available").eq("id", pid).limit(1).execute()
                if p.data:
                    supabase.table("marketplace_products").update({"quantity_available": float(p.data[0]["quantity_available"] or 0) + q}).eq("id", pid).execute()
            raise
        except Exception as exc:
            logger.exception("Checkout failed")
            for pid, q in deducted:
                p = supabase.table("marketplace_products").select("quantity_available").eq("id", pid).limit(1).execute()
                if p.data:
                    supabase.table("marketplace_products").update({"quantity_available": float(p.data[0]["quantity_available"] or 0) + q}).eq("id", pid).execute()
            raise HTTPException(status_code=500, detail="Checkout failed.") from exc

    supabase.table("cart_items").delete().eq("cart_id", cart["id"]).execute()
    return {
        "checkout_group": checkout_group,
        "orders": created_orders,
        "payment_method": body.payment_method,
        "is_simulated": body.payment_method != "CASH",
    }


# ---------- orders ----------

@router.get("/orders")
def get_orders(current_user: dict = Depends(get_current_user)):
    role = current_user.get("role")
    uid = current_user["sub"]
    if role == "admin":
        q = supabase.table("orders").select("*")
    elif role == "farmer":
        q = supabase.table("orders").select("*").eq("seller_id", uid)
    elif role == "buyer":
        q = supabase.table("orders").select("*").eq("buyer_id", uid)
    else:
        raise HTTPException(status_code=403, detail="Not authorized.")
    response = q.order("created_at", desc=True).execute()
    return response.data or []


@router.get("/orders/{order_id}")
def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order_resp = supabase.table("orders").select("*").eq("id", order_id).limit(1).execute()
    if not order_resp.data:
        raise HTTPException(status_code=404, detail="Order not found.")
    order = order_resp.data[0]

    role = current_user.get("role")
    uid = current_user["sub"]
    allowed = (
        role == "admin"
        or (role == "buyer" and order["buyer_id"] == uid)
        or (role == "farmer" and order["seller_id"] == uid)
    )
    if not allowed:
        raise HTTPException(status_code=403, detail="Not authorized.")

    items = supabase.table("order_items").select("*").eq("order_id", order_id).execute()
    payment = supabase.table("payments").select("*").eq("order_id", order_id).limit(1).execute()
    return {
        "order": order,
        "items": items.data or [],
        "payment": payment.data[0] if payment.data else None,
    }


@router.patch("/orders/{order_id}/status")
def update_order_status(order_id: str, body: OrderStatusUpdate, current_user: dict = Depends(get_current_user)):
    _require_seller_or_admin(current_user)
    if body.status not in VALID_ORDER_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status.")

    order_resp = supabase.table("orders").select("*").eq("id", order_id).limit(1).execute()
    if not order_resp.data:
        raise HTTPException(status_code=404, detail="Order not found.")
    order = order_resp.data[0]

    if current_user.get("role") != "admin" and order["seller_id"] != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Not authorized.")

    current_status = order["status"]
    if body.status != current_status and body.status not in VALID_TRANSITIONS.get(current_status, set()):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from {current_status} to {body.status}.",
        )

    supabase.table("orders").update({"status": body.status}).eq("id", order_id).execute()

    if body.status in ("CANCELLED", "REJECTED") and current_status not in ("CANCELLED", "REJECTED"):
        for item in supabase.table("order_items").select("*").eq("order_id", order_id).execute().data or []:
            p = supabase.table("marketplace_products").select("quantity_available").eq("id", item["product_id"]).limit(1).execute()
            if p.data:
                supabase.table("marketplace_products").update({
                    "quantity_available": float(p.data[0]["quantity_available"] or 0) + float(item["quantity"]),
                }).eq("id", item["product_id"]).execute()

    return {"message": "Order status updated", "status": body.status}


# ---------- admin monitor ----------

@router.get("/admin/listings")
def admin_all_listings(current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    response = supabase.table("marketplace_products").select("*").order("created_at", desc=True).execute()
    return response.data or []


@router.patch("/admin/products/{product_id}/deactivate")
def admin_deactivate_product(product_id: str, current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    supabase.table("marketplace_products").update({"status": "Inactive"}).eq("id", product_id).execute()
    return {"message": "Listing deactivated by administrator"}