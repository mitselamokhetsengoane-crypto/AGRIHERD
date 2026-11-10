import logging
from app.database.connection import supabase
from app.services.blockchain_service import blockchain_service

logger = logging.getLogger(__name__)


def _build_record(order: dict, items: list) -> dict:
    """Minimal canonical record. No personal data."""
    return {
        "order_ref": order["id"],
        "seller_ref": order["seller_id"],
        "total_amount": float(order["total"]),
        "item_count": len(items),
        "checkout_group": order.get("checkout_group", ""),
    }


def record_order_on_chain(order_id: str) -> dict:
    """
    Attempt to record a completed order on the blockchain.
    Returns {'status': 'submitted'|'already_recorded'|'not_connected'|'error', 'message': str}.
    Never raises — blockchain failure must not break the application.
    """
    try:
        # Is the blockchain configured?
        status = blockchain_service.get_network_status()
        if not status.get("connected") or not status.get("contract_loaded"):
            logger.warning(f"Blockchain not available: {status}")
            return {"status": "not_connected", "message": "Blockchain network is not reachable."}

        # Already recorded?
        existing = (
            supabase.table("blockchain_records")
            .select("id")
            .eq("order_id", order_id)
            .limit(1)
            .execute()
        )
        if existing.data:
            return {"status": "already_recorded", "message": "Order already recorded on chain."}

        # Fetch order + items
        order_resp = supabase.table("orders").select("*").eq("id", order_id).limit(1).execute()
        if not order_resp.data:
            return {"status": "error", "message": "Order not found."}
        order = order_resp.data[0]

        items_resp = supabase.table("order_items").select("*").eq("order_id", order_id).execute()
        items = items_resp.data or []

        record = _build_record(order, items)
        record_hash = blockchain_service.generate_hash(record)

        result = blockchain_service.log_record(
            record_hash=record_hash,
            record_type="MARKETPLACE_ORDER",
            record_ref=order_id,
        )
        if result.get("status") != "success":
            logger.error(f"Blockchain submission failed: {result.get('message')}")
            return {"status": "error", "message": result.get("message", "Unknown error.")}

        supabase.table("blockchain_records").insert({
            "user_id": order["seller_id"],
            "order_id": order_id,
            "record_type": "MARKETPLACE_ORDER",
            "record_ref": order_id,
            "record_hash": record_hash,
            "transaction_hash": result["transaction_hash"],
            "block_number": result["block_number"],
        }).execute()

        logger.info(f"Order {order_id} recorded on chain: {result['transaction_hash']}")
        return {"status": "submitted", "transaction_hash": result["transaction_hash"]}
    except Exception as exc:
        logger.exception(f"Blockchain trigger failed for {order_id}")
        return {"status": "error", "message": str(exc)}