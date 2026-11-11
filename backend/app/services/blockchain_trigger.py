import logging
from app.database.connection import supabase
from app.services.blockchain_service import blockchain_service

logger = logging.getLogger(__name__)
BLOCKCHAIN_NETWORK = "AgriHerd Custom Chain"

async def record_order_on_chain(order_id: str) -> dict:
    try:
        existing = supabase.table("blockchain_records").select("id").eq("order_id", order_id).execute()
        if existing.data:
            return {"status": "already_recorded"}

        order_resp = supabase.table("orders").select("*").eq("id", order_id).limit(1).execute()
        if not order_resp.data:
            return {"status": "error", "message": "Order not found"}
        order = order_resp.data[0]

        record_data = {
            "order_ref": order["id"],
            "seller_ref": order["seller_id"],
            "total_amount": float(order["total"]),
            "timestamp": order["created_at"]
        }

        result = await blockchain_service.log_record(
            record_type="MARKETPLACE_ORDER",
            record_ref=order_id,
            data=record_data
        )

        if result.get("status") != "success":
            logger.error(f"Blockchain submission failed: {result}")
            return result

        supabase.table("blockchain_records").insert({
            "user_id": order["seller_id"],
            "order_id": order_id,
            "record_type": "MARKETPLACE_ORDER",
            "record_ref": order_id,
            "record_hash": result["blockHash"],
            "transaction_hash": result["transactionHash"],
            "block_number": result["blockNumber"],
            "network": BLOCKCHAIN_NETWORK,
            "status": "submitted",
        }).execute()

        return {"status": "submitted", "transaction_hash": result["transactionHash"]}

    except Exception as e:
        logger.exception("Blockchain trigger failed")
        return {"status": "error", "message": str(e)}


async def record_harvest_on_chain(harvest_id: str, farmer_id: str) -> dict:
    """Register a harvest record on the blockchain."""
    try:
        # Check if already recorded (using record_ref to avoid duplicate columns)
        existing = supabase.table("blockchain_records").select("id").eq("record_ref", harvest_id).eq("record_type", "HARVEST").execute()
        if existing.data:
            return {"status": "already_recorded"}

        harvest_resp = supabase.table("harvest_records").select("*").eq("id", harvest_id).limit(1).execute()
        if not harvest_resp.data:
            return {"status": "error", "message": "Harvest record not found"}
        harvest = harvest_resp.data[0]

        record_data = {
            "harvest_ref": harvest["id"],
            "crop_ref": harvest["crop_id"],
            "quantity": float(harvest.get("quantity") or 0),
            "unit": harvest.get("unit"),
            "quality": harvest.get("quality"),
            "harvest_date": harvest.get("harvest_date"),
        }

        result = await blockchain_service.log_record(
            record_type="HARVEST",
            record_ref=harvest_id,
            data=record_data
        )

        if result.get("status") != "success":
            logger.error(f"Blockchain harvest submission failed: {result}")
            return result

        supabase.table("blockchain_records").insert({
            "user_id": farmer_id,
            "record_type": "HARVEST",
            "record_ref": harvest_id,
            "record_hash": result["blockHash"],
            "transaction_hash": result["transactionHash"],
            "block_number": result["blockNumber"],
            "network": BLOCKCHAIN_NETWORK,
            "status": "submitted",
        }).execute()

        return {"status": "submitted", "transaction_hash": result["transactionHash"]}

    except Exception as e:
        logger.exception("Blockchain harvest trigger failed")
        return {"status": "error", "message": str(e)}