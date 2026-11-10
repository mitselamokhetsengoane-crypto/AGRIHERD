from fastapi import APIRouter, Depends, HTTPException
from app.core.permissions import get_current_user
from app.database.connection import supabase
from app.services.blockchain_service import blockchain_service

router = APIRouter()

@router.get("/status")
async def get_status():
    """Check if the Node.js engine is online."""
    import httpx
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{blockchain_service.service_url}/health", timeout=5.0)
            if res.status_code == 200:
                return {"connected": True}
    except Exception:
        pass
    return {"connected": False}

@router.get("/verify")
async def verify_chain(current_user: dict = Depends(get_current_user)):
    """Verify the entire blockchain integrity."""
    return await blockchain_service.verify_chain()

@router.get("/transactions")
def get_transactions(current_user: dict = Depends(get_current_user)):
    """Get blockchain records for the current user."""
    if current_user.get("role") == "admin":
        response = supabase.table("blockchain_records").select("*").order("created_at", desc=True).execute()
    else:
        response = supabase.table("blockchain_records").select("*").eq("user_id", current_user["sub"]).order("created_at", desc=True).execute()
    return response.data or []