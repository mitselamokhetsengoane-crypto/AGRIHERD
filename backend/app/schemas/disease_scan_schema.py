from pydantic import BaseModel

class ScanResult(BaseModel):
    detected_disease: str
    confidence: float