import logging
import httpx
from fastapi import HTTPException
from app.core.config import settings

logger = logging.getLogger(__name__)

async def wake_ai_service() -> dict:
    """
    Pings the AI service to wake it up from Render's sleep mode.
    Holds the connection open for up to 120 seconds.
    """
    if not settings.AI_SERVICE_URL:
        return {"status": "error", "message": "AI service URL not configured"}

    url = f"{settings.AI_SERVICE_URL.rstrip('/')}/health"
    try:
        logger.info(f"Waking up AI service at {url}...")
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            logger.info("AI service is awake.")
            return {"status": "awake", "service_response": response.json()}
    except Exception as e:
        logger.error(f"Failed to wake AI service: {str(e)}")
        return {"status": "error", "message": str(e)}


async def predict_disease_remote(image_bytes: bytes, filename: str, content_type: str) -> dict:
    if not settings.AI_SERVICE_URL or not settings.AI_SERVICE_TOKEN:
        logger.error("AI_SERVICE_URL or AI_SERVICE_TOKEN is missing in configuration.")
        raise HTTPException(status_code=503, detail="AI service is not configured on the server.")

    url = f"{settings.AI_SERVICE_URL.rstrip('/')}/predict"
    headers = {"Authorization": f"Bearer {settings.AI_SERVICE_TOKEN}"}
    files = {"file": (filename, image_bytes, content_type)}

    try:
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
        try:
            detail = exc.response.json().get("detail", "AI prediction failed.")
        except Exception:
            detail = f"AI service error (HTTP {exc.response.status_code})"
        raise HTTPException(status_code=exc.response.status_code, detail=detail)
    
    except httpx.RequestError as exc:
        logger.error(f"Could not connect to AI service: {str(exc)}")
        raise HTTPException(status_code=503, detail="Could not reach the AI service. It may be asleep or unavailable.")