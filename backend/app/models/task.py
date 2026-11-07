from pydantic import BaseModel
from typing import Optional

class Task(BaseModel):
    id: Optional[str] = None
    farm_id: str
    name: str
    date: str
    time: str
    status: str = "Pending"