from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Literal
from app.core.permissions import require_role
from app.database.connection import supabase

router = APIRouter()

class RoleUpdate(BaseModel):
    role: Literal["farmer", "worker", "admin"]

@router.get("/overview")
def get_platform_overview(current_user: dict = Depends(require_role("admin"))):
    try:
        # Fetch aggregated counts from Supabase
        users_res = supabase.table("profiles").select("role", count="exact").execute()
        farms_res = supabase.table("farms").select("id", count="exact").execute()
        
        # Calculate farmer count
        farmers = sum(1 for u in users_res.data if u["role"] == "farmer")
        
        return {
            "total_users": users_res.count or 0,
            "total_farms": farms_res.count or 0,
            "total_farmers": farmers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/audit-logs")
def get_audit_logs(current_user: dict = Depends(require_role("admin"))):
    response = supabase.table("audit_logs").select("*").order("created_at", desc=True).limit(50).execute()
    return response.data

@router.get("/users")
def get_all_users(current_user: dict = Depends(require_role("admin"))):
    response = supabase.table("profiles").select("id, full_name, email, role, created_at").execute()
    return response.data

@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: str,
    role_update: RoleUpdate,
    current_user: dict = Depends(require_role("admin")),
):
    if current_user.get("sub") == user_id:
        raise HTTPException(status_code=400, detail="You cannot change your own role")
    response = (
        supabase.table("profiles")
        .update({"role": role_update.role})
        .eq("id", user_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
    return response.data[0]

@router.get("/farms")
def get_all_farms(current_user: dict = Depends(require_role("admin"))):
    response = (
        supabase.table("farms")
        .select("id, owner_id, farm_name, location, size_hectares, created_at")
        .order("created_at", desc=True)
        .execute()
    )
    return response.data