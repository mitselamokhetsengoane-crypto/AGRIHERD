from fastapi import APIRouter, Depends, HTTPException
from app.core.permissions import get_current_user
from app.database.connection import supabase

router = APIRouter()

@router.get("/")
def get_all_crops(current_user: dict = Depends(get_current_user)):
    response = supabase.table("crops").select("*").eq("user_id", current_user["sub"]).execute()
    return response.data

@router.post("/")
def create_crop(crop: dict, current_user: dict = Depends(get_current_user)):
    crop["user_id"] = current_user["sub"]
    response = supabase.table("crops").insert(crop).execute()
    return response.data[0]