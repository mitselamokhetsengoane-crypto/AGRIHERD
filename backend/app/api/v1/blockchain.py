from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.permissions import get_current_user
from app.services.blockchain_service import blockchain_service
from app.database.connection import supabase
from app.services.audit_service import AuditService

router = APIRouter()


class RecordRequest(BaseModel):
    record_type: str
    record_ref: str
    record_data: dict


@router.get("/status")
def get_network_status():
    """Check if blockchain is connected (Sepolia or Local)."""
    return blockchain_service.get_network_status()


@router.get("/count")
def get_record_count():
    """Get total records on-chain."""
    return {"total_records": blockchain_service.get_record_count()}


@router.post("/log")
def log_record_to_chain(
    request: RecordRequest,
    current_user: dict = Depends(get_current_user)
):
    """Submit a manual record hash to the blockchain."""
    record_hash = blockchain_service.generate_hash(request.record_data)

    result = blockchain_service.log_record(
        record_hash=record_hash,
        record_type=request.record_type,
        record_ref=request.record_ref
    )

    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("message"))

    try:
        supabase.table("blockchain_records").insert({
            "user_id": current_user["sub"],
            "record_type": request.record_type,
            "record_ref": request.record_ref,
            "record_hash": record_hash,
            "transaction_hash": result["transaction_hash"],
            "block_number": result["block_number"]
        }).execute()
    except Exception as e:
        print(f"Failed to save blockchain reference: {e}")

    AuditService.log(
        current_user["sub"],
        "BLOCKCHAIN_RECORD_ADDED",
        f"{request.record_type} - {result['transaction_hash']}"
    )

    return result


@router.get("/verify/{record_hash}")
def verify_record(record_hash: str):
    """Query the actual blockchain network to verify a hash exists."""
    return blockchain_service.verify_record(record_hash)


@router.get("/transactions")
def get_blockchain_transactions(current_user: dict = Depends(get_current_user)):
    """Get all blockchain transactions for the logged-in user."""
    response = supabase.table("blockchain_records")\
        .select("*")\
        .eq("user_id", current_user["sub"])\
        .order("created_at", desc=True)\
        .execute()
    return response.data