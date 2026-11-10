from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.permissions import get_current_user
from app.database.connection import supabase
from app.services.livestock_service import LivestockService
from app.services.audit_service import AuditService

router = APIRouter()

# --- Schemas for the 4 new modules ---
class HealthRecordCreate(BaseModel):
    date: str
    condition: str
    treatment: Optional[str] = None
    notes: Optional[str] = None

class VaccinationCreate(BaseModel):
    vaccine_name: str
    date_administered: str
    next_due_date: Optional[str] = None
    notes: Optional[str] = None

class FeedingCreate(BaseModel):
    date: str
    feed_type: str
    quantity: Optional[str] = None
    notes: Optional[str] = None

class BreedingCreate(BaseModel):
    breeding_date: str
    expected_birth_date: Optional[str] = None
    actual_birth_date: Optional[str] = None
    outcome: Optional[str] = None
    notes: Optional[str] = None

# --- Existing Animal Routes ---
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
        allowed_fields = ["animal_id", "name", "type", "breed", "gender", "age", "weight", "health_status", "notes"]
        clean_data = {k: v for k, v in animal.items() if k in allowed_fields}
        for key in ["age", "weight"]:
            if clean_data.get(key) == "": clean_data[key] = None
        result = LivestockService.create(current_user["sub"], clean_data)
        AuditService.log(current_user["sub"], "CREATE_ANIMAL", f"Added animal {clean_data.get('name')}")
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")

@router.delete("/{animal_id}")
def delete_animal(animal_id: str, current_user: dict = Depends(get_current_user)):
    try:
        LivestockService.delete(animal_id, current_user["sub"])
        AuditService.log(current_user["sub"], "DELETE_ANIMAL", f"Deleted animal ID {animal_id}")
        return {"message": "Animal deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to delete animal: {str(e)}")


# --- HEALTH RECORDS ---
@router.get("/{animal_id}/health")
def get_health_records(animal_id: str, current_user: dict = Depends(get_current_user)):
    # Verify ownership implicitly by fetching animal
    LivestockService.get_by_id(animal_id, current_user["sub"]) 
    resp = supabase.table("animal_health_records").select("*").eq("animal_id", animal_id).order("date", desc=True).execute()
    return resp.data or []

@router.post("/{animal_id}/health")
def add_health_record(animal_id: str, data: HealthRecordCreate, current_user: dict = Depends(get_current_user)):
    LivestockService.get_by_id(animal_id, current_user["sub"])
    row = data.dict(exclude_none=True)
    row["animal_id"] = animal_id
    resp = supabase.table("animal_health_records").insert(row).execute()
    return resp.data[0]

# --- VACCINATIONS ---
@router.get("/{animal_id}/vaccinations")
def get_vaccinations(animal_id: str, current_user: dict = Depends(get_current_user)):
    LivestockService.get_by_id(animal_id, current_user["sub"])
    resp = supabase.table("vaccination_records").select("*").eq("animal_id", animal_id).order("date_administered", desc=True).execute()
    return resp.data or []

@router.post("/{animal_id}/vaccinations")
def add_vaccination(animal_id: str, data: VaccinationCreate, current_user: dict = Depends(get_current_user)):
    LivestockService.get_by_id(animal_id, current_user["sub"])
    row = data.dict(exclude_none=True)
    if not row.get("next_due_date"):
        row.pop("next_due_date", None)
    row["animal_id"] = animal_id
    resp = supabase.table("vaccination_records").insert(row).execute()
    return resp.data[0]

# --- FEEDING ---
@router.get("/{animal_id}/feeding")
def get_feeding_records(animal_id: str, current_user: dict = Depends(get_current_user)):
    LivestockService.get_by_id(animal_id, current_user["sub"])
    resp = supabase.table("feeding_records").select("*").eq("animal_id", animal_id).order("date", desc=True).execute()
    return resp.data or []

@router.post("/{animal_id}/feeding")
def add_feeding_record(animal_id: str, data: FeedingCreate, current_user: dict = Depends(get_current_user)):
    LivestockService.get_by_id(animal_id, current_user["sub"])
    row = data.dict(exclude_none=True)
    row["animal_id"] = animal_id
    resp = supabase.table("feeding_records").insert(row).execute()
    return resp.data[0]

# --- BREEDING ---
@router.get("/{animal_id}/breeding")
def get_breeding_records(animal_id: str, current_user: dict = Depends(get_current_user)):
    LivestockService.get_by_id(animal_id, current_user["sub"])
    resp = supabase.table("breeding_records").select("*").eq("animal_id", animal_id).order("breeding_date", desc=True).execute()
    return resp.data or []

@router.post("/{animal_id}/breeding")
def add_breeding_record(animal_id: str, data: BreedingCreate, current_user: dict = Depends(get_current_user)):
    LivestockService.get_by_id(animal_id, current_user["sub"])
    row = data.dict(exclude_none=True)
    for field in ("expected_birth_date", "actual_birth_date"):
        if not row.get(field):
            row.pop(field, None)
    row["animal_id"] = animal_id
    resp = supabase.table("breeding_records").insert(row).execute()
    return resp.data[0]