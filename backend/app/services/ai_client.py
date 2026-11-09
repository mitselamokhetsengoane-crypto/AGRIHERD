import logging
import httpx
from fastapi import HTTPException
from app.core.config import settings

logger = logging.getLogger(__name__)


async def wake_ai_service() -> dict:
    """Ping /health to wake a sleeping Render service."""
    if not settings.AI_SERVICE_URL:
        return {"status": "error", "message": "AI_SERVICE_URL not configured"}

    url = f"{settings.AI_SERVICE_URL.rstrip('/')}/health"
    try:
        logger.info(f"Waking AI service: {url}")
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.get(url)
            r.raise_for_status()
            logger.info("AI service awake.")
            return {"status": "awake", "response": r.json()}
    except Exception as exc:
        logger.error(f"Wake failed: {exc}")
        return {"status": "error", "message": str(exc)}


async def predict_disease_remote(image_bytes: bytes, filename: str, content_type: str) -> dict:
    if not settings.AI_SERVICE_URL or not settings.AI_SERVICE_TOKEN:
        raise HTTPException(503, "AI service is not configured.")

    url = f"{settings.AI_SERVICE_URL.rstrip('/')}/predict"
    headers = {"Authorization": f"Bearer {settings.AI_SERVICE_TOKEN}"}
    files = {"file": (filename, image_bytes, content_type)}

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(url, headers=headers, files=files)
            if r.status_code >= 400:
                try:
                    detail = r.json().get("detail", f"AI error {r.status_code}")
                except Exception:
                    detail = f"AI error {r.status_code}: {r.text[:200]}"
                logger.error(f"AI service {r.status_code}: {detail}")
                raise HTTPException(502 if r.status_code >= 500 else r.status_code, detail)

            result = r.json()
            if not isinstance(result, dict):
                raise HTTPException(502, "AI service returned non-object response.")
            return result

    except httpx.TimeoutException:
        logger.error("AI service timeout (120s).")
        raise HTTPException(504, "AI service took too long. It may have been asleep — please try again.")
    except httpx.RequestError as exc:
        logger.error(f"AI service unreachable: {exc}")
        raise HTTPException(503, "Could not reach AI service. It may be asleep.")