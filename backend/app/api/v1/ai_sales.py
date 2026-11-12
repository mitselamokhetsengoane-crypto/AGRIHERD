from fastapi import APIRouter, Depends, HTTPException
from app.core.permissions import get_current_user
from app.core.config import settings
import httpx
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class SalesPredictionRequest(BaseModel := __import__('pydantic').BaseModel):
    month: int
    category: str
    product: str
    price: float

@router.post("/predict-sales")
async def get_sales_prediction(
    request: SalesPredictionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Fetches a sales prediction from the AI service."""
    if current_user.get("role") not in ("farmer", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized.")

    ai_url = f"{settings.AI_SERVICE_URL.rstrip('/')}/predict-sales"
    headers = {"Authorization": f"Bearer {settings.AI_SERVICE_TOKEN}"}

    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(ai_url, json=request.dict(), headers=headers, timeout=15.0)
            res.raise_for_status()
            return res.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"AI Sales Prediction failed (AI Service returned error): {e.response.text}")
        raise HTTPException(status_code=502, detail="The AI model returned an error.")
    except Exception as e:
        logger.error(f"AI Sales Prediction failed (Connection error): {e}")
        raise HTTPException(status_code=503, detail="AI prediction service is currently unavailable.")



@router.get("/models")
async def get_active_model_metrics(current_user: dict = Depends(get_current_user)):
    """Fetches the active AI model metrics from the database."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admins only.")
    
    try:
        response = (
            supabase.table("ai_models")
            .select("*")
            .eq("is_active", True)
            .order("training_date", desc=True)
            .limit(1)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="No active AI model found in database.")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch AI model metrics: {e}")
        raise HTTPException(status_code=503, detail="Could not load AI metrics.")