import base64
import json
import logging

from supabase import Client, create_client

from app.core.config import settings

logger = logging.getLogger(__name__)


def key_role(key: str) -> str:
    """Role claim of a Supabase key ('anon' or 'service_role'). Reading the payload needs no secret and the key is never logged."""
    if not key:
        return "missing"
    if key.startswith("sb_secret_"):
        return "service_role"
    if key.startswith("sb_publishable_"):
        return "anon"
    try:
        payload = key.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        return str(json.loads(base64.urlsafe_b64decode(payload)).get("role", "unknown"))
    except Exception:
        return "unreadable"


def _validate_configuration() -> str:
    missing = [name for name, value in (("SUPABASE_URL", settings.SUPABASE_URL),
                                        ("SUPABASE_SERVICE_ROLE_KEY", settings.SUPABASE_SERVICE_ROLE_KEY)) if not value]
    if missing:
        raise RuntimeError("Missing required environment variable(s): " + ", ".join(missing) + ". Set them in the Render dashboard.")
    role = key_role(settings.SUPABASE_SERVICE_ROLE_KEY)
    if role == "service_role":
        logger.info("Supabase client ready (server key role: service_role).")
    else:
        logger.error(
            "SUPABASE_SERVICE_ROLE_KEY contains a key with role '%s', NOT a service_role key. Writes and Storage uploads that are "
            "protected by Row Level Security will be REFUSED. Copy the 'service_role' (secret) key from Supabase > Project Settings > API.",
            role)
    return role


SERVICE_KEY_ROLE = _validate_configuration()

# Server-side client using the service-role key. It bypasses Row Level Security, so the API must always filter by the
# authenticated user's id itself (it does). This key must never reach the React frontend.
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)