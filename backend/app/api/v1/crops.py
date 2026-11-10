from fastapi import APIRouter, Depends, HTTPException
from app.core.permissions import get_current_user
from app.database.connection import supabase
from app.services.audit_service import AuditService

router = APIRouter()


def _verify_crop_ownership(crop_id: str, user_id: str):
    crop = supabase.table("crops").select("id").eq("id", crop_id).eq("user_id", user_id).limit(1).execute()
    if not crop.data:
        raise HTTPException(status_code=404, detail="Crop not found.")


@router.get("/")
def get_all_crops(current_user: dict = Depends(get_current_user)):
    response = supabase.table("crops").select("*").eq("user_id", current_user["sub"]).execute()
    return response.data


@router.post("/")
def create_crop(crop: dict, current_user: dict = Depends(get_current_user)):
    crop["user_id"] = current_user["sub"]
    response = supabase.table("crops").insert(crop).execute()
    created = response.data[0]
    AuditService.log(current_user["sub"], "CREATE_CROP", f"Added crop {created.get('name', 'Crop')}")
    return created


@router.get("/{crop_id}")
def get_crop(crop_id: str, current_user: dict = Depends(get_current_user)):
    response = supabase.table("crops").select("*").eq("id", crop_id).eq("user_id", current_user["sub"]).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Crop not found.")
    return response.data[0]


@router.put("/{crop_id}")
def update_crop(crop_id: str, crop: dict, current_user: dict = Depends(get_current_user)):
    crop.pop("user_id", None)
    response = supabase.table("crops").update(crop).eq("id", crop_id).eq("user_id", current_user["sub"]).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Crop not found.")
    updated = response.data[0]
    AuditService.log(current_user["sub"], "UPDATE_CROP", f"Updated crop {updated.get('name', crop_id)}")
    return updated


@router.delete("/{crop_id}")
def delete_crop(crop_id: str, current_user: dict = Depends(get_current_user)):
    response = supabase.table("crops").delete().eq("id", crop_id).eq("user_id", current_user["sub"]).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Crop not found.")
    AuditService.log(current_user["sub"], "DELETE_CROP", f"Deleted crop {response.data[0].get('name', crop_id)}")
    return {"message": "Crop deleted"}


@router.get("/{crop_id}/plantings")
def get_plantings(crop_id: str, current_user: dict = Depends(get_current_user)):
    _verify_crop_ownership(crop_id, current_user["sub"])
    response = (
        supabase.table("planting_records")
        .select("*")
        .eq("crop_id", crop_id)
        .order("planting_date", desc=True)
        .execute()
    )
    return response.data or []


@router.get("/{crop_id}/harvests")
def get_harvests(crop_id: str, current_user: dict = Depends(get_current_user)):
    _verify_crop_ownership(crop_id, current_user["sub"])
    response = (
        supabase.table("harvest_records")
        .select("*")
        .eq("crop_id", crop_id)
        .order("harvest_date", desc=True)
        .execute()
    )
    return response.data or []