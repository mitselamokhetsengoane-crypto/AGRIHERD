import io
import logging
import re
import uuid
from typing import Optional

import httpx

from app.core.config import settings
from app.database.connection import SERVICE_KEY_ROLE, supabase

logger = logging.getLogger(__name__)

BUCKET = settings.SUPABASE_SCAN_BUCKET
IS_PUBLIC = settings.SCAN_BUCKET_PUBLIC


class StorageError(RuntimeError):
    """Image storage failed. `code` is a stable machine-readable reason; the message is safe to show to users."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


def classify_error(exc: Exception) -> tuple[str, str]:
    """Turn a raw Supabase/HTTP error into (code, human explanation). The raw error is logged separately, never shown to users."""
    text = " ".join(str(x) for x in (exc, getattr(exc, "message", ""), getattr(exc, "code", ""), getattr(exc, "status", ""))).lower()
    if "row-level security" in text or "unauthorized" in text or "not authorized" in text or "403" in text:
        return "STORAGE_PERMISSION_DENIED", "the server is not allowed to write to the storage bucket"
    if "invalid jwt" in text or "invalid api key" in text or "apikey" in text or "401" in text:
        return "STORAGE_BAD_CREDENTIALS", "the server's Supabase key was rejected"
    if "bucket not found" in text or ("404" in text and "bucket" in text):
        return "STORAGE_BUCKET_NOT_FOUND", f"the storage bucket '{BUCKET}' was not found"
    if "maximum allowed size" in text or "payload too large" in text or "413" in text:
        return "STORAGE_FILE_TOO_LARGE", "the image is larger than the bucket's size limit"
    if "mime type" in text or "not supported" in text or "invalid mime" in text:
        return "STORAGE_MIME_NOT_ALLOWED", "the bucket does not accept this image type"
    if "already exists" in text or "duplicate" in text or "409" in text:
        return "STORAGE_CONFLICT", "a file with this name already exists"
    if isinstance(exc, (httpx.TimeoutException, httpx.TransportError)) or "timed out" in text or "connection" in text:
        return "STORAGE_UNREACHABLE", "the storage service could not be reached"
    return "STORAGE_ERROR", "the storage service returned an error"


def _log_failure(action: str, exc: Exception) -> None:
    # Full technical detail goes to the server log only (no keys or tokens are part of these error objects).
    code, why = classify_error(exc)
    logger.error("Storage %s failed [%s: %s] bucket='%s' server_key_role=%s | %s: %s (status=%s, code=%s)", action, code, why, BUCKET, SERVICE_KEY_ROLE,
                 type(exc).__name__, getattr(exc, "message", None) or str(exc), getattr(exc, "status", None), getattr(exc, "code", None))


def _public_url(path: str) -> str:
    result = supabase.storage.from_(BUCKET).get_public_url(path)
    if isinstance(result, dict):                       # some library versions return {"publicUrl": ...} or {"data": {"publicUrl": ...}}
        result = result.get("publicUrl") or (result.get("data") or {}).get("publicUrl")
    if not result or not isinstance(result, str):
        raise RuntimeError("Supabase returned an empty public URL.")
    return result.rstrip("?")                          # some versions append a stray '?'


def _extract_path(stored: str) -> Optional[str]:
    """Object path from either a stored path ('uid/x.jpg') or any Supabase Storage URL (public, signed)."""
    if not stored:
        return None
    if not stored.startswith("http"):
        return stored.lstrip("/")
    match = re.search(r"/object/(?:public|sign|authenticated)/" + re.escape(BUCKET) + r"/(.+?)(?:\?|$)", stored)
    return match.group(1) if match else None


def upload_scan_image(image_bytes: bytes, user_id: str, content_type: str = "image/jpeg") -> str:
    """
    Upload the image to the existing bucket under '<user_id>/<random>.jpg'.
    Returns what must be stored in disease_scans.image_url: the public URL (public bucket) or the object path (private bucket).
    Raises StorageError with a precise code on failure.
    """
    path = f"{user_id}/{uuid.uuid4().hex}.jpg"
    try:
        supabase.storage.from_(BUCKET).upload(path, image_bytes, {"content-type": content_type, "upsert": "false"})
    except Exception as exc:
        _log_failure("upload", exc)
        code, why = classify_error(exc)
        raise StorageError(code, f"Image storage failed: {why}.") from exc

    if not IS_PUBLIC:
        logger.info("Stored scan image (private bucket): %s", path)
        return path
    try:
        url = _public_url(path)
    except Exception as exc:
        _log_failure("public URL", exc)
        _remove_quietly(path)
        raise StorageError("STORAGE_URL_FAILED", "Image storage failed: could not create the image link.") from exc
    logger.info("Stored scan image: %s", path)
    return url


def resolve_image_url(stored: Optional[str]) -> Optional[str]:
    """URL the browser should use for a stored value. Public mode: the stored URL. Private mode: a fresh signed URL."""
    path = _extract_path(stored or "")
    if not path:
        return stored or None
    if IS_PUBLIC:
        return stored if (stored or "").startswith("http") else _safe(lambda: _public_url(path))
    return _safe(lambda: _signed_url(path))


def _signed_url(path: str) -> Optional[str]:
    result = supabase.storage.from_(BUCKET).create_signed_url(path, settings.SIGNED_URL_SECONDS)
    return _normalise_signed(result)


def _normalise_signed(result) -> Optional[str]:
    if isinstance(result, dict):
        result = result.get("signedURL") or result.get("signedUrl") or result.get("signed_url") or (result.get("data") or {}).get("signedUrl")
    if not result or not isinstance(result, str):
        return None
    if result.startswith("http"):
        return result
    return f"{settings.SUPABASE_URL}/storage/v1{result if result.startswith('/') else '/' + result}"


def _safe(fn):
    try:
        return fn()
    except Exception as exc:
        logger.warning("Could not create image URL: %s", type(exc).__name__)
        return None


def attach_display_urls(rows: list[dict]) -> list[dict]:
    """Add 'image_display_url' to each scan row. Public bucket: no network calls. Private bucket: one bulk signing request."""
    out = [dict(r) for r in rows]
    if IS_PUBLIC:
        for r in out:
            r["image_display_url"] = resolve_image_url(r.get("image_url"))
        return out
    paths = {i: _extract_path(r.get("image_url") or "") for i, r in enumerate(out)}
    wanted = sorted({p for p in paths.values() if p})
    signed: dict[str, Optional[str]] = {}
    if wanted:
        try:
            for item in supabase.storage.from_(BUCKET).create_signed_urls(wanted, settings.SIGNED_URL_SECONDS):
                signed[item.get("path")] = None if item.get("error") else _normalise_signed(item)
        except Exception as exc:
            logger.warning("Bulk signing failed (%s); falling back to one-by-one.", type(exc).__name__)
            signed = {p: _safe(lambda p=p: _signed_url(p)) for p in wanted}
    for i, r in enumerate(out):
        r["image_display_url"] = signed.get(paths[i]) if paths[i] else None
    return out


def delete_scan_image(stored: Optional[str]) -> None:
    """Best-effort removal of an image (used to avoid orphaned files). Failures are logged, never raised."""
    path = _extract_path(stored or "")
    if path:
        _remove_quietly(path)


def _remove_quietly(path: str) -> None:
    try:
        supabase.storage.from_(BUCKET).remove([path])
        logger.info("Removed image: %s", path)
    except Exception as exc:
        logger.warning("Could not remove image %s: %s", path, type(exc).__name__)


def check_storage() -> dict:
    """Self-test used by GET /disease-scanner/storage-check: bucket lookup, test upload, public-link reachability, cleanup."""
    report = {"bucket": BUCKET, "mode": "public" if IS_PUBLIC else "private", "server_key_role": SERVICE_KEY_ROLE,
              "bucket_found": None, "bucket_is_public": None, "upload_ok": False, "public_url_reachable": None, "cleanup_ok": None,
              "problem": None, "hint": None}
    if SERVICE_KEY_ROLE != "service_role":
        report["problem"] = f"SUPABASE_SERVICE_ROLE_KEY holds a '{SERVICE_KEY_ROLE}' key."
        report["hint"] = "Use the service_role (secret) key from Supabase > Project Settings > API in the Render environment."
    try:
        bucket = supabase.storage.get_bucket(BUCKET)
        report["bucket_found"] = True
        report["bucket_is_public"] = bool(getattr(bucket, "public", None) if not isinstance(bucket, dict) else bucket.get("public"))
        if IS_PUBLIC and report["bucket_is_public"] is False:
            report["problem"] = report["problem"] or "SCAN_BUCKET_PUBLIC=true but the bucket is private."
            report["hint"] = report["hint"] or "Make the bucket public in Supabase Storage, or set SCAN_BUCKET_PUBLIC=false on Render."
    except Exception as exc:
        _log_failure("bucket lookup", exc)
        code, why = classify_error(exc)
        report["bucket_found"] = False if code == "STORAGE_BUCKET_NOT_FOUND" else None
        report["problem"] = report["problem"] or f"{code}: {why}."

    from PIL import Image
    buf = io.BytesIO()
    Image.new("RGB", (1, 1), (0, 128, 0)).save(buf, "JPEG")
    path = f"_diagnostics/{uuid.uuid4().hex}.jpg"
    try:
        supabase.storage.from_(BUCKET).upload(path, buf.getvalue(), {"content-type": "image/jpeg", "upsert": "false"})
        report["upload_ok"] = True
        if IS_PUBLIC:
            try:
                report["public_url_reachable"] = httpx.get(_public_url(path), timeout=10).status_code == 200
            except Exception:
                report["public_url_reachable"] = False
    except Exception as exc:
        _log_failure("diagnostic upload", exc)
        code, why = classify_error(exc)
        report["problem"] = f"{code}: {why}."
        report["hint"] = report["hint"] or {
            "STORAGE_PERMISSION_DENIED": "The backend is not using the service_role key, or a storage policy blocks it.",
            "STORAGE_BUCKET_NOT_FOUND": f"Create the bucket or fix SUPABASE_SCAN_BUCKET (currently '{BUCKET}').",
            "STORAGE_BAD_CREDENTIALS": "Re-copy SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL from the same Supabase project (no spaces).",
        }.get(code, "See the server log line starting 'Storage diagnostic upload failed'.")
    if report["upload_ok"]:
        try:
            supabase.storage.from_(BUCKET).remove([path])
            report["cleanup_ok"] = True
        except Exception:
            report["cleanup_ok"] = False
    if report["upload_ok"] and IS_PUBLIC and report["public_url_reachable"] is False:
        report["problem"] = report["problem"] or "Upload works but the public link is not reachable (bucket is probably private)."
        report["hint"] = report["hint"] or "Make the bucket public, or set SCAN_BUCKET_PUBLIC=false."
    report["ok"] = bool(report["upload_ok"] and not report["problem"])
    return report