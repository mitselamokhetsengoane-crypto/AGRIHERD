import logging
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError
from io import BytesIO

from app.core.permissions import get_current_user
from app.database.connection import supabase
from app.services.ai_client import predict_disease_remote # Use the new HTTP client

router = APIRouter()
logger = logging.getLogger(__name__)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_SIDE_PX = 1280
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}

@router.post("/scan")
async def scan_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
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
        raise HTTPException(status_code=400, detail="Unable to read this image. Upload a valid image.") from exc

    # 3. Call the separate AI service
    result = await predict_disease_remote(
        image_bytes=processed_data, 
        filename="scan.jpg", 
        content_type="image/jpeg"
    )

    # 4. Save the result to Supabase
    saved = False
    if result.get("detections"):
        best = result["detections"][0]
        try:
            supabase.table("disease_scans").insert({
                "user_id": current_user["sub"],
                "detected_disease": best["class_name"],
                "confidence": best["confidence"],
            }).execute()
            saved = True
        except Exception:
            logger.exception("Could not save scan history")

    result["saved"] = saved
    return result

@router.get("/history")
def get_scan_history(current_user: dict = Depends(get_current_user)):
    try:
        response = (supabase.table("disease_scans").select("*").eq("user_id", current_user["sub"])
                    .order("created_at", desc=True).limit(100).execute())
        return response.data or []
    except Exception as exc:
        logger.exception("Could not load scan history")
        raise HTTPException(status_code=502, detail="Could not load your scan history right now.") from exc