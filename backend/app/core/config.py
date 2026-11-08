import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    SUPABASE_URL: str = os.getenv("SUPABASE_URL")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    JWT_SECRET: str = os.getenv("JWT_SECRET")
    
    # NEW: AI Service Configuration
    AI_SERVICE_URL: str = os.getenv("AI_SERVICE_URL", "http://127.0.0.1:8001")
    AI_SERVICE_TOKEN: str = os.getenv("AI_SERVICE_TOKEN", "my-test-secret")

settings = Settings()