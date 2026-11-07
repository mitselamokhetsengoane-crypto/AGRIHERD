from app.database.connection import supabase
from fastapi import HTTPException

class CropService:
    @staticmethod
    def get_all(user_id: str):
        response = supabase.table("crops").select("*").eq("user_id", user_id).execute()
        return response.data

    @staticmethod
    def get_by_id(crop_id: str, user_id: str):
        response = supabase.table("crops").select("*").eq("id", crop_id).eq("user_id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Crop not found")
        return response.data[0]

    @staticmethod
    def create(user_id: str, data: dict):
        data["user_id"] = user_id
        response = supabase.table("crops").insert(data).execute()
        return response.data[0]

    @staticmethod
    def delete(crop_id: str, user_id: str):
        response = supabase.table("crops").delete().eq("id", crop_id).eq("user_id", user_id).execute()
        return response.data

    @staticmethod
    def get_planting_records(crop_id: str):
        response = supabase.table("planting_records").select("*").eq("crop_id", crop_id).execute()
        return response.data

    @staticmethod
    def get_harvest_records(crop_id: str):
        response = supabase.table("harvest_records").select("*").eq("crop_id", crop_id).execute()
        return response.data