import os

from dotenv import load_dotenv

load_dotenv()


def _env(name: str, default: str = "") -> str:
    """Read an environment variable and strip whitespace/quotes. A trailing space or newline pasted into the Render dashboard
    is a classic cause of 'Invalid API key' / 'Illegal header value' errors."""
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().strip('"').strip("'")


def _bool(name: str, default: bool = False) -> bool:
    return _env(name, "true" if default else "false").lower() in {"1", "true", "yes", "on"}


def _float(name: str, default: float) -> float:
    try:
        return float(_env(name, str(default)))
    except ValueError:
        return default


class Settings:
    # ---- Supabase (server-side only) -------------------------------------------------------------------------------
    SUPABASE_URL: str = _env("SUPABASE_URL").rstrip("/")
    SUPABASE_KEY: str = _env("SUPABASE_KEY")
    SUPABASE_SERVICE_ROLE_KEY: str = _env("SUPABASE_SERVICE_ROLE_KEY")
    JWT_SECRET: str = _env("JWT_SECRET")

    # ---- AI service ------------------------------------------------------------------------------------------------
    # No guessable production defaults: a missing value must be visible. For local development set
    # AI_SERVICE_URL=http://127.0.0.1:8001 and AI_SERVICE_TOKEN in your .env.
    AI_SERVICE_URL: str = _env("AI_SERVICE_URL")
    AI_SERVICE_TOKEN: str = _env("AI_SERVICE_TOKEN")
    AI_CONNECT_TIMEOUT: float = _float("AI_CONNECT_TIMEOUT", 10.0)
    AI_READ_TIMEOUT: float = _float("AI_READ_TIMEOUT", 45.0)     # first request may include loading the model
    AI_WAKE_SECONDS: float = _float("AI_WAKE_SECONDS", 35.0)     # how long to wait for a sleeping AI service

    # ---- Scan image storage ----------------------------------------------------------------------------------------
    SUPABASE_SCAN_BUCKET: str = _env("SUPABASE_SCAN_BUCKET", "disease-scans")
    PRODUCT_IMAGE_BUCKET: str = _env("PRODUCT_IMAGE_BUCKET", "marketplace-products")
    # true  = bucket is PUBLIC: the public URL is stored in disease_scans.image_url (anyone with the unguessable link can view)
    # false = bucket is PRIVATE: the object path is stored and short-lived signed links are generated on every read
    SCAN_BUCKET_PUBLIC: bool = _bool("SCAN_BUCKET_PUBLIC", True)
    SIGNED_URL_SECONDS: int = int(_float("SIGNED_URL_SECONDS", 3600))
    # false = if the photo cannot be stored, still save the diagnosis and warn the farmer. true = fail the whole scan.
    SCAN_REQUIRE_IMAGE: bool = _bool("SCAN_REQUIRE_IMAGE", False)
    # Turn on temporarily (ENABLE_DIAGNOSTICS=true) to use GET /disease-scanner/storage-check, then turn it off again.
    ENABLE_DIAGNOSTICS: bool = _bool("ENABLE_DIAGNOSTICS", False)


settings = Settings()