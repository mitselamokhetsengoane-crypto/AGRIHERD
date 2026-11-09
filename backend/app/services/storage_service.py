import uuid
import logging
from app.database.connection import supabase

logger = logging.getLogger(__name__)

BUCKET_NAME = "disease-scans"


def upload_scan_image(image_bytes: bytes, user_id: str) -> str:
    """Upload image to Supabase Storage. Returns public URL. Raises on failure."""
    file_name = f"{user_id}/{uuid.uuid4()}.jpg"

    try:
        supabase.storage.from_(BUCKET_NAME).upload(
            path=file_name,
            file=image_bytes,
            file_options={"content-type": "image/jpeg", "upsert": "false"},
        )
    except Exception as exc:
        logger.error(f"Storage upload failed: {exc}")
        raise RuntimeError(f"Image upload failed: {exc}") from exc

    try:
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_name)
    except Exception as exc:
        logger.error(f"Failed to get public URL: {exc}")
        _delete_quietly(file_name)
        raise RuntimeError(f"Could not get public URL: {exc}") from exc

    if not public_url or not isinstance(public_url, str):
        _delete_quietly(file_name)
        raise RuntimeError("Supabase returned an empty image URL.")

    logger.info(f"Uploaded image: {public_url}")
    return public_url


def delete_scan_image(image_url: str) -> None:
    """Best-effort deletion of an orphaned image."""
    if not image_url:
        return
    try:
        marker = f"/{BUCKET_NAME}/"
        if marker in image_url:
            path = image_url.split(marker, 1)[1].split("?")[0]
            supabase.storage.from_(BUCKET_NAME).remove([path])
            logger.info(f"Cleaned orphaned image: {path}")
    except Exception as exc:
        logger.warning(f"Could not clean orphaned image: {exc}")


def _delete_quietly(path: str) -> None:
    try:
        supabase.storage.from_(BUCKET_NAME).remove([path])
    except Exception:
        pass