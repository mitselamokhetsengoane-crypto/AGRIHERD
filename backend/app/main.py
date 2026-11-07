from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, livestock, crops, tasks, inventory, finance, marketplace, disease_scanner, security, notifications, blockchain, dashboard

api = FastAPI(title="AgriHerd API", version="1.0.0")

# Include Routers
api.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
api.include_router(livestock.router, prefix="/api/v1/livestock", tags=["Livestock"])
api.include_router(crops.router, prefix="/api/v1/crops", tags=["Crops"])
api.include_router(tasks.router, prefix="/api/v1/tasks", tags=["Tasks"])
api.include_router(inventory.router, prefix="/api/v1/inventory", tags=["Inventory"])
api.include_router(finance.router, prefix="/api/v1/finance", tags=["Finance"])
api.include_router(marketplace.router, prefix="/api/v1/marketplace", tags=["Marketplace"])
api.include_router(disease_scanner.router, prefix="/api/v1/disease-scanner", tags=["Disease Scanner"])
api.include_router(security.router, prefix="/api/v1/security", tags=["Security"])
api.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notifications"])
api.include_router(blockchain.router, prefix="/api/v1/blockchain", tags=["Blockchain"])
api.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])

@api.get("/")
def root():
    return {"message": "AgriHerd API is running"}

# Wrap the complete FastAPI application so CORS headers are also added to
# responses generated for unhandled server errors.
app = CORSMiddleware(
    app=api,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://agriherd-1.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600,
)