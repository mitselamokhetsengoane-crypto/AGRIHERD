from pydantic import BaseModel, EmailStr
from typing import Optional


class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    farm_name: Optional[str] = None
    location: Optional[str] = None
    role: str = "farmer"  # "farmer" or "buyer"


class UserLogin(BaseModel):
    email: EmailStr
    password: str