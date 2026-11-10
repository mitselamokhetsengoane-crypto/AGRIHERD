import asyncio
import logging
import time

import httpx
from fastapi import HTTPException

from app.core.config import settings

logger = logging.getLogger(__name__)

_WAKE_POLL_SECONDS = 3.0
_PROXY_STATUSES = {502, 503, 504}


def _timeouts() -> httpx.Timeout:
    return httpx.Timeout(connect=settings.AI_CONNECT_TIMEOUT, read=settings.AI_READ_TIMEOUT, write=30.0, pool=10.0)


def _app_detail(response: httpx.Response):
    """Message written by the AI service ITSELF (JSON {"detail": "..."}). A hosting proxy's error page has none."""
    try:
        detail = response.json().get("detail")
        return detail if isinstance(detail, str) and detail else None
    except Exception:
        return None


async def _wait_until_awake(client: httpx.AsyncClient, base: str) -> bool:
    """A sleeping free-tier service needs time to start. Poll its cheap /health endpoint until it answers or the budget ends."""
    deadline = time.monotonic() + settings.AI_WAKE_SECONDS
    while time.monotonic() < deadline:
        try:
            r = await client.get(f"{base}/health", timeout=httpx.Timeout(5.0))
            if r.status_code == 200:
                return True
        except httpx.HTTPError:
            pass
        await asyncio.sleep(_WAKE_POLL_SECONDS)
    return False


async def wake_ai_service() -> dict:
    """Ping /health to wake a sleeping Render service (kept for existing callers)."""
    if not settings.AI_SERVICE_URL:
        return {"status": "error", "message": "AI_SERVICE_URL not configured"}
    url = f"{settings.AI_SERVICE_URL.rstrip('/')}/health"
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(connect=settings.AI_CONNECT_TIMEOUT, read=settings.AI_WAKE_SECONDS, write=10.0, pool=10.0)) as client:
            r = await client.get(url)
            r.raise_for_status()
            return {"status": "awake", "response": r.json()}
    except Exception as exc:
        logger.error("Wake failed: %s", type(exc).__name__)
        return {"status": "error", "message": type(exc).__name__}


async def predict_disease_remote(image_bytes: bytes, filename: str, content_type: str) -> dict:
    """Send the image to the separate AI service and return its prediction, or raise an HTTPException that states the real cause."""
    if not settings.AI_SERVICE_URL or not settings.AI_SERVICE_TOKEN:
        logger.error("AI_SERVICE_URL or AI_SERVICE_TOKEN is missing in configuration.")
        raise HTTPException(status_code=503, detail="AI service is not configured on the server.")

    base = settings.AI_SERVICE_URL.rstrip("/")
    headers = {"Authorization": f"Bearer {settings.AI_SERVICE_TOKEN}"}

    async with httpx.AsyncClient(timeout=_timeouts()) as client:
        for attempt in (1, 2):                       # at most ONE retry, and only when the service was asleep/unreachable
            try:
                response = await client.post(f"{base}/predict", headers=headers, files={"file": (filename, image_bytes, content_type)})
            except httpx.ReadTimeout:
                logger.error("AI service read timeout after %ss", settings.AI_READ_TIMEOUT)
                raise HTTPException(status_code=504, detail="The AI service took too long to respond. Please try again.")
            except httpx.HTTPError as exc:           # connection refused / reset / connect timeout: asleep, restarting or crashed
                logger.warning("AI service unreachable on attempt %d: %s", attempt, type(exc).__name__)
                if attempt == 1 and await _wait_until_awake(client, base):
                    continue
                raise HTTPException(status_code=503, detail="The AI service is not reachable. It may be starting up. Please try again in a minute.")

            if response.status_code == 200:
                try:
                    result = response.json()
                except ValueError as exc:
                    raise HTTPException(status_code=502, detail="The AI service returned an invalid response.") from exc
                if not isinstance(result, dict):
                    raise HTTPException(status_code=502, detail="The AI service returned an invalid response.")
                return result

            detail = _app_detail(response)
            logger.error("AI service returned HTTP %s: %s", response.status_code, (response.text or "")[:300])

            if detail is not None:
                # The AI service answered with its own, definite error (bad image, model file invalid, ...). Retrying cannot help:
                # pass the ORIGINAL cause through instead of hiding it.
                code = response.status_code if response.status_code in (400, 401, 403, 404, 413, 415, 422, 429, 503) else (
                    response.status_code if response.status_code < 500 else 502)
                raise HTTPException(status_code=code, detail=detail)

            # No JSON message: this is the hosting proxy's error page (service asleep, restarting or killed).
            if attempt == 1 and response.status_code in _PROXY_STATUSES and await _wait_until_awake(client, base):
                continue
            raise HTTPException(status_code=503, detail="The AI service is starting up or temporarily unavailable. Please try again in a minute.")

    raise HTTPException(status_code=503, detail="The AI service is temporarily unavailable.")   # pragma: no cover