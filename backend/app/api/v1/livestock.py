from fastapi import APIRouter, Depends
from app.core.permissions import get_current_user
from app.services.livestock_service import LivestockService
from app.services.audit_service import AuditService

router = APIRouter()

@router.get("/")
def get_all_animals(current_user: dict = Depends(get_current_user)):
    return LivestockService.get_all(current_user["sub"])

@router.get("/{animal_id}")
def get_animal(animal_id: str, current_user: dict = Depends(get_current_user)):
    return LivestockService.get_by_id(animal_id, current_user["sub"])

@router.post("/")
def create_animal(animal: dict, current_user: dict = Depends(get_current_user)):
    result = LivestockService.create(current_user["sub"], animal)
    AuditService.log(current_user["sub"], "CREATE_ANIMAL", f"Added animal {animal.get('name')}")
    return result

@router.delete("/{animal_id}")
def delete_animal(animal_id: str, current_user: dict = Depends(get_current_user)):
    LivestockService.delete(animal_id, current_user["sub"])
    AuditService.log(current_user["sub"], "DELETE_ANIMAL", f"Deleted animal ID {animal_id}")
    return {"message": "Animal deleted"}