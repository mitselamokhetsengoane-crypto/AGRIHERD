from app.database.connection import supabase

class AuditService:
    @staticmethod
    def log(user_id: str, action: str, details: str = ""):
        try:
            supabase.table("audit_logs").insert({
                "user_id": user_id,
                "action": action,
                "details": details
            }).execute()
        except Exception as e:
            # Audit logging should not crash the main application flow
            print(f"Failed to write audit log: {e}")

    @staticmethod
    def get_logs(limit: int = 100):
        response = supabase.table("audit_logs").select("*").order("created_at", desc=True).limit(limit).execute()
        return response.data