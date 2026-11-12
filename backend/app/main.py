import importlib
import logging
import os
from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.core.admin_defaults import ensure_admin_defaults
from app.database.connection import SERVICE_KEY_ROLE, supabase
from app.database.health import check_database_schema, get_database_schema_status

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("agriherd")

api = FastAPI(title="AgriHerd API", version="1.0.0")

# FIX: Allow the exact public and admin frontend URLs
_default_origins = {
    "https://agriherd-1.onrender.com",
    "https://agriherd-admin.onrender.com",
    "http://localhost:5173",
    "http://localhost:3000",
}
_configured_origins = {
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
}
ORIGINS = sorted(_default_origins | _configured_origins)

api.add_middleware(GZipMiddleware, minimum_size=1000)


@api.on_event("startup")
def check_schema_and_seed_defaults() -> None:
    status = check_database_schema(supabase)
    if not status["ready"]:
        logger.error(
            "Database schema check failed; unavailable tables: %s; service key role: %s.",
            ", ".join(status["unavailable_tables"]) or "none",
            SERVICE_KEY_ROLE,
        )
        return
    logger.info("Database schema check passed; service key role: %s.", SERVICE_KEY_ROLE)
    ensure_admin_defaults()


def mount(module: str, prefix: str, tag: str, optional: bool = False) -> None:
    try:
        router = importlib.import_module(f"app.api.v1.{module}").router
        api.include_router(router, prefix=prefix, tags=[tag])
        logger.info(f"Mounted /{prefix} ({tag})")
    except Exception as exc:
        if not optional:
            raise
        logger.exception("Optional module '%s' failed to load: %s", module, exc)

        stub = APIRouter()

        @stub.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
        def unavailable(path: str):
            raise HTTPException(503, f"The {tag} service is temporarily unavailable.")

        api.include_router(stub, prefix=prefix, tags=[tag])


mount("auth", "/api/v1/auth", "Auth")
mount("livestock", "/api/v1/livestock", "Livestock")
mount("crops", "/api/v1/crops", "Crops")
mount("tasks", "/api/v1/tasks", "Tasks")
mount("inventory", "/api/v1/inventory", "Inventory")
mount("finance", "/api/v1/finance", "Finance")
mount("marketplace", "/api/v1/marketplace", "Marketplace")
mount("security", "/api/v1/security", "Security")
mount("notifications", "/api/v1/notifications", "Notifications")
mount("dashboard", "/api/v1/dashboard", "Dashboard")
mount("admin", "/api/v1/admin", "Admin")
mount("farms", "/api/v1/farms", "Farms")

mount("disease_scanner", "/api/v1/disease-scanner", "Disease Scanner", optional=True)
mount("ai_wake", "/api/v1/ai", "AI Wake", optional=True)
mount("blockchain", "/api/v1/blockchain", "Blockchain", optional=True)

mount("ai_sales", "/api/v1/ai-sales", "AI Sales")


@api.get("/")
def root():
    return {"message": "AgriHerd API is running"}


@api.get("/health")
def health():
    return {"status": "ok"}


@api.get("/ready")
def readiness():
    status = get_database_schema_status()
    if not status["ready"]:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "not_ready",
                "service_key_role": status["service_key_role"],
                "unavailable_tables": status["unavailable_tables"],
                "correlation_id": status["correlation_id"],
            },
        )
    return {"status": "ready", **status}


# Wrap the whole ASGI app so CORS headers are also present on unhandled errors.
app = CORSMiddleware(
    app=api,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=600,
)