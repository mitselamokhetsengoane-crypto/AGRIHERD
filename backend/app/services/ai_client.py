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
        # INCREASED TIMEOUT TO 120 SECONDS to allow Render to wake up
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, headers=headers, files=files)
            
            response.raise_for_status()
            try:
                result = response.json()
            except ValueError as exc:
                raise HTTPException(status_code=502, detail="The AI service returned an invalid response.") from exc
            if not isinstance(result, dict):
                raise HTTPException(status_code=502, detail="The AI service returned an invalid response.")
            return result

    except httpx.TimeoutException:
        logger.error("AI service request timed out after 120 seconds.")
        raise HTTPException(status_code=504, detail="The AI service took too long to wake up and respond. Please try again.")
    
    except httpx.HTTPStatusError as exc:
        logger.error(f"AI service returned error code {exc.response.status_code}: {exc.response.text}")
        # Try to extract the actual error from the AI service
        try:
            detail = exc.response.json().get("detail", "AI prediction failed.")
        except Exception:
            detail = f"AI service error (HTTP {exc.response.status_code})"
        raise HTTPException(status_code=exc.response.status_code, detail=detail)
    
    except httpx.RequestError as exc:
        logger.error(f"Could not connect to AI service: {str(exc)}")
        raise HTTPException(status_code=503, detail="Could not reach the AI service. It may be asleep or unavailable.")