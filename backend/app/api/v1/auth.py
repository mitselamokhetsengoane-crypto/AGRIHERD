import hashlib
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from supabase import create_client
from supabase_auth.errors import (
    AuthApiError,
    AuthInvalidCredentialsError,
    AuthRetryableError,
)

from app.core.config import settings
from app.core.permissions import get_current_user
from app.core.security import create_access_token
from app.database.connection import supabase
from app.schemas.user_schema import PasswordChange, UserLogin, UserRegister

router = APIRouter()
logger = logging.getLogger(__name__)

VALID_ROLES = {"farmer", "buyer"}
CURRENT_PRIVACY_VERSION = "1.0"
CURRENT_TERMS_VERSION = "1.0"
RESET_TTL_MINUTES = 15


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    farm_name: Optional[str] = None
    location: Optional[str] = None


class ForgotBody(BaseModel):
    email: EmailStr


class ResetBody(BaseModel):
    token: str
    new_password: str


def _admin_client():
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


@router.post("/register")
def register(user: UserRegister):
    role = (user.role or "farmer").strip().lower()
    if role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Role must be 'farmer' or 'buyer'.")

    if not user.consent_given:
        raise HTTPException(
            status_code=400,
            detail="You must accept the Privacy Policy and Terms to register.",
        )

    if not user.full_name or not user.full_name.strip():
        raise HTTPException(status_code=422, detail="Full name is required.")

    if role == "farmer":
        if not user.farm_name or not user.farm_name.strip():
            raise HTTPException(status_code=400, detail="Farm name is required for farmers.")
        if not user.location or not user.location.strip():
            raise HTTPException(status_code=400, detail="Farm location is required for farmers.")

    try:
        auth_response = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password,
            "options": {
                "data": {
                    "full_name": user.full_name.strip(),
                    "phone": (user.phone or "").strip() or None,
                    "farm_name": (user.farm_name or "").strip() or None if role == "farmer" else None,
                    "location": (user.location or "").strip() or None if role == "farmer" else None,
                    "role": role,
                    "consent_given": user.consent_given,
                    "privacy_policy_version": user.consent_version or CURRENT_PRIVACY_VERSION,
                    "terms_version": CURRENT_TERMS_VERSION,
                },
            },
        })
    except Exception as exc:
        msg = str(exc).lower()
        if "already registered" in msg or "already exists" in msg or "user already" in msg:
            raise HTTPException(status_code=400, detail="An account with this email already exists.")
        if "password" in msg:
            raise HTTPException(status_code=400, detail=f"Password rejected: {exc}")
        logger.error(f"Supabase sign_up failed: {exc}")
        raise HTTPException(status_code=400, detail=f"Registration failed: {exc}")

    if auth_response is None or auth_response.user is None:
        raise HTTPException(status_code=400, detail="Registration failed: auth response was empty.")

    user_id = auth_response.user.id
    try:
        profile_response = (
            supabase.table("profiles")
            .select("account_status")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
    except Exception as exc:
        logger.exception("Could not confirm the profile/farm registration transaction.")
        try:
            _admin_client().auth.admin.delete_user(user_id)
        except Exception as cleanup_exc:
            logger.error(f"Could not delete orphan auth user {user_id}: {cleanup_exc}")
        raise HTTPException(
            status_code=503,
            detail="Could not confirm the registration record. Verify migration "
            "014_admin_farm_monitoring.sql and retry.",
        ) from exc

    if not profile_response.data:
        logger.error(
            "Supabase Auth created user %s without its trigger-created profile/farm.",
            user_id,
        )
        try:
            _admin_client().auth.admin.delete_user(user_id)
        except Exception as cleanup_exc:
            logger.error("Could not clean up unprofiled auth user %s: %s", user_id, cleanup_exc)
        raise HTTPException(
            status_code=503,
            detail="The profile/farm registration trigger is missing. Apply "
            "database/migrations/014_admin_farm_monitoring.sql.",
        )

    initial_status = (profile_response.data[0].get("account_status") or "").upper()
    if initial_status not in {"ACTIVE", "PENDING"}:
        logger.error("Profile trigger returned an invalid account status for user %s.", user_id)
        try:
            _admin_client().auth.admin.delete_user(user_id)
        except Exception as cleanup_exc:
            logger.error("Could not clean up invalid registration %s: %s", user_id, cleanup_exc)
        raise HTTPException(status_code=503, detail="The registration trigger returned an invalid account status.")

    message = "User registered successfully"
    if initial_status == "PENDING":
        message = "Registration received. An administrator will review your farmer account."

    return {"message": message, "user_id": user_id, "role": role, "account_status": initial_status}


@router.post("/login")
def login(user: UserLogin):
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password,
        })
    except (AuthApiError, AuthInvalidCredentialsError) as exc:
        if isinstance(exc, AuthInvalidCredentialsError) or exc.status in (400, 401):
            raise HTTPException(status_code=401, detail="Invalid email or password.") from exc
        if exc.status == 429:
            raise HTTPException(status_code=429, detail="Too many login attempts.") from exc
        if exc.status == 403:
            raise HTTPException(status_code=403, detail="Confirm your email before logging in.") from exc
        raise HTTPException(status_code=503, detail="Authentication service unavailable.") from exc
    except AuthRetryableError as exc:
        raise HTTPException(status_code=503, detail="Authentication service unavailable.") from exc

    if auth_response.user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    profile_response = (
        supabase.table("profiles").select("*").eq("id", auth_response.user.id).execute()
    )
    if not profile_response.data:
        raise HTTPException(
            status_code=403,
            detail="Your account profile is missing. Contact support; the account was not auto-activated.",
        )

    profile = profile_response.data[0]
    status = (profile.get("account_status") or "").upper()
    if not status:
        raise HTTPException(status_code=403, detail="Your account status is not configured. Contact support.")

    if status == "PENDING":
        raise HTTPException(status_code=403, detail="Your account is pending administrator approval. You will be able to log in once approved.")
    if status == "SUSPENDED":
        raise HTTPException(status_code=403, detail="Your account has been suspended. Please contact support.")
    if status == "DEACTIVATED":
        raise HTTPException(status_code=403, detail="Your account has been deactivated. Please contact support.")
    if status != "ACTIVE":
        raise HTTPException(status_code=403, detail="Your account status does not permit access.")

    token = create_access_token({
        "sub": auth_response.user.id,
        "role": profile.get("role", "farmer"),
    })
    return {"access_token": token, "token_type": "bearer", "user": profile}


