import logging
from datetime import date
from app.database.connection import supabase

logger = logging.getLogger(__name__)


class IncomeService:
    @staticmethod
    def record_marketplace_income(order_id: str) -> bool:
        """
        Create a financial income record for the farmer when an order is completed
        and paid. Idempotent thanks to the UNIQUE index on reference_id.
        Returns True if a row was created, False if already existed or on error.
        """
        try:
            order_resp = supabase.table("orders").select("*").eq("id", order_id).limit(1).execute()
            if not order_resp.data:
                logger.warning(f"Income: order {order_id} not found.")
                return False
            order = order_resp.data[0]

            # Confirm the order is completed and paid
            if order.get("status") != "COMPLETED":
                return False
            payment_resp = supabase.table("payments").select("*").eq("order_id", order_id).limit(1).execute()
            if not payment_resp.data or payment_resp.data[0].get("status") != "PAID":
                return False

            # Idempotency — check whether income already exists for this order
            existing = (
                supabase.table("transactions")
                .select("id")
                .eq("reference_id", order_id)
                .eq("source", "MARKETPLACE_SALE")
                .limit(1)
                .execute()
            )
            if existing.data:
                logger.info(f"Income already recorded for order {order_id}.")
                return False

            supabase.table("transactions").insert({
                "user_id": order["seller_id"],
                "type": "income",
                "category": "Marketplace Sale",
                "amount": float(order["total"]),
                "description": f"Marketplace sale — order {order_id[:8]}",
                "date": date.today().isoformat(),
                "source": "MARKETPLACE_SALE",
                "reference_id": order_id,
            }).execute()
            logger.info(f"Income recorded for order {order_id}.")
            return True
        except Exception as exc:
            logger.error(f"Income service failed for order {order_id}: {exc}")
            return False