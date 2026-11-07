from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: str
    farm_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str