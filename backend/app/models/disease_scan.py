from pydantic import BaseModel
from typing import Optional

class DiseaseScan(BaseModel):
    id: Optional[str] = None
    user_id: str
    detected_disease: str
    confidence: float
    image_url: Optional[str] = None