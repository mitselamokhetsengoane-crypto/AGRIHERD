from pydantic import BaseModel
from typing import Optional

class Crop(BaseModel):
    id: Optional[str] = None
    farm_id: str
    name: str
    type: str
    field_name: str
    field_size: str
    status: str = "Planted"