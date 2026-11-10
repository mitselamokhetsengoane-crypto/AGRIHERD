import logging
from app.database.connection import supabase
from app.services.blockchain_service import blockchain_service

logger = logging.getLogger(__name__)

def _build_minimal_record(order: dict, items: list) -> dict:
    """Only store non-sensitive data on the blockchain."""
    return {
        "order_ref": str(order["id"]),
        "seller_ref": str(order["seller_id"]),
        "total_amount": float(order["total"]),
        "item_count": len(items),
        "timestamp": order.get("completed_at") or order.get("created_at")
    }

def record_order_on_chain(order_id: str) -> dict:
    try:
        # 1. Check network connection
        status = blockchain_service.get_network_status()
        if not status.get("connected") or not status.get("contract_loaded"):
            logger.warning(f"Blockchain unavailable: {status}")
            return {"status": "not_connected", "message": "Blockchain network is unreachable."}

        # 2. Prevent duplicate submissions
        existing = supabase.table("blockchain_records").select("id").eq("order_id", order_id).limit(1).execute()
        if existing.data:
            return {"status": "already_recorded", "message": "Order already on chain."}

        # 3. Fetch order data
        order_resp = supabase.table("orders").select("*").eq("id", order_id).limit(1).execute()
        if not order_resp.data:
            return {"status": "error", "message": "Order not found."}
        order = order_resp.data[0]

        items_resp = supabase.table("order_items").select("*").eq("order_id", order_id).execute()
        items = items_resp.data or []

        # 4. Hash and submit
        record = _build_minimal_record(order, items)
        record_hash = blockchain_service.generate_hash(record)
        
        result = blockchain_service.log_record(
            record_hash=record_hash,
            record_type="MARKETPLACE_ORDER",
            record_ref=order_id
        )

        if result.get("status") != "success":
            logger.error(f"Chain submission failed: {result.get('message')}")
            return {"status": "error", "message": result.get("message")}

        # 5. Save receipt to database
        supabase.table("blockchain_records").insert({
            "user_id": order["seller_id"],
            "order_id": order_id,
            "record_type": "MARKETPLACE_ORDER",
            "record_ref": order_id,
            "record_hash": record_hash,
            "transaction_hash": result["transaction_hash"],
            "block_number": result["block_number"],
        }).execute()

        logger.info(f"Order {order_id} recorded on chain. TX: {result['transaction_hash']}")
        return {"status": "submitted", "transaction_hash": result["transaction_hash"]}

    except Exception as exc:
        logger.exception(f"Blockchain trigger failed for {order_id}")
        return {"status": "error", "message": str(exc)}