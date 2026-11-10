import logging
import uuid
from io import BytesIO
from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.permissions import get_current_user
from app.database.connection import supabase
from app.services.income_service import IncomeService
from app.services.blockchain_trigger import record_order_on_chain

router = APIRouter()
logger = logging.getLogger(__name__)
MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024
ALLOWED_PRODUCT_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}

VALID_ORDER_STATUSES = {
    "PENDING", "ACCEPTED", "REJECTED", "PREPARING", "READY", "COMPLETED", "CANCELLED",
}

VALID_TRANSITIONS = {
    "PENDING": {"ACCEPTED", "REJECTED", "CANCELLED"},
    "ACCEPTED": {"PREPARING", "CANCELLED"},
    "PREPARING": {"READY", "CANCELLED"},
    "READY": {"COMPLETED", "CANCELLED"},
    "COMPLETED": set(),
    "REJECTED": set(),
    "CANCELLED": set(),
}


class AddToCart(BaseModel):
    product_id: str
    quantity: float = Field(gt=0)


class UpdateCartItem(BaseModel):
    quantity: float = Field(gt=0)


class CheckoutBody(BaseModel):
    customer_name: str = Field(min_length=1, max_length=150)
    phone: str = Field(min_length=1, max_length=50)
    delivery_location: str = Field(min_length=1, max_length=255)
    notes: Optional[str] = Field(default=None, max_length=2000)
    payment_method: Literal["CASH", "MOBILE_MONEY", "CARD"]
    idempotency_key: uuid.UUID


class OrderStatusUpdate(BaseModel):
    status: str


class ProductCreate(BaseModel):
    name: str
    category_id: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    price: float
    quantity_available: float
    unit: Optional[str] = None
    image_url: Optional[str] = None


class CategoryCreate(BaseModel):
    name: str
    parent_id: Optional[str] = None


def _require_buyer(user: dict) -> None:
    if user.get("role") != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can perform this action.")


def _require_seller_or_admin(user: dict) -> None:
    if user.get("role") not in ("farmer", "admin"):
        raise HTTPException(status_code=403, detail="Only sellers or administrators can perform this action.")


def _require_admin(user: dict) -> None:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Administrators only.")


def _product_image_storage_failure(exc: Exception) -> HTTPException:
    error_parts = (
        str(exc),
        getattr(exc, "message", ""),
        getattr(exc, "code", ""),
        getattr(exc, "status", ""),
    )
    message = " ".join(str(part) for part in error_parts if part).lower()

    if "bucket not found" in message or ("404" in message and "bucket" in message):
        return HTTPException(
            status_code=503,
            detail=(
                f"The '{settings.PRODUCT_IMAGE_BUCKET}' storage bucket is missing. "
                "Apply database/migrations/012_admin_dashboard_and_product_images.sql in Supabase."
            ),
        )
    if any(term in message for term in ("row-level security", "unauthorized", "not authorized", "403")):
        return HTTPException(
            status_code=503,
            detail=(
                "Supabase denied the product image upload. Verify that Render's "
                "SUPABASE_SERVICE_ROLE_KEY is a service-role key and redeploy the backend."
            ),
        )
    if any(term in message for term in ("invalid api key", "invalid jwt", "apikey", "401")):
        return HTTPException(
            status_code=503,
            detail="Supabase rejected the backend storage credentials. Verify the Render Supabase service-role key.",
        )
    if any(term in message for term in ("timed out", "timeout", "connection")):
        return HTTPException(
            status_code=503,
            detail="Supabase Storage could not be reached. Check the Supabase project status and try again.",
        )

    return HTTPException(
        status_code=502,
        detail=(
            "Supabase Storage could not save the image. Check the backend logs for "
            "the product-image upload error and verify the marketplace-products bucket."
        ),
    )


def _get_or_create_cart(buyer_id: str) -> dict:
    existing = supabase.table("carts").select("*").eq("buyer_id", buyer_id).limit(1).execute()
    if existing.data:
        return existing.data[0]
    try:
        created = supabase.table("carts").insert({"buyer_id": buyer_id}).execute()
    except Exception:
        existing = supabase.table("carts").select("*").eq("buyer_id", buyer_id).limit(1).execute()
        if existing.data:
            return existing.data[0]
        logger.exception("Could not create cart for buyer %s", buyer_id)
        raise HTTPException(status_code=500, detail="Could not create cart.")
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
    subtotal = 0.0
    enriched = []
    for row in items:
        product = row.get("marketplace_products") or {}
        price = float(product.get("price") or 0)
        qty = float(row.get("quantity") or 0)
        line_total = price * qty
        subtotal += line_total
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
    return {
        "id": cart_id,
        "items": enriched,
        "item_count": sum(item["quantity"] for item in enriched),
        "subtotal": subtotal,
        "total": subtotal,
    }


