from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    id: Optional[str] = None
    full_name: str
    email: str
    phone: Optional[str] = None
    farm_name: Optional[str] = None
    role: str = "farmer"