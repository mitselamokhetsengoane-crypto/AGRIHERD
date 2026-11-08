import logging
import httpx
from fastapi import HTTPException
from app.core.config import settings

logger = logging.getLogger(__name__)

async def predict_disease_remote(image_bytes: bytes, filename: str, content_type: str) -> dict:
    """
    Sends the image to the separate AI service via HTTP.
    """
    if not settings.AI_SERVICE_URL or not settings.AI_SERVICE_TOKEN:
        logger.error("AI_SERVICE_URL or AI_SERVICE_TOKEN is missing in configuration.")
        raise HTTPException(status_code=503, detail="AI service is not configured on the server.")

    url = f"{settings.AI_SERVICE_URL.rstrip('/')}/predict"
    headers = {"Authorization": f"Bearer {settings.AI_SERVICE_TOKEN}"}
    files = {"file": (filename, image_bytes, content_type)}

    try:
        # We use a long timeout (e.g., 60s) because Cloud Run may need to cold-start
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, headers=headers, files=files)
            
            # Raise an exception for 4xx or 5xx responses
            response.raise_for_status()
            return response.json()

    except httpx.TimeoutException:
        logger.error("AI service request timed out.")
        raise HTTPException(status_code=504, detail="The AI service took too long to respond.")
    except httpx.HTTPStatusError as exc:
        logger.error(f"AI service returned an error: {exc.response.text}")
        # Pass through the AI service's error message if it's clean
        try:
            detail = exc.response.json().get("detail", "AI prediction failed.")
        except Exception:
            detail = "AI prediction failed."
        raise HTTPException(status_code=exc.response.status_code, detail=detail)
    except httpx.RequestError as exc:
        logger.error(f"Could not connect to AI service: {str(exc)}")
        raise HTTPException(status_code=503, detail="Could not reach the AI service. It may be asleep or unavailable.")