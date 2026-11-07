from supabase import create_client, Client
from app.core.config import settings

# Use service role key for backend operations to bypass RLS where necessary
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)