@router.get("/me")
def get_profile(current_user: dict = Depends(get_current_user)):
    try:
        profile = supabase.table("profiles").select("*").eq("id", current_user["sub"]).execute()
        if not profile.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        return profile.data[0]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Profile not found")


@router.patch("/me")
def update_profile(profile_update: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    updates = profile_update.dict(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No profile changes provided")
    if "full_name" in updates and not updates["full_name"].strip():
        raise HTTPException(status_code=422, detail="Full name cannot be empty")
    if "full_name" in updates:
        updates["full_name"] = updates["full_name"].strip()

    response = supabase.table("profiles").update(updates).eq("id", current_user["sub"]).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return response.data[0]


@router.post("/change-password")
def change_password(body: PasswordChange, current_user: dict = Depends(get_current_user)):
    if not body.current_password or not body.new_password:
        raise HTTPException(status_code=400, detail="Current and new password are required.")

    pw = body.new_password
    if len(pw) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters.")
    if not any(c.isupper() for c in pw):
        raise HTTPException(status_code=400, detail="New password must contain an uppercase letter.")
    if not any(c.islower() for c in pw):
        raise HTTPException(status_code=400, detail="New password must contain a lowercase letter.")
    if not any(c.isdigit() for c in pw):
        raise HTTPException(status_code=400, detail="New password must contain a number.")
    if not any(not c.isalnum() for c in pw):
        raise HTTPException(status_code=400, detail="New password must contain a special character.")

    user_id = current_user["sub"]
    try:
        profile = supabase.table("profiles").select("email").eq("id", user_id).limit(1).execute()
        if not profile.data:
            raise HTTPException(status_code=404, detail="Profile not found.")
        email = profile.data[0]["email"]
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Could not fetch profile for password change: {exc}")
        raise HTTPException(status_code=503, detail="Could not verify your account.")

    try:
        supabase.auth.sign_in_with_password({"email": email, "password": body.current_password})
    except (AuthApiError, AuthInvalidCredentialsError):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    except Exception as exc:
        logger.error(f"Password verification failed: {exc}")
        raise HTTPException(status_code=503, detail="Could not verify your current password.")

    try:
        _admin_client().auth.admin.update_user_by_id(user_id, {"password": body.new_password})
    except Exception as exc:
        logger.error(f"Password update failed: {exc}")
        raise HTTPException(status_code=500, detail=f"Could not update password: {exc}")

    return {"message": "Password updated successfully."}


# ---------- NEW ENDPOINTS ----------

@router.post("/forgot-password")
def forgot_password(body: ForgotBody):
    generic = {"message": "If an account exists, reset instructions have been sent."}

    try:
        prof = supabase.table("profiles").select("id,email").eq("email", str(body.email)).limit(1).execute()
    except Exception:
        return generic
    if not prof.data:
        return generic

    user_id = prof.data[0]["id"]
    raw = secrets.token_urlsafe(32)
    hashed = _hash_token(raw)
    expires = (datetime.now(timezone.utc) + timedelta(minutes=RESET_TTL_MINUTES)).isoformat()

    try:
        supabase.table("password_reset_tokens").insert({
            "user_id": user_id,
            "token_hash": hashed,
            "expires_at": expires,
        }).execute()
    except Exception as exc:
        logger.error(f"Reset insert failed: {exc}")
        return generic

    logger.warning(
        "Password reset requested for %s but no email provider is configured. "
        "Configure SMTP env vars to actually deliver this link.", body.email,
    )
    if os.getenv("EXPOSE_RESET_TOKEN") == "true":
        generic["reset_token_debug"] = raw
    return generic


@router.post("/reset-password")
def reset_password(body: ResetBody):
    if len(body.new_password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters.")

    hashed = _hash_token(body.token)
    now = datetime.now(timezone.utc).isoformat()

    rec = (
        supabase.table("password_reset_tokens")
        .select("*")
        .eq("token_hash", hashed)
        .is_("used_at", "null")
        .gte("expires_at", now)
        .limit(1)
        .execute()
    )
    if not rec.data:
        raise HTTPException(400, "Invalid or expired reset token.")

    token_row = rec.data[0]
    try:
        _admin_client().auth.admin.update_user_by_id(
            token_row["user_id"], {"password": body.new_password}
        )
    except Exception as exc:
        logger.error(f"Password update failed: {exc}")
        raise HTTPException(500, "Could not update password.")

    supabase.table("password_reset_tokens").update({"used_at": now}).eq("id", token_row["id"]).execute()
    return {"message": "Password updated."}


@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    jti = current_user.get("jti")
    exp = current_user.get("exp")
    if not jti:
        raise HTTPException(400, "Token has no jti; cannot revoke.")

    expires_iso = (
        datetime.fromtimestamp(exp, tz=timezone.utc).isoformat() if exp else None
    )
    try:
        supabase.table("revoked_tokens").insert({
            "jti": jti,
            "user_id": current_user["sub"],
            "expires_at": expires_iso,
        }).execute()
    except Exception as exc:
        logger.error(f"Revoke failed: {exc}")
        raise HTTPException(500, "Could not revoke token.")
    return {"message": "Logged out."}