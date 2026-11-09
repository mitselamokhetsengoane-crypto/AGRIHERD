import logging
import math
from io import BytesIO
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from PIL import Image, ImageOps, UnidentifiedImageError

from app.core.config import settings
from app.core.permissions import get_current_user
from app.database.connection import supabase
from app.services.ai_client import predict_disease_remote
from app.services.storage_service import (StorageError, attach_display_urls, check_storage, delete_scan_image,
                                          resolve_image_url, upload_scan_image)

router = APIRouter()
logger = logging.getLogger(__name__)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_SIDE_PX = 1280
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}


def _user_id(current_user: dict) -> str:
    """The farmer's id ALWAYS comes from the verified token, never from the request body."""
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


def _prepare_image(raw: bytes) -> bytes:
    """Validate, fix phone rotation, shrink, and re-encode as JPEG. Raises HTTPException(400) for anything that is not a usable image."""
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
        img.save(buf, format="JPEG", quality=88, optimize=True)
        return buf.getvalue()
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise HTTPException(400, "Invalid image file.") from exc


@router.post("/scan")
async def scan_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Camera photo and uploaded file both arrive here. Order: validate -> AI prediction -> store image -> save record -> return record."""
    uid = _user_id(current_user)

    raw = await file.read(MAX_UPLOAD_BYTES + 1)
    if not raw:
        raise HTTPException(400, "Image is empty.")
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Image larger than 10MB.")
    processed = await run_in_threadpool(_prepare_image, raw)

    # 1. AI prediction (its errors are passed through with the real cause)
    result = await predict_disease_remote(processed, "scan.jpg", "image/jpeg")
    detections = _validate_prediction(result)

    # 2. Store the actual image file in Supabase Storage
    image_url, warning = None, None
    try:
        image_url = await run_in_threadpool(upload_scan_image, processed, uid)
    except StorageError as exc:
        logger.error("Scan image NOT stored for user %s: %s (%s)", uid, exc.code, exc)
        if settings.SCAN_REQUIRE_IMAGE:
            raise HTTPException(502, f"The scan was analysed but its photo could not be stored. [{exc.code}]") from exc
        warning = f"The diagnosis was saved but the photo could not be stored. [{exc.code}]"

    # 3. Save the record. Only now is the scan reported as saved.
    best = detections[0] if detections else None
    scan_data = {
        "user_id": uid,
        "detected_disease": best["class_name"] if best else None,
        "confidence": best["confidence"] if best else None,
        "prediction": result,
        "image_url": image_url,
    }
    try:
        # insert() returns the saved row by default, so no extra .select() is needed (it is missing in older client versions).
        resp = await run_in_threadpool(lambda: supabase.table("disease_scans").insert(scan_data).execute())
        if not isinstance(resp.data, list) or len(resp.data) != 1:
            raise RuntimeError("The database did not return the saved scan record.")
    except Exception as exc:
        logger.exception("Saving the scan record failed (%s). Does disease_scans have image_url and prediction columns?", type(exc).__name__)
        if image_url:
            await run_in_threadpool(delete_scan_image, image_url)       # do not leave an orphaned file behind
        raise HTTPException(500, "The prediction succeeded, but the result could not be saved. Please try again.") from exc

    row = dict(resp.data[0])
    row["image_display_url"] = await run_in_threadpool(resolve_image_url, row.get("image_url"))
    row["image_saved"] = bool(image_url)
    if warning:
        row["warning"] = warning
    return row


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
        return attach_display_urls(resp.data or [])
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
    return attach_display_urls(resp.data)[0]


@router.get("/storage-check")
def storage_check(current_user: dict = Depends(get_current_user)):
    """Self-test of image storage (bucket, upload, public link, cleanup). Disabled unless ENABLE_DIAGNOSTICS=true."""
    if not settings.ENABLE_DIAGNOSTICS:
        raise HTTPException(404, "Not found.")
    _user_id(current_user)
    return check_storage()