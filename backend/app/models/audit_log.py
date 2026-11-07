from pydantic import BaseModel
from typing import Optional

class AuditLog(BaseModel):
    id: Optional[str] = None
    user_id: str
    action: str
    details: str