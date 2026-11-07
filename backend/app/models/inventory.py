from pydantic import BaseModel
from typing import Optional

class InventoryItem(BaseModel):
    id: Optional[str] = None
    farm_id: str
    name: str
    category: str
    quantity: float
    unit: str
    stock_status: str = "In Stock"