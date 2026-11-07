from pydantic import BaseModel
from typing import Optional

class Transaction(BaseModel):
    id: Optional[str] = None
    farm_id: str
    type: str # 'income' or 'expense'
    amount: float
    description: str
    date: str