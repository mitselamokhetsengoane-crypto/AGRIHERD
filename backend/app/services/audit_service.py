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
            logger.error(f"Failed to write audit log: {exc}")

    @staticmethod
    def get_logs(limit: int = 200):
        try:
            response = (
                supabase.table("audit_logs")
                .select("*")
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return response.data or []
        except Exception as exc:
            logger.error(f"Failed to fetch audit logs: {exc}")
            return []