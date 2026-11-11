import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Literal, Optional

from app.core.permissions import require_admin_module
from app.database.connection import supabase
from app.services.audit_service import AuditService
from app.services.blockchain_service import blockchain_service

router = APIRouter()
logger = logging.getLogger(__name__)


class StatusUpdate(BaseModel):
    account_status: Literal["PENDING", "ACTIVE", "SUSPENDED", "DEACTIVATED"]


@router.get("/users")
def list_users(
    role: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    q: Optional[str] = Query(default=None),
    current_user: dict = Depends(require_admin_module("User Management")),
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
    current_user: dict = Depends(require_admin_module("User Management", "Write")),
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
def approve_farmer(
    user_id: str,
    current_user: dict = Depends(require_admin_module("User Management", "Write")),
):
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
def ai_summary(current_user: dict = Depends(require_admin_module("AI Monitoring"))):
    scans = supabase.table("disease_scans").select("id", count="exact").execute()
    return {
        "disease_scan_count": scans.count or 0,
        "model_version": None,
        "last_training_date": None,
        "evaluation_metrics": None,
        "note": "No model version, training date, or evaluation metrics are stored in the database.",
    }


@router.get("/ai/predictions")
def ai_predictions(
    limit: int = Query(25, ge=1, le=100),
    current_user: dict = Depends(require_admin_module("AI Monitoring")),
):
    response = (
        supabase.table("disease_scans")
        .select("id,detected_disease,confidence,prediction,created_at")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return response.data or []


@router.get("/blockchain/all")
def blockchain_all(
    limit: int = Query(200, ge=1, le=1000),
    current_user: dict = Depends(require_admin_module("Blockchain Monitoring")),
):
    try:
        resp = (
            supabase.table("blockchain_records")
            .select(
                "id,record_type,record_ref,record_hash,transaction_hash,network,status,"
                "block_number,created_at"
            )
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
    except Exception as exc:
        code = getattr(exc, "code", None)
        message = str(exc).lower()
        if code in {"42703", "PGRST204"} or (
            "network" in message and ("column" in message or "schema cache" in message)
        ):
            raise HTTPException(
                status_code=503,
                detail="Blockchain monitoring schema is missing. Apply "
                "database/migrations/014_admin_farm_monitoring.sql.",
            ) from exc
        logger.exception("Could not load blockchain records.")
        raise HTTPException(status_code=503, detail="Could not load blockchain records.") from exc
    return resp.data or []


@router.post("/blockchain/{record_id}/verify")
async def verify_blockchain_record(
    record_id: str,
    current_user: dict = Depends(require_admin_module("Blockchain Monitoring", "Write")),
):
    record = (
        supabase.table("blockchain_records")
        .select("id,transaction_hash")
        .eq("id", record_id)
        .limit(1)
        .execute()
    )
    if not record.data:
        raise HTTPException(status_code=404, detail="Blockchain record not found.")
    transaction_hash = record.data[0].get("transaction_hash")
    if not transaction_hash:
        raise HTTPException(
            status_code=409,
            detail="This record has no transaction hash to verify on the blockchain.",
        )
    return await blockchain_service.verify_record(transaction_hash)


@router.get("/audit-logs")
def admin_audit_logs(
    limit: int = Query(200, ge=1, le=1000),
    current_user: dict = Depends(require_admin_module("Audit Logs")),
):
    resp = (
        supabase.table("audit_logs")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return resp.data or []