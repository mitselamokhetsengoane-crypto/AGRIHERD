from datetime import date

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional
from app.core.permissions import get_current_user
from app.database.connection import supabase

router = APIRouter()

class TransactionCreate(BaseModel):
    amount: float = Field(gt=0)
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None

@router.get("/overview")
def get_finance_overview(current_user: dict = Depends(get_current_user)):
    income = supabase.table("transactions").select("amount").eq("user_id", current_user["sub"]).eq("type", "income").execute()
    expenses = supabase.table("transactions").select("amount").eq("user_id", current_user["sub"]).eq("type", "expense").execute()
    
    total_income = sum(item["amount"] for item in income.data) if income.data else 0
    total_expenses = sum(item["amount"] for item in expenses.data) if expenses.data else 0
    
    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_balance": total_income - total_expenses
    }

@router.get("/income")
def get_income(current_user: dict = Depends(get_current_user)):
    response = supabase.table("transactions").select("*").eq("user_id", current_user["sub"]).eq("type", "income").execute()
    return response.data

@router.post("/income")
def add_income(data: TransactionCreate, current_user: dict = Depends(get_current_user)):
    transaction = data.dict(exclude_unset=True)
    transaction["user_id"] = current_user["sub"]
    transaction["type"] = "income"
    response = supabase.table("transactions").insert(transaction).execute()
    return response.data[0]

@router.get("/expenses")
def get_expenses(current_user: dict = Depends(get_current_user)):
    response = supabase.table("transactions").select("*").eq("user_id", current_user["sub"]).eq("type", "expense").execute()
    return response.data

@router.get("/reports")
def get_finance_reports(
    start: date | None = Query(default=None),
    end: date | None = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    query = (
        supabase.table("transactions")
        .select("amount,type,date")
        .eq("user_id", current_user["sub"])
    )
    if start:
        query = query.gte("date", start.isoformat())
    if end:
        query = query.lte("date", end.isoformat())

    response = query.execute()
    monthly_totals = {}
    for transaction in response.data:
        transaction_date = transaction.get("date")
        if not transaction_date:
            continue
        month_key = str(transaction_date)[:7]
        totals = monthly_totals.setdefault(month_key, {"income": 0.0, "expenses": 0.0})
        if transaction["type"] == "income":
            totals["income"] += float(transaction["amount"])
        elif transaction["type"] == "expense":
            totals["expenses"] += float(transaction["amount"])

    return [
        {
            "month": month,
            "income": totals["income"],
            "expenses": totals["expenses"],
            "balance": totals["income"] - totals["expenses"],
        }
        for month, totals in sorted(monthly_totals.items(), reverse=True)
    ]

@router.post("/expenses")
def add_expense(data: TransactionCreate, current_user: dict = Depends(get_current_user)):
    transaction = data.dict(exclude_unset=True)
    transaction["user_id"] = current_user["sub"]
    transaction["type"] = "expense"
    response = supabase.table("transactions").insert(transaction).execute()
    return response.data[0]