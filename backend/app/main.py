import importlib
import logging
import os
from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("agriherd")

api = FastAPI(title="AgriHerd API", version="1.0.0")

# ---------- Middlewares ----------
_default_origins = "https://agriherd-1.onrender.com,http://localhost:5173,http://localhost:3000"
ORIGINS = [
    o.strip().rstrip("/")
    for o in os.getenv("CORS_ORIGINS", _default_origins).split(",")
    if o.strip()
]

api.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=600,
)

api.add_middleware(GZipMiddleware, minimum_size=1000)

def mount(module: str, prefix: str, tag: str, optional: bool = False) -> None:
    try:
        router = importlib.import_module(f"app.api.v1.{module}").router
        api.include_router(router, prefix=prefix, tags=[tag])
    except Exception as exc:
        if not optional:
            raise
        logger.exception("Optional module '%s' failed to load: %s", module, exc)
        stub = APIRouter()

        @stub.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
        def unavailable(path: str):
            raise HTTPException(503, f"The {tag} service is temporarily unavailable.")

        api.include_router(stub, prefix=prefix, tags=[tag])

# ---- required ----
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

# ---- optional ----
mount("disease_scanner", "/api/v1/disease-scanner", "Disease Scanner", optional=True)
mount("ai_wake", "/api/v1/ai", "AI Wake", optional=True) # <-- NEW ROUTE ADDED
mount("blockchain", "/api/v1/blockchain", "Blockchain", optional=True)

@api.get("/")
def root():
    return {"message": "AgriHerd API is running"}

@api.get("/health")
def health():
    return {"status": "ok"}

app = api