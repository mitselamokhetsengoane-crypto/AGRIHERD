from fastapi import APIRouter, Depends, HTTPException
from app.core.permissions import get_current_user
from app.database.connection import supabase
from app.services.audit_service import AuditService

router = APIRouter()

@router.get("/")
def get_inventory(current_user: dict = Depends(get_current_user)):
    response = supabase.table("inventory").select("*").eq("user_id", current_user["sub"]).execute()
    return response.data

@router.get("/low-stock")
def get_low_stock(current_user: dict = Depends(get_current_user)):
    response = (
        supabase.table("inventory")
        .select("*")
        .eq("user_id", current_user["sub"])
        .execute()
    )
    return [
        item for item in response.data
        if float(item.get("quantity") or 0) <= float(item.get("minimum_stock_level") or 0)
    ]

@router.get("/history")
def get_stock_history(current_user: dict = Depends(get_current_user)):
    items = (
        supabase.table("inventory")
        .select("id")
        .eq("user_id", current_user["sub"])
        .execute()
        .data
    )
    item_ids = [item["id"] for item in items]
    if not item_ids:
        return []

    response = (
        supabase.table("inventory_transactions")
        .select("*")
        .in_("item_id", item_ids)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data

@router.get("/{item_id}")
def get_item(item_id: str, current_user: dict = Depends(get_current_user)):
    response = (
        supabase.table("inventory")
        .select("*")
        .eq("id", item_id)
        .eq("user_id", current_user["sub"])
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return response.data[0]

@router.post("/")
def create_item(item: dict, current_user: dict = Depends(get_current_user)):
    item["user_id"] = current_user["sub"]
    response = supabase.table("inventory").insert(item).execute()
    created = response.data[0]
    AuditService.log(current_user["sub"], "CREATE_INVENTORY_ITEM", f"Added inventory item {created.get('name', 'Item')}")
    return created

@router.put("/{item_id}")
def update_item(item_id: str, item: dict, current_user: dict = Depends(get_current_user)):
    item.pop("user_id", None)
    response = (
        supabase.table("inventory")
        .update(item)
        .eq("id", item_id)
        .eq("user_id", current_user["sub"])
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    updated = response.data[0]
    AuditService.log(current_user["sub"], "UPDATE_INVENTORY_ITEM", f"Updated inventory item {updated.get('name', item_id)}")
    return updated

@router.post("/{item_id}/stock")
def update_stock(item_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    item_response = (
        supabase.table("inventory")
        .select("*")
        .eq("id", item_id)
        .eq("user_id", current_user["sub"])
        .execute()
    )
    if not item_response.data:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    item = item_response.data[0]
    try:
        change_amount = float(data["change_amount"])
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail="A numeric change_amount is required") from exc

    new_quantity = float(item.get("quantity") or 0) + change_amount
    if new_quantity < 0:
        raise HTTPException(status_code=422, detail="Stock quantity cannot be negative")

    minimum_stock = float(item.get("minimum_stock_level") or 0)
    updated = (
        supabase.table("inventory")
        .update({
            "quantity": new_quantity,
            "stock_status": "Low Stock" if new_quantity <= minimum_stock else "In Stock",
        })
        .eq("id", item_id)
        .eq("user_id", current_user["sub"])
        .execute()
    )
    supabase.table("inventory_transactions").insert({
        "item_id": item_id,
        "item_name": item["name"],
        "change_amount": change_amount,
        "reason": data.get("reason"),
    }).execute()
    AuditService.log(
        current_user["sub"],
        "UPDATE_INVENTORY_STOCK",
        f"Updated stock for {item['name']} to {new_quantity:g}",
    )
    return updated.data[0]

@router.delete("/{item_id}")
def delete_item(item_id: str, current_user: dict = Depends(get_current_user)):
    response = (
        supabase.table("inventory")
        .delete()
        .eq("id", item_id)
        .eq("user_id", current_user["sub"])
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    AuditService.log(current_user["sub"], "DELETE_INVENTORY_ITEM", f"Deleted inventory item {response.data[0].get('name', item_id)}")
    return {"message": "Inventory item deleted"}