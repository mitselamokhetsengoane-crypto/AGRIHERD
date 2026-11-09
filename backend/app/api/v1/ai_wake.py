from fastapi import APIRouter, Depends
from app.core.permissions import get_current_user
from app.services.ai_client import wake_ai_service

router = APIRouter()

@router.get("/wake")
async def wake_ai(current_user: dict = Depends(get_current_user)):
    return await wake_ai_service()