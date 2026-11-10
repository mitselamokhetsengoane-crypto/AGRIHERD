from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Literal, Optional

from app.core.permissions import require_role
from app.database.connection import supabase
from app.services.audit_service import AuditService

router = APIRouter()


class StatusUpdate(BaseModel):
    account_status: Literal["PENDING", "ACTIVE", "SUSPENDED", "DEACTIVATED"]


@router.get("/users")
def list_users(
    role: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    q: Optional[str] = Query(default=None),
    current_user: dict = Depends(require_role("admin")),
):
    query = supabase.table("profiles").select(
        "id,full_name,email,phone,role,account_status,created_at"
    )
    if role:
        query = query.eq("role", role)
    if status:
        query = query.eq("account_status", status)
    if q:
        query = query.or_(f"full_name.ilike.%{q}%,email.ilike.%{q}%")
    resp = query.order("created_at", desc=True).limit(500).execute()
    return resp.data or []


@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    body: StatusUpdate,
    current_user: dict = Depends(require_role("admin")),
):
    # Do not allow admin to demote / suspend themselves or the last active admin
    if user_id == current_user["sub"] and body.account_status != "ACTIVE":
        raise HTTPException(400, "You cannot deactivate your own account.")

    if body.account_status == "DEACTIVATED":
        other = (
            supabase.table("profiles")
            .select("id", count="exact")
            .eq("role", "admin")
            .eq("account_status", "ACTIVE")
            .neq("id", user_id)
            .execute()
        )
        if (other.count or 0) == 0:
            raise HTTPException(400, "Cannot deactivate the last active administrator.")

    resp = (
        supabase.table("profiles")
        .update({"account_status": body.account_status})
        .eq("id", user_id)
        .execute()
    )
    if not resp.data:
        raise HTTPException(404, "User not found.")

    AuditService.log(
        current_user["sub"],
        "UPDATE_USER_STATUS",
        f"user={user_id} status={body.account_status}",
    )
    return resp.data[0]


@router.patch("/users/{user_id}/approve")
def approve_farmer(user_id: str, current_user: dict = Depends(require_role("admin"))):
    resp = (
        supabase.table("profiles")
        .update({"account_status": "ACTIVE"})
        .eq("id", user_id)
        .eq("role", "farmer")
        .execute()
    )
    if not resp.data:
        raise HTTPException(404, "Pending farmer not found.")
    AuditService.log(current_user["sub"], "APPROVE_FARMER", f"user={user_id}")
    return resp.data[0]


@router.get("/ai/summary")
def ai_summary(current_user: dict = Depends(require_role("admin"))):
    # Counts that exist today; the prediction metrics arrive with Batch 2
    scans = supabase.table("disease_scans").select("id", count="exact").execute()
    return {
        "disease_scan_count": scans.count or 0,
        "model_version": None,
        "last_training_date": None,
        "evaluation_metrics": None,
        "note": "Sales prediction model is not yet deployed.",
    }


@router.get("/blockchain/all")
def blockchain_all(
    limit: int = Query(200, ge=1, le=1000),
    current_user: dict = Depends(require_role("admin")),
):
    resp = (
        supabase.table("blockchain_records")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return resp.data or []


@router.get("/audit-logs")
def admin_audit_logs(
    limit: int = Query(200, ge=1, le=1000),
    current_user: dict = Depends(require_role("admin")),
):
    resp = (
        supabase.table("audit_logs")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return resp.data or []