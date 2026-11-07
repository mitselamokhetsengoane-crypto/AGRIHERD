import logging
import os
import tempfile
from io import BytesIO

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from PIL import Image, UnidentifiedImageError

from app.core.permissions import get_current_user
from app.services.ai_service import predict_disease
from app.database.connection import supabase

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/scan")
def scan_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    image_data = file.file.read()
    if not image_data:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")

    try:
        with Image.open(BytesIO(image_data)) as image:
            image.verify()
            image_format = image.format
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise HTTPException(
            status_code=400,
            detail="Unable to read this image. Upload a valid JPEG, PNG, or WEBP file.",
        ) from exc

    suffix_by_format = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp"}
    suffix = suffix_by_format.get(image_format)
    if suffix is None:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image format. Upload a JPEG, PNG, or WEBP file.",
        )

    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_file:
            temp_path = temp_file.name
            temp_file.write(image_data)

        result = predict_disease(temp_path)

        if "error" in result:
            raise HTTPException(status_code=503, detail=result["error"])

        if result["detections"]:
            best_detection = max(result["detections"], key=lambda x: x["confidence"])
            scan_record = {
                "user_id": current_user["sub"],
                "detected_disease": best_detection["class_name"],
                "confidence": best_detection["confidence"]
            }
            supabase.table("disease_scans").insert(scan_record).execute()

        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Disease scan request failed")
        raise HTTPException(
            status_code=500,
            detail="The scan could not be completed. Please try again with a clear JPEG, PNG, or WEBP image.",
        ) from exc
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

@router.get("/history")
def get_scan_history(current_user: dict = Depends(get_current_user)):
    response = supabase.table("disease_scans").select("*").eq("user_id", current_user["sub"]).order("created_at", desc=True).execute()
    return response.data