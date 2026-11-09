import logging
import math
from uuid import UUID
from io import BytesIO

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError

from app.core.permissions import get_current_user
from app.database.connection import supabase
from app.services.ai_client import predict_disease_remote
from app.services.storage_service import upload_scan_image, delete_scan_image

router = APIRouter()
logger = logging.getLogger(__name__)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_SIDE_PX = 1280
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}


def _user_id(current_user: dict) -> str:
    try:
        return str(UUID(current_user["sub"]))
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(401, "Invalid authenticated user.") from exc


def _validate_prediction(result: dict) -> list:
    if not isinstance(result, dict):
        raise HTTPException(502, "AI returned invalid prediction.")
    if "error" in result:
        raise HTTPException(502, "AI could not complete prediction.")

    detections = result.get("detections")
    if (
        not isinstance(detections, list)
        or result.get("status") not in {"completed", "no_detection"}
        or not isinstance(result.get("low_confidence"), bool)
    ):
        raise HTTPException(502, "AI returned invalid prediction.")

    for d in detections:
        conf = d.get("confidence") if isinstance(d, dict) else None
        if (
            not isinstance(d, dict)
            or not isinstance(d.get("class_name"), str)
            or not isinstance(conf, (int, float))
            or not math.isfinite(conf)
            or not 0 <= conf <= 1
        ):
            raise HTTPException(502, "AI returned invalid prediction.")

    return detections


@router.post("/scan")
async def scan_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    uid = _user_id(current_user)

    raw = await file.read(MAX_UPLOAD_BYTES + 1)
    if not raw:
        raise HTTPException(400, "Image is empty.")
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Image larger than 10MB.")

    try:
        with Image.open(BytesIO(raw)) as probe:
            fmt = probe.format
            probe.verify()
        if fmt not in ALLOWED_FORMATS:
            raise HTTPException(400, "Use JPEG, PNG or WEBP.")
        img = Image.open(BytesIO(raw))
        img.load()
        img = ImageOps.exif_transpose(img).convert("RGB")
        img.thumbnail((MAX_SIDE_PX, MAX_SIDE_PX))
        buf = BytesIO()
        img.save(buf, format="JPEG")
        processed = buf.getvalue()
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise HTTPException(400, "Invalid image file.") from exc

    # 1. AI prediction
    result = await predict_disease_remote(processed, "scan.jpg", "image/jpeg")
    detections = _validate_prediction(result)

    # 2. Upload image
    try:
        image_url = upload_scan_image(processed, uid)
    except Exception as exc:
        logger.error(f"Image upload failed: {exc}")
        raise HTTPException(500, "Prediction succeeded but image could not be saved.") from exc

    # 3. Save DB record
    best = detections[0] if detections else None
    scan_data = {
        "user_id": uid,
        "detected_disease": best["class_name"] if best else None,
        "confidence": best["confidence"] if best else None,
        "prediction": result,
        "image_url": image_url,
    }

    try:
        resp = supabase.table("disease_scans").insert(scan_data).select("*").execute()
        if not isinstance(resp.data, list) or len(resp.data) != 1:
            raise RuntimeError("DB insert returned no record.")
        return resp.data[0]
    except Exception as exc:
        logger.exception("DB insert failed after upload — cleaning up orphaned image.")
        delete_scan_image(image_url)
        raise HTTPException(500, "Prediction succeeded but result could not be saved.") from exc


@router.get("/history")
def get_history(current_user: dict = Depends(get_current_user)):
    uid = _user_id(current_user)
    try:
        resp = (
            supabase.table("disease_scans")
            .select("*")
            .eq("user_id", uid)
            .order("created_at", desc=True)
            .limit(100)
            .execute()
        )
        return resp.data or []
    except Exception as exc:
        logger.exception("History fetch failed")
        raise HTTPException(502, "Could not load history.") from exc


@router.get("/scans/{scan_id}")
def get_scan_result(scan_id: str, current_user: dict = Depends(get_current_user)):
    uid = _user_id(current_user)
    try:
        scan_uuid = str(UUID(scan_id))
    except (TypeError, ValueError) as exc:
        raise HTTPException(400, "Invalid scan ID.") from exc

    try:
        resp = (
            supabase.table("disease_scans")
            .select("*")
            .eq("id", scan_uuid)
            .eq("user_id", uid)
            .limit(1)
            .execute()
        )
    except Exception as exc:
        logger.exception("Scan fetch failed")
        raise HTTPException(502, "Could not load scan.") from exc

    if not resp.data:
        raise HTTPException(404, "Scan not found.")
    return resp.data[0]