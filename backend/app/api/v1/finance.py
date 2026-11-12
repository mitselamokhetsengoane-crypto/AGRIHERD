from datetime import date
from io import BytesIO
import csv

from fastapi import APIRouter, Depends, Query, HTTPException, Response
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from pydantic import BaseModel, Field
from typing import Optional

from app.core.permissions import get_current_user
from app.database.connection import supabase
from app.services.audit_service import AuditService

router = APIRouter()


class TransactionCreate(BaseModel):
    amount: float = Field(gt=0)
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    reference_id: Optional[str] = None


class TransactionUpdate(BaseModel):
    amount: Optional[float] = Field(default=None, gt=0)
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None


def _today() -> str:
    return date.today().isoformat()


@router.get("/overview")
def get_finance_overview(current_user: dict = Depends(get_current_user)):
    inc = (
        supabase.table("transactions")
        .select("amount")
        .eq("user_id", current_user["sub"])
        .eq("type", "income")
        .execute()
    )
    exp = (
        supabase.table("transactions")
        .select("amount")
        .eq("user_id", current_user["sub"])
        .eq("type", "expense")
        .execute()
    )
    total_income = sum(float(r["amount"]) for r in (inc.data or []))
    total_expenses = sum(float(r["amount"]) for r in (exp.data or []))
    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_balance": total_income - total_expenses,
    }


@router.get("/income")
def get_income(current_user: dict = Depends(get_current_user)):
    resp = (
        supabase.table("transactions")
        .select("*")
        .eq("user_id", current_user["sub"])
        .eq("type", "income")
        .order("date", desc=True)
        .execute()
    )
    return resp.data or []


@router.post("/income", status_code=201)
def add_income(data: TransactionCreate, current_user: dict = Depends(get_current_user)):
    row = data.dict(exclude_unset=True)
    row["user_id"] = current_user["sub"]
    row["type"] = "income"
    row.setdefault("date", _today())
    row.setdefault("source", "MANUAL")
    resp = supabase.table("transactions").insert(row).execute()
    created = resp.data[0]
    AuditService.log(current_user["sub"], "CREATE_INCOME", f"Recorded income of {created.get('amount', row['amount'])}")
    return created


@router.get("/expenses")
def get_expenses(current_user: dict = Depends(get_current_user)):
    resp = (
        supabase.table("transactions")
        .select("*")
        .eq("user_id", current_user["sub"])
        .eq("type", "expense")
        .order("date", desc=True)
        .execute()
    )
    return resp.data or []


@router.post("/expenses", status_code=201)
def add_expense(data: TransactionCreate, current_user: dict = Depends(get_current_user)):
    row = data.dict(exclude_unset=True)
    row["user_id"] = current_user["sub"]
    row["type"] = "expense"
    row.setdefault("date", _today())
    row.setdefault("source", "MANUAL")
    resp = supabase.table("transactions").insert(row).execute()
    created = resp.data[0]
    AuditService.log(current_user["sub"], "CREATE_EXPENSE", f"Recorded expense of {created.get('amount', row['amount'])}")
    return created


@router.put("/{transaction_id}")
def update_transaction(
    transaction_id: str,
    data: TransactionUpdate,
    current_user: dict = Depends(get_current_user),
):
    updates = {k: v for k, v in data.dict().items() if v is not None}
    if not updates:
        raise HTTPException(400, "No fields to update.")
    resp = (
        supabase.table("transactions")
        .update(updates)
        .eq("id", transaction_id)
        .eq("user_id", current_user["sub"])
        .execute()
    )
    if not resp.data:
        raise HTTPException(404, "Transaction not found.")
    updated = resp.data[0]
    AuditService.log(current_user["sub"], "UPDATE_TRANSACTION", f"Updated transaction {transaction_id}")
    return updated


@router.delete("/{transaction_id}")
def delete_transaction(transaction_id: str, current_user: dict = Depends(get_current_user)):
    resp = (
        supabase.table("transactions")
        .delete()
        .eq("id", transaction_id)
        .eq("user_id", current_user["sub"])
        .execute()
    )
    if not resp.data:
        raise HTTPException(404, "Transaction not found.")
    AuditService.log(current_user["sub"], "DELETE_TRANSACTION", f"Deleted transaction {transaction_id}")
    return {"message": "Deleted"}


@router.get("/reports")
def get_finance_reports(
    start: Optional[date] = Query(default=None),
    end: Optional[date] = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    q = supabase.table("transactions").select("amount,type,date").eq("user_id", current_user["sub"])
    if start:
        q = q.gte("date", start.isoformat())
    if end:
        q = q.lte("date", end.isoformat())
    resp = q.execute()

    monthly: dict = {}
    for row in (resp.data or []):
        d = row.get("date")
        if not d:
            continue
        month = str(d)[:7]
        bucket = monthly.setdefault(month, {"income": 0.0, "expenses": 0.0})
        if row["type"] == "income":
            bucket["income"] += float(row["amount"])
        elif row["type"] == "expense":
            bucket["expenses"] += float(row["amount"])

    return [
        {
            "month": m,
            "income": v["income"],
            "expenses": v["expenses"],
            "balance": v["income"] - v["expenses"],
        }
        for m, v in sorted(monthly.items(), reverse=True)
    ]


@router.get("/export.xlsx")
def export_excel(
    start: Optional[date] = Query(default=None),
    end: Optional[date] = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    q = supabase.table("transactions").select("*").eq("user_id", current_user["sub"])
    if start:
        q = q.gte("date", start.isoformat())
    if end:
        q = q.lte("date", end.isoformat())
    resp = q.order("date", desc=True).execute()

    wb = Workbook()
    ws = wb.active
    ws.title = "Transactions"
    ws.append(["Date", "Type", "Category", "Description", "Amount", "Source"])
    
    for r in resp.data or []:
        ws.append([
            r.get("date") or "",
            r.get("type") or "",
            r.get("category") or "",
            (r.get("description") or "").replace("\n", " "),
            float(r.get("amount") or 0),
            r.get("source") or "MANUAL",
        ])

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=agriherd-finance.xlsx"},
    )