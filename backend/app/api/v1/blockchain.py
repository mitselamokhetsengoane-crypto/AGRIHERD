from fastapi import APIRouter, Depends, HTTPException
from app.core.permissions import get_current_user
from app.database.connection import supabase
from app.services.blockchain_service import blockchain_service
from app.services.blockchain_trigger import record_harvest_on_chain

router = APIRouter()

@router.get("/status")
async def get_status():
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

@router.get("/blocks")
async def get_all_blocks(current_user: dict = Depends(get_current_user)):
    """Get all blocks (used by the Admin dashboard)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    import httpx
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{blockchain_service.service_url}/blocks", headers=blockchain_service.headers, timeout=20.0)
            res.raise_for_status()
            return res.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail="Could not load blocks from the chain.")

@router.get("/transactions")
def get_transactions(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") == "admin":
        response = supabase.table("blockchain_records").select("*").order("created_at", desc=True).execute()
    else:
        response = supabase.table("blockchain_records").select("*").eq("user_id", current_user["sub"]).order("created_at", desc=True).execute()
    return response.data or []

@router.post("/verify/{record_id}")
async def verify_record(record_id: str, current_user: dict = Depends(get_current_user)):
    """Verify a specific record against the blockchain network."""
    db_record = supabase.table("blockchain_records").select("*").eq("id", record_id).limit(1).execute()
    if not db_record.data:
        raise HTTPException(status_code=404, detail="Record not found in database")
    
    tx_hash = db_record.data[0].get("transaction_hash")
    if not tx_hash:
        raise HTTPException(status_code=400, detail="This record does not have a blockchain hash")

    return await blockchain_service.verify_record(tx_hash)

@router.post("/register-harvest/{harvest_id}")
async def register_harvest(harvest_id: str, current_user: dict = Depends(get_current_user)):
    """Allow a farmer to manually push a harvest to the blockchain."""
    if current_user.get("role") != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can register harvests")
    
    # Verify the harvest belongs to this farmer
    harvest = supabase.table("harvest_records").select("*, crops(user_id)").eq("id", harvest_id).limit(1).execute()
    if not harvest.data:
        raise HTTPException(status_code=404, detail="Harvest not found")
    if harvest.data[0]["crops"]["user_id"] != current_user["sub"]:
        raise HTTPException(status_code=403, detail="You can only register your own harvests")

    result = await record_harvest_on_chain(harvest_id, current_user["sub"])
    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("message", "Blockchain submission failed"))
    return result