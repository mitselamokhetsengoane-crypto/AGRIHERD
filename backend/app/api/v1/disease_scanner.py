from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.core.permissions import get_current_user
from app.services.ai_service import predict_disease
from app.database.connection import supabase
import os
import shutil
import uuid

router = APIRouter()

@router.post("/scan")
def scan_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    # 1. Save uploaded file temporarily
    file_ext = file.filename.split(".")[-1]
    temp_filename = f"temp_{uuid.uuid4()}.{file_ext}"
    temp_path = f"/tmp/{temp_filename}"
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 2. Run AI Prediction
        result = predict_disease(temp_path)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        # 3. Save to Database (Get highest confidence detection)
        if result["detections"]:
            best_detection = max(result["detections"], key=lambda x: x["confidence"])
            
            scan_record = {
                "user_id": current_user["sub"],
                "detected_disease": best_detection["class_name"],
                "confidence": best_detection["confidence"]
            }
            supabase.table("disease_scans").insert(scan_record).execute()
            
        return result
    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.get("/history")
def get_scan_history(current_user: dict = Depends(get_current_user)):
    response = supabase.table("disease_scans").select("*").eq("user_id", current_user["sub"]).order("created_at", desc=True).execute()
    return response.data