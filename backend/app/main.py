from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, livestock, crops, tasks, inventory, finance, marketplace, disease_scanner, security, notifications, blockchain

app = FastAPI(title="AgriHerd API", version="1.0.0")

# CORS configuration to allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"], # React dev ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(livestock.router, prefix="/api/v1/livestock", tags=["Livestock"])
app.include_router(crops.router, prefix="/api/v1/crops", tags=["Crops"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["Tasks"])
app.include_router(inventory.router, prefix="/api/v1/inventory", tags=["Inventory"])
app.include_router(finance.router, prefix="/api/v1/finance", tags=["Finance"])
app.include_router(marketplace.router, prefix="/api/v1/marketplace", tags=["Marketplace"])
app.include_router(disease_scanner.router, prefix="/api/v1/disease-scanner", tags=["Disease Scanner"])
app.include_router(security.router, prefix="/api/v1/security", tags=["Security"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notifications"])
app.include_router(blockchain.router, prefix="/api/v1/blockchain", tags=["Blockchain"])

@app.get("/")
def root():
    return {"message": "AgriHerd API is running"}