import logging
from app.database.connection import supabase

logger = logging.getLogger(__name__)


class AuditService:
    @staticmethod
    def log(user_id: str, action: str, details: str = ""):
        try:
            supabase.table("audit_logs").insert({
                "user_id": user_id,
                "action": action,
                "details": details,
            }).execute()
        except Exception as exc:
            # Audit logging should never crash the main application flow.
            # Log loudly to stderr so it is visible in Render, but do not raise.
            logger.error(f"Failed to write audit log: {exc}")

    @staticmethod
    def get_logs(limit: int = 100):
        response = (
            supabase.table("audit_logs")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data or []