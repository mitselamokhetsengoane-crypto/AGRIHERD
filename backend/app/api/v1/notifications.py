from fastapi import APIRouter, Depends, HTTPException
from app.core.permissions import get_current_user
from app.database.connection import supabase

router = APIRouter()

@router.get("/")
def get_notifications(current_user: dict = Depends(get_current_user)):
    response = supabase.table("notifications").select("*").eq("user_id", current_user["sub"]).execute()
    return response.data

@router.patch("/{notification_id}/read")
def mark_notification_as_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    response = (
        supabase.table("notifications")
        .update({"is_read": True})
        .eq("id", notification_id)
        .eq("user_id", current_user["sub"])
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Notification not found")
    return response.data[0]