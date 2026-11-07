from pydantic import BaseModel
from typing import Optional

class Product(BaseModel):
    id: Optional[str] = None
    seller_id: str
    name: str
    price: float
    category: str
    description: str