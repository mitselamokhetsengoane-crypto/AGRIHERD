from fastapi import APIRouter, Depends, HTTPException
from app.core.permissions import get_current_user
from app.services.livestock_service import LivestockService
from app.services.audit_service import AuditService

router = APIRouter()

@router.get("/")
def get_all_animals(current_user: dict = Depends(get_current_user)):
    try:
        return LivestockService.get_all(current_user["sub"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch animals: {str(e)}")

@router.get("/{animal_id}")
def get_animal(animal_id: str, current_user: dict = Depends(get_current_user)):
    try:
        return LivestockService.get_by_id(animal_id, current_user["sub"])
    except Exception as e:
        raise HTTPException(status_code=404, detail="Animal not found")

@router.post("/")
def create_animal(animal: dict, current_user: dict = Depends(get_current_user)):
    try:
        result = LivestockService.create(current_user["sub"], animal)
        AuditService.log(current_user["sub"], "CREATE_ANIMAL", f"Added animal {animal.get('name')}")
        return result
    except Exception as e:
        # This captures the real Supabase error (e.g., missing column) and returns it to the frontend
        raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")

@router.delete("/{animal_id}")
def delete_animal(animal_id: str, current_user: dict = Depends(get_current_user)):
    try:
        LivestockService.delete(animal_id, current_user["sub"])
        AuditService.log(current_user["sub"], "DELETE_ANIMAL", f"Deleted animal ID {animal_id}")
        return {"message": "Animal deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to delete animal: {str(e)}")