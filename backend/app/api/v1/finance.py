from fastapi import APIRouter, Depends
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

@router.post("/expenses")
def add_expense(data: TransactionCreate, current_user: dict = Depends(get_current_user)):
    transaction = data.dict(exclude_unset=True)
    transaction["user_id"] = current_user["sub"]
    transaction["type"] = "expense"
    response = supabase.table("transactions").insert(transaction).execute()
    return response.data[0]