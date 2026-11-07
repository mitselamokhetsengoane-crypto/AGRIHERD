from fastapi import APIRouter, Depends
from app.core.permissions import get_current_user
from app.database.connection import supabase

router = APIRouter()

@router.get("/")
def get_inventory(current_user: dict = Depends(get_current_user)):
    response = supabase.table("inventory").select("*").eq("user_id", current_user["sub"]).execute()
    return response.data

@router.post("/")
def create_item(item: dict, current_user: dict = Depends(get_current_user)):
    item["user_id"] = current_user["sub"]
    response = supabase.table("inventory").insert(item).execute()
    return response.data[0]