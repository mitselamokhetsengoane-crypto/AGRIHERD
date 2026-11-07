from pydantic import BaseModel
from typing import Optional

class Animal(BaseModel):
    id: Optional[str] = None
    farm_id: str
    name: str
    animal_id: str
    type: str
    breed: Optional[str] = None
    age: Optional[int] = None
    health_status: str = "Healthy"