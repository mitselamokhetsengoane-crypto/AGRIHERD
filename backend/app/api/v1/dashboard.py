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
        .select("id,name,type,created_at")
        .eq("user_id", user_id)
        .execute()
        .data
    )
    crops = (
        supabase.table("crops")
        .select("id,name,created_at")
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
    recent_tasks = (
        supabase.table("tasks")
        .select("id,name,created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(3)
        .execute()
        .data
    )
    inventory = (
        supabase.table("inventory")
        .select("name,quantity,minimum_stock_level,created_at")
        .eq("user_id", user_id)
        .execute()
        .data
    )
    transactions = (
        supabase.table("transactions")
        .select("amount,type,description,created_at")
        .eq("user_id", user_id)
        .execute()
        .data
    )
    activity = (
        supabase.table("audit_logs")
        .select("action,details,created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(3)
        .execute()
        .data
    )

    income = sum(float(item["amount"]) for item in transactions if item["type"] == "income")
    expenses = sum(float(item["amount"]) for item in transactions if item["type"] == "expense")

    creation_actions = {
        "CREATE_ANIMAL",
        "CREATE_CROP",
        "CREATE_TASK",
        "CREATE_INVENTORY_ITEM",
        "CREATE_INCOME",
        "CREATE_EXPENSE",
    }
    recent_activity = [
        {
            "description": item.get("details") or item.get("action") or "Farm activity",
            "time": item.get("created_at", ""),
        }
        for item in activity
        if item.get("action") not in creation_actions
    ]

    record_activity = [
        (livestock, lambda item: f"Added animal {item.get('name') or item.get('type') or ''}".strip()),
        (crops, lambda item: f"Added crop {item.get('name') or ''}".strip()),
        (recent_tasks, lambda item: f"Added task {item.get('name') or ''}".strip()),
        (inventory, lambda item: f"Added inventory item {item.get('name') or ''}".strip()),
        (
            transactions,
            lambda item: (
                f"Recorded {item.get('type') or 'finance'}"
                + (f": {item['description']}" if item.get("description") else "")
            ),
        ),
    ]
    for records, describe in record_activity:
        recent_activity.extend(
            {"description": describe(item), "time": item["created_at"]}
            for item in records
            if item.get("created_at")
        )
    recent_activity.sort(key=lambda item: item["time"], reverse=True)

    return {
        "livestock_count": len(livestock),
        "crop_count": len(crops),
        "upcoming_tasks": len(tasks),
        "low_stock_alerts": sum(
            float(item.get("quantity") or 0) <= float(item.get("minimum_stock_level") or 0)
            for item in inventory
        ),
        "net_balance": income - expenses,
        "recent_activity": recent_activity[:3],
    }
