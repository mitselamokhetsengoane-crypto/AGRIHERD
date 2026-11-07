# Since we are using Supabase client directly, we don't need SQLAlchemy Base.
# However, we can use this file to define base Pydantic schemas if needed.
from pydantic import BaseModel

class BaseResponse(BaseModel):
    success: bool
    message: str