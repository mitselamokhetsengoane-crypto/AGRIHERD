from fastapi import HTTPException, Depends, Header
from app.core.security import verify_token
from app.database.connection import supabase


def _is_revoked(jti: str) -> bool:
    try:
        resp = (
            supabase.table("revoked_tokens")
            .select("id")
            .eq("jti", jti)
            .limit(1)
            .execute()
        )
        return bool(resp.data)
    except Exception:
        # If the revocation table itself is unreachable, fail closed.
        raise HTTPException(status_code=503, detail="Could not verify token state.")


def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    token = authorization.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    jti = payload.get("jti")
    if jti and _is_revoked(jti):
        raise HTTPException(status_code=401, detail="Token has been revoked.")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    try:
        profile = (
            supabase.table("profiles")
            .select("role, account_status")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Could not verify account status: {exc}")

    if not profile.data:
        raise HTTPException(status_code=401, detail="Account not found.")

    row = profile.data[0]
    status = (row.get("account_status") or "ACTIVE").upper()
    if status == "SUSPENDED":
        raise HTTPException(status_code=403, detail="This account is suspended.")
    if status == "DEACTIVATED":
        raise HTTPException(status_code=403, detail="This account is deactivated.")
    if status == "PENDING":
        raise HTTPException(status_code=403, detail="This account is pending approval.")

    payload["role"] = row.get("role", payload.get("role", "farmer"))
    return payload


def require_role(required_role: str):
    """Requires the given role. Admins bypass non-admin checks."""
    def role_checker(current_user: dict = Depends(get_current_user)):
        role = current_user.get("role")
        if role == required_role:
            return current_user
        if role == "admin" and required_role != "admin":
            return current_user
        raise HTTPException(status_code=403, detail="Not authorized for this action")
    return role_checker