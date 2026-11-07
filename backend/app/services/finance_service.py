from app.database.connection import supabase
from fastapi import HTTPException

class FinanceService:
    @staticmethod
    def get_overview(user_id: str):
        income_res = supabase.table("transactions").select("amount").eq("user_id", user_id).eq("type", "income").execute()
        expense_res = supabase.table("transactions").select("amount").eq("user_id", user_id).eq("type", "expense").execute()

        total_income = sum(item["amount"] for item in income_res.data) if income_res.data else 0
        total_expenses = sum(item["amount"] for item in expense_res.data) if expense_res.data else 0

        return {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net_balance": total_income - total_expenses
        }

    @staticmethod
    def get_income(user_id: str):
        response = supabase.table("transactions").select("*").eq("user_id", user_id).eq("type", "income").execute()
        return response.data

    @staticmethod
    def get_expenses(user_id: str):
        response = supabase.table("transactions").select("*").eq("user_id", user_id).eq("type", "expense").execute()
        return response.data

    @staticmethod
    def add_transaction(user_id: str, data: dict):
        data["user_id"] = user_id
        response = supabase.table("transactions").insert(data).execute()
        return response.data[0]

    @staticmethod
    def get_reports(user_id: str):
        # Placeholder for complex monthly aggregation
        # In production, use Supabase RPC functions for this
        response = supabase.table("transactions").select("*").eq("user_id", user_id).execute()
        return response.data