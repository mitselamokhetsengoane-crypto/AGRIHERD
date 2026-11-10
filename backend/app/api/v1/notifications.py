from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from app.core.permissions import get_current_user
from app.database.connection import supabase

router = APIRouter()


@router.get("/")
def list_notifications(
    current_user: dict = Depends(get_current_user),
    only_unread: bool = Query(False),
    limit: int = Query(50, ge=1, le=200),
):
    q = supabase.table("notifications").select("*").eq("user_id", current_user["sub"])
    if only_unread:
        q = q.eq("is_read", False)
    resp = q.order("created_at", desc=True).limit(limit).execute()
    return resp.data or []


@router.get("/unread-count")
def unread_count(current_user: dict = Depends(get_current_user)):
    resp = (
        supabase.table("notifications")
        .select("id", count="exact")
        .eq("user_id", current_user["sub"])
        .eq("is_read", False)
        .execute()
    )
    return {"count": resp.count or 0}


@router.patch("/{notification_id}/read")
def mark_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    resp = (
        supabase.table("notifications")
        .update({"is_read": True})
        .eq("id", notification_id)
        .eq("user_id", current_user["sub"])
        .execute()
    )
    if not resp.data:
        raise HTTPException(404, "Notification not found.")
    return resp.data[0]


@router.patch("/read-all")
def mark_all_read(current_user: dict = Depends(get_current_user)):
    resp = (
        supabase.table("notifications")
        .update({"is_read": True})
        .eq("user_id", current_user["sub"])
        .eq("is_read", False)
        .execute()
    )
    return {"updated": len(resp.data or [])}


class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: Optional[str] = None
    category: Optional[str] = "GENERAL"
    link: Optional[str] = None


@router.post("/", status_code=201)
def create_notification(body: NotificationCreate, current_user: dict = Depends(get_current_user)):
    # Only admins can push to other users; ordinary users can only create for themselves.
    if body.user_id != current_user["sub"] and current_user.get("role") != "admin":
        raise HTTPException(403, "You can only create notifications for yourself.")
    resp = supabase.table("notifications").insert({
        "user_id": body.user_id,
        "title": body.title,
        "message": body.message,
        "category": body.category,
        "link": body.link,
        "is_read": False,
    }).execute()
    return resp.data[0]


@router.get("/settings")
def get_notification_settings(current_user: dict = Depends(get_current_user)):
    resp = (
        supabase.table("notification_settings")
        .select("*")
        .eq("user_id", current_user["sub"])
        .limit(1)
        .execute()
    )
    if resp.data:
        return resp.data[0]
    # First visit: create defaults
    created = supabase.table("notification_settings").insert({
        "user_id": current_user["sub"],
    }).execute()
    return created.data[0]


class NotificationSettingsUpdate(BaseModel):
    task_reminders: Optional[bool] = None
    crop_updates: Optional[bool] = None
    livestock_updates: Optional[bool] = None
    low_stock_alerts: Optional[bool] = None
    marketplace_updates: Optional[bool] = None


@router.put("/settings")
def update_notification_settings(
    body: NotificationSettingsUpdate,
    current_user: dict = Depends(get_current_user),
):
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if not updates:
        raise HTTPException(400, "No settings to update.")
    resp = (
        supabase.table("notification_settings")
        .update(updates)
        .eq("user_id", current_user["sub"])
        .execute()
    )
    if not resp.data:
        raise HTTPException(404, "Settings not found.")
    return resp.data[0]