from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.core.permissions import get_current_user
from app.database.connection import supabase
from app.services.audit_service import AuditService

router = APIRouter()


class TaskCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    assigned_person: Optional[str] = None


class TaskUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    assigned_person: Optional[str] = None
    status: Optional[str] = None


@router.get("/")
def get_tasks(current_user: dict = Depends(get_current_user)):
    response = supabase.table("tasks").select("*").eq("user_id", current_user["sub"]).order("date", desc=False).execute()
    return response.data


@router.get("/upcoming")
def get_upcoming_tasks(current_user: dict = Depends(get_current_user)):
    response = (
        supabase.table("tasks")
        .select("*")
        .eq("user_id", current_user["sub"])
        .gte("date", date.today().isoformat())
        .neq("status", "Completed")
        .order("date")
        .execute()
    )
    return response.data


@router.get("/{task_id}")
def get_task(task_id: str, current_user: dict = Depends(get_current_user)):
    response = (
        supabase.table("tasks")
        .select("*")
        .eq("id", task_id)
        .eq("user_id", current_user["sub"])
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return response.data[0]


@router.post("/")
def create_task(task: TaskCreate, current_user: dict = Depends(get_current_user)):
    task_data = task.dict(exclude_unset=True)
    task_data["name"] = task_data["name"].strip()
    if not task_data["name"]:
        raise HTTPException(status_code=422, detail="Task name cannot be empty")
    task_data["user_id"] = current_user["sub"]
    task_data["status"] = "Pending"
    response = supabase.table("tasks").insert(task_data).execute()
    created = response.data[0]
    AuditService.log(current_user["sub"], "CREATE_TASK", f"Added task {created.get('name', 'Task')}")
    return created


@router.put("/{task_id}")
def update_task(task_id: str, task: TaskUpdate, current_user: dict = Depends(get_current_user)):
    updates = task.dict(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    if "name" in updates:
        updates["name"] = updates["name"].strip()
        if not updates["name"]:
            raise HTTPException(status_code=422, detail="Task name cannot be empty")

    response = (
        supabase.table("tasks")
        .update(updates)
        .eq("id", task_id)
        .eq("user_id", current_user["sub"])
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Task not found")
    updated = response.data[0]
    AuditService.log(current_user["sub"], "UPDATE_TASK", f"Updated task {updated.get('name', task_id)}")
    return updated


@router.patch("/{task_id}/complete")
def complete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    response = (
        supabase.table("tasks")
        .update({"status": "Completed"})
        .eq("id", task_id)
        .eq("user_id", current_user["sub"])
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Task not found")
    completed = response.data[0]
    AuditService.log(current_user["sub"], "COMPLETE_TASK", f"Completed task {completed.get('name', task_id)}")
    return completed


@router.delete("/{task_id}")
def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    response = (
        supabase.table("tasks")
        .delete()
        .eq("id", task_id)
        .eq("user_id", current_user["sub"])
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Task not found")
    AuditService.log(current_user["sub"], "DELETE_TASK", f"Deleted task {response.data[0].get('name', task_id)}")
    return {"message": "Task deleted"}