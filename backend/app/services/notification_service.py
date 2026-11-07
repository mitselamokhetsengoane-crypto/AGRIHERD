from app.database.connection import supabase

class NotificationService:
    @staticmethod
    def get_all(user_id: str):
        response = supabase.table("notifications").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return response.data

    @staticmethod
    def mark_as_read(notification_id: str, user_id: str):
        response = supabase.table("notifications").update({"is_read": True}).eq("id", notification_id).eq("user_id", user_id).execute()
        return response.data

    @staticmethod
    def create(user_id: str, title: str, message: str):
        response = supabase.table("notifications").insert({
            "user_id": user_id,
            "title": title,
            "message": message,
            "is_read": False
        }).execute()
        return response.data[0]