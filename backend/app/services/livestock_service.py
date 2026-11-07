from app.database.connection import supabase
from fastapi import HTTPException

class LivestockService:
    @staticmethod
    def get_all(user_id: str):
        response = supabase.table("livestock").select("*").eq("user_id", user_id).execute()
        return response.data

    @staticmethod
    def get_by_id(animal_id: str, user_id: str):
        response = supabase.table("livestock").select("*").eq("id", animal_id).eq("user_id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Animal not found")
        return response.data[0]

    @staticmethod
    def create(user_id: str, data: dict):
        data["user_id"] = user_id
        response = supabase.table("livestock").insert(data).execute()
        return response.data[0]

    @staticmethod
    def update(animal_id: str, user_id: str, data: dict):
        response = supabase.table("livestock").update(data).eq("id", animal_id).eq("user_id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Animal not found or unauthorized")
        return response.data[0]

    @staticmethod
    def delete(animal_id: str, user_id: str):
        response = supabase.table("livestock").delete().eq("id", animal_id).eq("user_id", user_id).execute()
        return response.data

    @staticmethod
    def get_health_records(animal_id: str, user_id: str):
        response = supabase.table("animal_health_records").select("*").eq("animal_id", animal_id).execute()
        return response.data

    @staticmethod
    def add_health_record(animal_id: str, data: dict):
        data["animal_id"] = animal_id
        response = supabase.table("animal_health_records").insert(data).execute()
        return response.data[0]