def _raise_marketplace_rpc_error(exc: Exception, operation: str) -> None:
    message = str(exc)
    lowered = message.lower()
    if (
        "pgrst202" in lowered
        or "could not find the function" in lowered
        or ("schema cache" in lowered and "function" in lowered)
    ):
        logger.error("%s unavailable in the Supabase schema cache: %s", operation, message)
        raise HTTPException(
            status_code=503,
            detail=(
                "Marketplace database functions are not installed or not yet visible. "
                "Apply database/migrations/011_buyer_marketplace_checkout.sql in Supabase, "
                "then reload the API schema cache or restart the backend."
            ),
        ) from exc
    if (
        "pgrst205" in lowered
        or "could not find the table" in lowered
        or "42p01" in lowered
        or "42703" in lowered
        or "undefined table" in lowered
        or "undefined column" in lowered
    ):
        logger.error("%s failed because the marketplace schema is incomplete: %s", operation, message)
        raise HTTPException(
            status_code=503,
            detail=(
                "The Supabase marketplace schema is incomplete. Apply migrations "
                "database/migrations/002_cart_orders.sql and "
                "database/migrations/011_buyer_marketplace_checkout.sql, then reload "
                "the Supabase API schema cache."
            ),
        ) from exc
    if "cart item not found" in lowered or "product not found" in lowered:
        raise HTTPException(status_code=404, detail="Cart item or product not found.") from exc
    if "not enough stock" in lowered or "no longer has enough stock" in lowered:
        raise HTTPException(status_code=409, detail="Not enough stock is available.") from exc
    if "not available" in lowered or "unavailable" in lowered:
        raise HTTPException(status_code=409, detail="A product is no longer available.") from exc
    if "cart is empty" in lowered:
        raise HTTPException(status_code=400, detail="Your cart is empty.") from exc
    if "quantity must" in lowered or "invalid payment" in lowered or "are required" in lowered:
        raise HTTPException(status_code=422, detail=message.splitlines()[0]) from exc
    if "already being processed" in lowered:
        raise HTTPException(status_code=409, detail="This checkout is already being processed.") from exc
    logger.error("%s failed: %s", operation, exc)
    raise HTTPException(status_code=500, detail=f"{operation} failed.") from exc


def _updated_cart(cart_id: str, operation: str) -> dict:
    try:
        return _cart_with_items(cart_id)
    except Exception as exc:
        logger.exception("%s succeeded but its cart response could not be loaded", operation)
        _raise_marketplace_rpc_error(exc, f"{operation} cart refresh")


@router.get("/categories")
def list_categories():
    return supabase.table("marketplace_categories").select("*").eq("is_active", True).order("name").execute().data or []


