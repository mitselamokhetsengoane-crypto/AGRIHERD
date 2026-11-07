import logging

from fastapi import APIRouter, HTTPException
from fastapi import Depends
from pydantic import BaseModel
from typing import Optional
from supabase_auth.errors import (
    AuthApiError,
    AuthInvalidCredentialsError,
    AuthRetryableError,
)
from supabase import create_client

from app.core.config import settings
from app.core.permissions import get_current_user
from app.core.security import create_access_token
from app.database.connection import supabase
from app.schemas.user_schema import UserLogin, UserRegister

router = APIRouter()
logger = logging.getLogger(__name__)

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    farm_name: Optional[str] = None
    location: Optional[str] = None


@router.post("/register")
def register(user: UserRegister):
    try:
        # 1. Create user in Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password,
        })
        user_id = auth_response.user.id

        # 2. Use Admin Client (Service Role) to bypass RLS for profile creation
        admin_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        
        # 3. Insert into profiles table
        admin_client.table("profiles").insert({
            "id": user_id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "farm_name": user.farm_name,
            "role": "farmer"
        }).execute()

        return {"message": "User registered successfully", "user_id": user_id}
    except Exception as e:
        logger.error(f"🔴 REGISTRATION ERROR: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
def login(user: UserLogin):
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })
    except (AuthApiError, AuthInvalidCredentialsError) as exc:
        if isinstance(exc, AuthInvalidCredentialsError) or exc.status in (400, 401):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password.",
            ) from exc
        if exc.status == 429:
            raise HTTPException(
                status_code=429,
                detail="Too many login attempts. Please try again later.",
            ) from exc
        if exc.status == 403:
            raise HTTPException(
                status_code=403,
                detail="Confirm your email before logging in.",
            ) from exc
        logger.error("Supabase rejected the login request with status %s", exc.status)
        raise HTTPException(
            status_code=503,
            detail="Authentication service is unavailable.",
        ) from exc
    except AuthRetryableError as exc:
        logger.warning("Supabase authentication is temporarily unavailable")
        raise HTTPException(
            status_code=503,
            detail="Authentication service is unavailable.",
        ) from exc

    if auth_response.user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    profile_response = (
        supabase.table("profiles")
        .select("*")
        .eq("id", auth_response.user.id)
        .execute()
    )
    if not profile_response.data:
        logger.error("Authenticated user has no profile record")
        raise HTTPException(
            status_code=403,
            detail="Your account profile is missing. Please contact support.",
        )

    profile = profile_response.data[0]
    token = create_access_token({
        "sub": auth_response.user.id,
        "role": profile["role"],
    })
    return {"access_token": token, "token_type": "bearer", "user": profile}


@router.get("/me")
def get_profile(current_user: dict = Depends(get_current_user)):
    try:
        profile = supabase.table("profiles").select("*").eq("id", current_user["sub"]).execute()
        return profile.data[0]
    except Exception as e:
        raise HTTPException(status_code=404, detail="Profile not found")


@router.patch("/me")
def update_profile(
    profile_update: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    updates = profile_update.dict(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No profile changes provided")
    if "full_name" in updates and not updates["full_name"].strip():
        raise HTTPException(status_code=422, detail="Full name cannot be empty")
    if "full_name" in updates:
        updates["full_name"] = updates["full_name"].strip()

    response = (
        supabase.table("profiles")
        .update(updates)
        .eq("id", current_user["sub"])
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return response.data[0]