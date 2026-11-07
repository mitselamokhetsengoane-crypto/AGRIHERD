from fastapi import APIRouter, Depends
from app.core.permissions import get_current_user
from app.database.connection import supabase

router = APIRouter()

@router.get("/products")
def get_products():
    # Anyone can view products
    response = supabase.table("marketplace_products").select("*").execute()
    return response.data

@router.post("/products")
def create_product(product: dict, current_user: dict = Depends(get_current_user)):
    product["seller_id"] = current_user["sub"]
    response = supabase.table("marketplace_products").insert(product).execute()
    return response.data[0]