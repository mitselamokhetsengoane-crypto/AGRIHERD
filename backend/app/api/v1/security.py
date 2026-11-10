from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Literal, Optional
from app.core.permissions import require_role
from app.database.connection import supabase
from app.services.audit_service import AuditService

router = APIRouter()


class RoleUpdate(BaseModel):
    role: Literal["farmer", "buyer", "admin"]


class StatusUpdate(BaseModel):
    account_status: Literal["PENDING", "ACTIVE", "SUSPENDED", "DEACTIVATED"]


class SettingUpdate(BaseModel):
    setting_value: str


class AuditEntry(BaseModel):
    action: str
    details: Optional[str] = None


@router.get("/overview")
def get_platform_overview(current_user: dict = Depends(require_role("admin"))):
    try:
        users_res = supabase.table("profiles").select("role, account_status", count="exact").execute()
        farms_res = supabase.table("farms").select("id", count="exact").execute()
        rows = users_res.data or []
        return {
            "total_users": users_res.count or 0,
            "total_farms": farms_res.count or 0,
            "total_farmers": sum(1 for u in rows if u.get("role") == "farmer"),
            "total_buyers": sum(1 for u in rows if u.get("role") == "buyer"),
            "pending_accounts": sum(1 for u in rows if u.get("account_status") == "PENDING"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/role-permissions")
def get_role_permissions(current_user: dict = Depends(require_role("admin"))):
    return supabase.table("role_permissions").select("*").order("role").order("module").execute().data or []


@router.get("/data-classification")
def get_data_classification(current_user: dict = Depends(require_role("admin"))):
    response = supabase.table("data_classification").select("*").execute()
    grouped = {"public": [], "private": [], "confidential": [], "restricted": []}
    for row in response.data or []:
        key = row.get("classification")
        if key in grouped:
            grouped[key].append(row)
    return grouped


@router.get("/system-settings")
def get_system_settings(current_user: dict = Depends(require_role("admin"))):
    return supabase.table("system_settings").select("*").order("setting_key").execute().data or []


@router.patch("/system-settings/{setting_key}")
def update_system_setting(setting_key: str, body: SettingUpdate, current_user: dict = Depends(require_role("admin"))):
    response = supabase.table("system_settings").update({"setting_value": body.setting_value}).eq("setting_key", setting_key).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Setting not found.")
    AuditService.log(current_user["sub"], "UPDATE_SETTING", f"{setting_key} = {body.setting_value}")
    return response.data[0]


@router.get("/audit-logs")
def get_audit_logs(current_user: dict = Depends(require_role("admin"))):
    # Use the AuditService to ensure it handles empty tables gracefully
    return AuditService.get_logs(limit=200)


@router.post("/audit-logs", status_code=201)
def create_audit_log(entry: AuditEntry, current_user: dict = Depends(require_role("admin"))):
    AuditService.log(current_user["sub"], entry.action, entry.details or "")
    return {"message": "Audit entry logged"}


@router.get("/users")
def get_all_users(current_user: dict = Depends(require_role("admin"))):
    return (
        supabase.table("profiles")
        .select("id, full_name, email, role, account_status, created_at")
        .execute()
        .data
        or []
    )


@router.put("/users/{user_id}/role")
def update_user_role(user_id: str, role_update: RoleUpdate, current_user: dict = Depends(require_role("admin"))):
    if current_user.get("sub") == user_id:
        raise HTTPException(status_code=400, detail="You cannot change your own role")
    response = supabase.table("profiles").update({"role": role_update.role}).eq("id", user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
    AuditService.log(current_user["sub"], "UPDATE_USER_ROLE", f"User {user_id} → {role_update.role}")
    return response.data[0]


@router.patch("/users/{user_id}/status")
def update_user_status(user_id: str, body: StatusUpdate, current_user: dict = Depends(require_role("admin"))):
    if current_user.get("sub") == user_id:
        raise HTTPException(status_code=400, detail="You cannot change your own status")
    response = supabase.table("profiles").update({"account_status": body.account_status}).eq("id", user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
    AuditService.log(current_user["sub"], "UPDATE_USER_STATUS", f"User {user_id} → {body.account_status}")
    return response.data[0]


@router.get("/farms")
def get_all_farms(current_user: dict = Depends(require_role("admin"))):
    return (
        supabase.table("farms")
        .select("id, owner_id, farm_name, location, size_hectares, created_at")
        .order("created_at", desc=True)
        .execute()
        .data
        or []
    )