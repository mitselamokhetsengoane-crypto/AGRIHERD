from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.core.permissions import get_current_user
from app.database.connection import supabase

router = APIRouter()


class FarmCreate(BaseModel):
    farm_name: str = Field(min_length=1, max_length=150)
    location: Optional[str] = None
    size_hectares: Optional[float] = None
    description: Optional[str] = None


@router.get("/")
def list_farms(current_user: dict = Depends(get_current_user)):
    resp = (
        supabase.table("farms")
        .select("*")
        .eq("owner_id", current_user["sub"])
        .order("created_at", desc=True)
        .execute()
    )
    return resp.data or []


@router.get("/{farm_id}")
def get_farm(farm_id: str, current_user: dict = Depends(get_current_user)):
    resp = (
        supabase.table("farms")
        .select("*")
        .eq("id", farm_id)
        .eq("owner_id", current_user["sub"])
        .limit(1)
        .execute()
    )
    if not resp.data:
        raise HTTPException(404, "Farm not found.")
    return resp.data[0]


@router.post("/", status_code=201)
def create_farm(body: FarmCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "farmer":
        raise HTTPException(403, "Only farmers can create farms.")
    row = {
        "owner_id": current_user["sub"],
        "farm_name": body.farm_name.strip(),
        "location": body.location,
        "size_hectares": body.size_hectares,
        "description": body.description,
    }
    resp = supabase.table("farms").insert(row).execute()
    if not resp.data:
        raise HTTPException(500, "Could not create farm.")
    return resp.data[0]


@router.put("/{farm_id}")
def update_farm(farm_id: str, body: FarmCreate, current_user: dict = Depends(get_current_user)):
    resp = (
        supabase.table("farms")
        .update({
            "farm_name": body.farm_name.strip(),
            "location": body.location,
            "size_hectares": body.size_hectares,
            "description": body.description,
        })
        .eq("id", farm_id)
        .eq("owner_id", current_user["sub"])
        .execute()
    )
    if not resp.data:
        raise HTTPException(404, "Farm not found or not yours.")
    return resp.data[0]


@router.delete("/{farm_id}")
def delete_farm(farm_id: str, current_user: dict = Depends(get_current_user)):
    # Only allow delete if no livestock/crops reference it
    live = supabase.table("livestock").select("id").eq("farm_id", farm_id).limit(1).execute()
    crops = supabase.table("crops").select("id").eq("farm_id", farm_id).limit(1).execute()
    if (live.data or crops.data):
        raise HTTPException(409, "Farm has livestock or crops. Move or delete them first.")
    resp = (
        supabase.table("farms")
        .delete()
        .eq("id", farm_id)
        .eq("owner_id", current_user["sub"])
        .execute()
    )
    if not resp.data:
        raise HTTPException(404, "Farm not found or not yours.")
    return {"message": "Farm deleted"}