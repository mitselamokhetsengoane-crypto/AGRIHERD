from pydantic import BaseModel
from typing import Optional

class Farm(BaseModel):
    id: Optional[str] = None
    owner_id: str
    farm_name: str
    location: str
    size_hectares: Optional[float] = None