@router.get("/categories/all")
def list_all_categories(current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    return supabase.table("marketplace_categories").select("*").order("name").execute().data or []


@router.post("/categories")
def create_category(body: CategoryCreate, current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Category name is required.")
    try:
        response = supabase.table("marketplace_categories").insert({
            "name": name, "parent_id": body.parent_id,
        }).execute()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not create category: {exc}")
    return response.data[0]


@router.delete("/categories/{category_id}")
def delete_category(category_id: str, current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    supabase.table("marketplace_categories").update({"is_active": False}).eq("id", category_id).execute()
    return {"message": "Category deactivated"}


@router.get("/products")
def get_products(category_id: Optional[str] = None):
    q = (
        supabase.table("marketplace_products")
        .select("*")
        .eq("status", "Available")
        .gt("quantity_available", 0)
    )
    if category_id:
        q = q.eq("category_id", category_id)
    products = q.execute().data or []
    if not products:
        return []
    sellers = (
        supabase.table("profiles")
        .select("id,full_name,farm_name,location")
        .in_("id", list({product["seller_id"] for product in products}))
        .execute()
        .data or []
    )
    seller_by_id = {seller["id"]: seller for seller in sellers}
    for product in products:
        product["seller"] = seller_by_id.get(product["seller_id"])
    return products


@router.get("/products/{product_id}")
def get_product(product_id: str):
    response = (
        supabase.table("marketplace_products")
        .select("*")
        .eq("id", product_id)
        .eq("status", "Available")
        .gt("quantity_available", 0)
        .limit(1)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Product not found.")
    product = response.data[0]
    seller = (
        supabase.table("profiles")
        .select("full_name,farm_name,location")
        .eq("id", product["seller_id"])
        .limit(1)
        .execute()
    )
    product["seller"] = seller.data[0] if seller.data else None
    return product


@router.post("/products/image")
def upload_product_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    _require_seller_or_admin(current_user)
    raw = file.file.read(MAX_PRODUCT_IMAGE_BYTES + 1)
    if not raw:
        raise HTTPException(status_code=400, detail="Choose an image to upload.")
    if len(raw) > MAX_PRODUCT_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Product images must be 5 MB or smaller.")

    try:
        with Image.open(BytesIO(raw)) as probe:
            image_format = probe.format
            probe.verify()
        if image_format not in ALLOWED_PRODUCT_IMAGE_FORMATS:
            raise HTTPException(status_code=400, detail="Use a JPEG, PNG, or WEBP image.")

        with Image.open(BytesIO(raw)) as source:
            image = ImageOps.exif_transpose(source).convert("RGB")
            image.thumbnail((1600, 1600))
            output = BytesIO()
            image.save(output, format="JPEG", quality=88, optimize=True)
            image_bytes = output.getvalue()
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid image.") from exc

    object_path = f"{current_user['sub']}/{uuid.uuid4().hex}.jpg"
    try:
        storage = supabase.storage.from_(settings.PRODUCT_IMAGE_BUCKET)
        storage.upload(
            object_path,
            image_bytes,
            {"content-type": "image/jpeg", "upsert": "false"},
        )
        image_url = storage.get_public_url(object_path)
        if isinstance(image_url, dict):
            image_url = image_url.get("publicUrl") or (image_url.get("data") or {}).get("publicUrl")
        if not isinstance(image_url, str) or not image_url:
            raise RuntimeError("Storage returned no public image URL.")
    except Exception as exc:
        logger.exception("Product image upload failed for seller %s", current_user["sub"])
        raise _product_image_storage_failure(exc) from exc

    return {"image_url": image_url}


@router.get("/listings/mine")
def get_my_listings(current_user: dict = Depends(get_current_user)):
    _require_seller_or_admin(current_user)
    return (
        supabase.table("marketplace_products")
        .select("*")
        .eq("seller_id", current_user["sub"])
        .order("created_at", desc=True)
        .execute()
        .data or []
    )


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
    if body.category_id:
        cat = supabase.table("marketplace_categories").select("name").eq("id", body.category_id).limit(1).execute()
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

    response = supabase.table("marketplace_products").update({
        "name": body.name.strip(),
        "category_id": body.category_id,
        "description": body.description,
        "price": body.price,
        "quantity_available": body.quantity_available,
        "unit": body.unit,
        "image_url": body.image_url,
    }).eq("id", product_id).execute()
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


@router.get("/cart")
def get_cart(current_user: dict = Depends(get_current_user)):
    _require_buyer(current_user)
    cart = _get_or_create_cart(current_user["sub"])
    return _cart_with_items(cart["id"])


@router.post("/cart")
def add_to_cart(body: AddToCart, current_user: dict = Depends(get_current_user)):
    _require_buyer(current_user)
    try:
        response = supabase.rpc(
            "add_marketplace_cart_item",
            {
                "p_buyer_id": current_user["sub"],
                "p_product_id": body.product_id,
                "p_quantity": body.quantity,
            },
        ).execute()
    except Exception as exc:
        _raise_marketplace_rpc_error(exc, "Adding product to cart")
    if not response.data:
        raise HTTPException(
            status_code=502,
            detail="The marketplace database did not return the updated cart.",
        )
    return _updated_cart(str(response.data), "Adding product")


@router.put("/cart/{item_id}")
def update_cart_item(item_id: str, body: UpdateCartItem, current_user: dict = Depends(get_current_user)):
    _require_buyer(current_user)
    try:
        response = supabase.rpc(
            "set_marketplace_cart_item_quantity",
            {
                "p_buyer_id": current_user["sub"],
                "p_item_id": item_id,
                "p_quantity": body.quantity,
            },
        ).execute()
    except Exception as exc:
        _raise_marketplace_rpc_error(exc, "Updating cart quantity")
    return _updated_cart(str(response.data), "Updating cart quantity")


@router.delete("/cart/{item_id}")
def remove_cart_item(item_id: str, current_user: dict = Depends(get_current_user)):
    _require_buyer(current_user)
    cart = _get_or_create_cart(current_user["sub"])
    supabase.table("cart_items").delete().eq("id", item_id).eq("cart_id", cart["id"]).execute()
    return _cart_with_items(cart["id"])


@router.delete("/cart")
def clear_cart(current_user: dict = Depends(get_current_user)):
    _require_buyer(current_user)
    cart = _get_or_create_cart(current_user["sub"])
    supabase.table("cart_items").delete().eq("cart_id", cart["id"]).execute()
    return _cart_with_items(cart["id"])


@router.post("/checkout")
def checkout(body: CheckoutBody, current_user: dict = Depends(get_current_user)):
    _require_buyer(current_user)
    try:
        response = supabase.rpc(
            "checkout_marketplace_cart",
            {
                "p_buyer_id": current_user["sub"],
                "p_idempotency_key": str(body.idempotency_key),
                "p_customer_name": body.customer_name.strip(),
                "p_phone": body.phone.strip(),
                "p_delivery_location": body.delivery_location.strip(),
                "p_notes": body.notes.strip() if body.notes else None,
                "p_payment_method": body.payment_method,
            },
        ).execute()
    except Exception as exc:
        _raise_marketplace_rpc_error(exc, "Checkout")
    if not response.data:
        raise HTTPException(status_code=500, detail="Checkout did not return an order.")
    return response.data


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
    orders = q.order("created_at", desc=True).execute().data or []
    if not orders:
        return []

    order_ids = [order["id"] for order in orders]
    payments = (
        supabase.table("payments")
        .select("order_id,method,status")
        .in_("order_id", order_ids)
        .execute()
        .data or []
    )
    payment_by_order = {payment["order_id"]: payment for payment in payments}
    order_items = (
        supabase.table("order_items")
        .select("order_id,product_name,quantity")
        .in_("order_id", order_ids)
        .execute()
        .data or []
    )
    items_by_order: dict = {}
    for item in order_items:
        summary = items_by_order.setdefault(item["order_id"], [])
        summary.append({
            "product_name": item["product_name"],
            "quantity": float(item["quantity"]),
        })

    for order in orders:
        payment = payment_by_order.get(order["id"])
        order["payment_method"] = payment.get("method") if payment else None
        order["payment_status"] = payment.get("status") if payment else None
        order["items"] = items_by_order.get(order["id"], [])
    return orders


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
    blockchain = supabase.table("blockchain_records").select("*").eq("order_id", order_id).limit(1).execute()
    return {
        "order": order,
        "items": items.data or [],
        "payment": payment.data[0] if payment.data else None,
        "blockchain": blockchain.data[0] if blockchain.data else None,
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

    now_iso = datetime.now(timezone.utc).isoformat()
    update_row = {"status": body.status, "status_updated_at": now_iso}
    if body.status == "COMPLETED":
        update_row["completed_at"] = now_iso

    supabase.table("orders").update(update_row).eq("id", order_id).execute()

    # Restore stock on rejection/cancellation
    if body.status in ("CANCELLED", "REJECTED") and current_status not in ("CANCELLED", "REJECTED"):
        for item in supabase.table("order_items").select("*").eq("order_id", order_id).execute().data or []:
            p = supabase.table("marketplace_products").select("quantity_available").eq("id", item["product_id"]).limit(1).execute()
            if p.data:
                supabase.table("marketplace_products").update({
                    "quantity_available": float(p.data[0]["quantity_available"] or 0) + float(item["quantity"]),
                }).eq("id", item["product_id"]).execute()

    # Notify the buyer on any change
    try:
        supabase.table("notifications").insert({
            "user_id": order["buyer_id"],
            "title": f"Order {body.status.title()}",
            "message": f"Your order #{order_id[:8]} is now {body.status}.",
            "category": "ORDER",
        }).execute()
    except Exception as exc:
        logger.error(f"Buyer notification failed: {exc}")

    # On completion: mark cash as PAID first, THEN record income and submit to chain.
    if body.status == "COMPLETED":
        payment_resp = supabase.table("payments").select("*").eq("order_id", order_id).limit(1).execute()
        if payment_resp.data:
            payment = payment_resp.data[0]
            if payment.get("method") == "CASH" and payment.get("status") == "PENDING":
                supabase.table("payments").update({
                    "status": "PAID",
                    "confirmed_at": now_iso,
                }).eq("order_id", order_id).execute()

        IncomeService.record_marketplace_income(order_id)
        try:
            record_order_on_chain(order_id)
        except Exception as exc:
            logger.error(f"Blockchain trigger raised: {exc}")

    return {"message": "Order status updated", "status": body.status}


@router.get("/admin/listings")
def admin_all_listings(current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    return supabase.table("marketplace_products").select("*").order("created_at", desc=True).execute().data or []


@router.patch("/admin/products/{product_id}/deactivate")
def admin_deactivate_product(product_id: str, current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    supabase.table("marketplace_products").update({"status": "Inactive"}).eq("id", product_id).execute()
    return {"message": "Listing deactivated by administrator"}