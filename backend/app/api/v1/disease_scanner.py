import logging
import os
from io import BytesIO

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError

from app.core.permissions import get_current_user
from app.database.connection import supabase
from app.services.ai_service import predict_disease

router = APIRouter()
logger = logging.getLogger(__name__)

MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_MB", "10")) * 1024 * 1024
MAX_SIDE_PX = 1280                      # larger photos are shrunk before inference (saves memory and time)
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}


@router.post("/scan")
def scan_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    # Read at most MAX+1 bytes so a huge upload can never exhaust server memory.
    image_data = file.file.read(MAX_UPLOAD_BYTES + 1)
    if not image_data:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")
    if len(image_data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"The image is larger than {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.")

    try:
        with Image.open(BytesIO(image_data)) as probe:
            image_format = probe.format
            probe.verify()
        if image_format not in ALLOWED_FORMATS:
            raise HTTPException(status_code=400, detail="Unsupported image format. Upload a JPEG, PNG, or WEBP file.")
        image = Image.open(BytesIO(image_data))
        image.load()
        image = ImageOps.exif_transpose(image).convert("RGB")     # phone photos: honour rotation, drop alpha
        image.thumbnail((MAX_SIDE_PX, MAX_SIDE_PX))
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise HTTPException(status_code=400, detail="Unable to read this image. Upload a valid JPEG, PNG, or WEBP file.") from exc

    try:
        result = predict_disease(image)
        if "error" in result:
            raise HTTPException(status_code=result.get("status_code", 503), detail=result["error"])

        saved = False
        if result["detections"]:
            best = result["detections"][0]            # already sorted by confidence
            try:
                supabase.table("disease_scans").insert({
                    "user_id": current_user["sub"],
                    "detected_disease": best["class_name"],
                    "confidence": best["confidence"],
                }).execute()
                saved = True
            except Exception:
                # The prediction is valid even if saving the history row fails: return it, and say it was not saved.
                logger.exception("Could not save scan history")
        result["saved"] = saved
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Disease scan request failed")
        raise HTTPException(status_code=500, detail="The scan could not be completed. Please try again with a clear JPEG, PNG, or WEBP image.") from exc


@router.get("/history")
def get_scan_history(current_user: dict = Depends(get_current_user)):
    try:
        response = (supabase.table("disease_scans").select("*").eq("user_id", current_user["sub"])
                    .order("created_at", desc=True).limit(100).execute())
        return response.data or []
    except Exception as exc:
        logger.exception("Could not load scan history")
        raise HTTPException(status_code=502, detail="Could not load your scan history right now. Please try again.") from exc