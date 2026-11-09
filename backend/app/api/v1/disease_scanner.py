import logging
import math
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError
from io import BytesIO

from app.core.permissions import get_current_user
from app.database.connection import supabase
from app.services.ai_client import predict_disease_remote

router = APIRouter()
logger = logging.getLogger(__name__)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_SIDE_PX = 1280
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}


def _get_user_id(current_user: dict) -> str:
    try:
        return str(UUID(current_user["sub"]))
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=401, detail="Invalid authenticated user.") from exc


def _validate_prediction(result: dict) -> list:
    if not isinstance(result, dict):
        raise HTTPException(status_code=502, detail="The AI service returned an invalid prediction.")
    if "error" in result:
        raise HTTPException(
            status_code=502,
            detail="The AI service could not complete the disease prediction.",
        )

    detections = result.get("detections")
    if (
        not isinstance(detections, list)
        or result.get("status") not in {"completed", "no_detection"}
        or not isinstance(result.get("low_confidence"), bool)
    ):
        raise HTTPException(status_code=502, detail="The AI service returned an invalid prediction.")

    for detection in detections:
        confidence = detection.get("confidence") if isinstance(detection, dict) else None
        if (
            not isinstance(detection, dict)
            or not isinstance(detection.get("class_name"), str)
            or not isinstance(confidence, (int, float))
            or not math.isfinite(confidence)
            or not 0 <= confidence <= 1
        ):
            raise HTTPException(status_code=502, detail="The AI service returned an invalid prediction.")

    return detections


@router.post("/scan")
async def scan_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    user_id = _get_user_id(current_user)

    # 1. Read and validate image size
    image_data = await file.read(MAX_UPLOAD_BYTES + 1)
    if not image_data:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")
    if len(image_data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"The image is larger than {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.")

    # 2. Validate image format and preprocess (resize/EXIF) on the main backend
    # This saves bandwidth by not sending 10MB files to Cloud Run if they are bad.
    try:
        with Image.open(BytesIO(image_data)) as probe:
            image_format = probe.format
            probe.verify()
        if image_format not in ALLOWED_FORMATS:
            raise HTTPException(status_code=400, detail="Unsupported image format. Upload a JPEG, PNG, or WEBP file.")
        
        image = Image.open(BytesIO(image_data))
        image.load()
        image = ImageOps.exif_transpose(image).convert("RGB")
        image.thumbnail((MAX_SIDE_PX, MAX_SIDE_PX))
        
        # Save the preprocessed image back to bytes
        processed_buffer = BytesIO()
        image.save(processed_buffer, format="JPEG")
        processed_data = processed_buffer.getvalue()
        
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise HTTPException(
            status_code=400,
            detail="Unable to read this image. Upload a valid JPEG, PNG, or WEBP file.",
        ) from exc

    # 3. Call the separate AI service
    result = await predict_disease_remote(
        image_bytes=processed_data, 
        filename="scan.jpg", 
        content_type="image/jpeg"
    )
    detections = _validate_prediction(result)

    # 4. Save the result to Supabase
    best = detections[0] if detections else None
    scan_data = {
        "user_id": user_id,
        "detected_disease": best["class_name"] if best else None,
        "confidence": best["confidence"] if best else None,
        "prediction": result,
    }
    try:
        response = (
            supabase.table("disease_scans")
            .insert(scan_data)
            .select("*")
            .execute()
        )
        if not isinstance(response.data, list) or len(response.data) != 1:
            raise RuntimeError("The database did not return the saved scan record.")
        return response.data[0]
    except Exception as exc:
        logger.exception("Could not save scan result")
        raise HTTPException(
            status_code=500,
            detail="The prediction succeeded, but its result could not be saved. Please try again.",
        ) from exc

@router.get("/history")
def get_scan_history(current_user: dict = Depends(get_current_user)):
    user_id = _get_user_id(current_user)
    try:
        response = (supabase.table("disease_scans").select("*").eq("user_id", user_id)
                    .order("created_at", desc=True).limit(100).execute())
        return response.data or []
    except Exception as exc:
        logger.exception("Could not load scan history")
        raise HTTPException(status_code=502, detail="Could not load your scan history right now.") from exc


@router.get("/scans/{scan_id}")
def get_scan_result(scan_id: str, current_user: dict = Depends(get_current_user)):
    user_id = _get_user_id(current_user)
    try:
        scan_uuid = str(UUID(scan_id))
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="Invalid scan ID.") from exc

    try:
        response = (
            supabase.table("disease_scans")
            .select("*")
            .eq("id", scan_uuid)
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
    except Exception as exc:
        logger.exception("Could not load scan result")
        raise HTTPException(status_code=502, detail="Could not load this scan result right now.") from exc

    if not response.data:
        raise HTTPException(status_code=404, detail="Scan result not found.")
    return response.data[0]