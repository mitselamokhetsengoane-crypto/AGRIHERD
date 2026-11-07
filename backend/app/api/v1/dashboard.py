from datetime import date

from fastapi import APIRouter, Depends

from app.core.permissions import get_current_user
from app.database.connection import supabase

router = APIRouter()


@router.get("/summary")
def get_dashboard_summary(current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]

    livestock = (
        supabase.table("livestock")
        .select("id")
        .eq("user_id", user_id)
        .execute()
        .data
    )
    crops = (
        supabase.table("crops")
        .select("id")
        .eq("user_id", user_id)
        .execute()
        .data
    )
    tasks = (
        supabase.table("tasks")
        .select("id,date,status")
        .eq("user_id", user_id)
        .gte("date", date.today().isoformat())
        .neq("status", "Completed")
        .execute()
        .data
    )
    inventory = (
        supabase.table("inventory")
        .select("quantity,minimum_stock_level")
        .eq("user_id", user_id)
        .execute()
        .data
    )
    transactions = (
        supabase.table("transactions")
        .select("amount,type")
        .eq("user_id", user_id)
        .execute()
        .data
    )
    activity = (
        supabase.table("audit_logs")
        .select("action,details,created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
        .data
    )

    income = sum(float(item["amount"]) for item in transactions if item["type"] == "income")
    expenses = sum(float(item["amount"]) for item in transactions if item["type"] == "expense")

    return {
        "livestock_count": len(livestock),
        "crop_count": len(crops),
        "upcoming_tasks": len(tasks),
        "low_stock_alerts": sum(
            float(item.get("quantity") or 0) <= float(item.get("minimum_stock_level") or 0)
            for item in inventory
        ),
        "net_balance": income - expenses,
        "recent_activity": [
            {
                "description": item.get("details") or item.get("action") or "Farm activity",
                "time": item.get("created_at", ""),
            }
            for item in activity
        ],
    }
