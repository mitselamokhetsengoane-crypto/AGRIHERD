import logging
from app.database.connection import supabase
from app.services.blockchain_service import blockchain_service

logger = logging.getLogger(__name__)

async def record_order_on_chain(order_id: str) -> dict:
    try:
        # 1. Check if already recorded
        existing = supabase.table("blockchain_records").select("id").eq("order_id", order_id).execute()
        if existing.data:
            return {"status": "already_recorded"}

        # 2. Fetch order
        order_resp = supabase.table("orders").select("*").eq("id", order_id).limit(1).execute()
        if not order_resp.data:
            return {"status": "error", "message": "Order not found"}
        order = order_resp.data[0]

        # 3. Build minimal data
        record_data = {
            "order_ref": order["id"],
            "seller_ref": order["seller_id"],
            "total_amount": float(order["total"]),
            "timestamp": order["created_at"]
        }

        # 4. Submit to Node.js
        result = await blockchain_service.log_record(
            record_type="MARKETPLACE_ORDER",
            record_ref=order_id,
            data=record_data
        )

        if result.get("status") != "success":
            logger.error(f"Blockchain submission failed: {result}")
            return result

        # 5. Save legacy reference to Supabase (for backwards compatibility)
        supabase.table("blockchain_records").insert({
            "user_id": order["seller_id"],
            "order_id": order_id,
            "record_type": "MARKETPLACE_ORDER",
            "record_ref": order_id,
            "record_hash": result["blockHash"],  # Store the block hash here
            "transaction_hash": result["transactionHash"],
            "block_number": result["blockNumber"],
        }).execute()

        return {"status": "submitted", "transaction_hash": result["transactionHash"]}

    except Exception as e:
        logger.exception("Blockchain trigger failed")
        return {"status": "error", "message": str(e)}