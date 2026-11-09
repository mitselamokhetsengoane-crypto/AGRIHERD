import uuid
import logging
from app.database.connection import supabase

logger = logging.getLogger(__name__)

BUCKET_NAME = "disease-scans"

def upload_scan_image(image_bytes: bytes, user_id: str) -> str:
    """
    Uploads an image to Supabase Storage and returns the public URL.
    """
    file_name = f"{user_id}/{uuid.uuid4()}.jpg"
    
    try:
        # Upload to Supabase storage
        supabase.storage.from_(BUCKET_NAME).upload(
            path=file_name,
            file=image_bytes,
            file_options={"content-type": "image/jpeg"}
        )
        
        # Get the public URL
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_name)
        return public_url
        
    except Exception as e:
        logger.error(f"Failed to upload image to storage: {str(e)}")
        raise RuntimeError("Could not upload image to storage.") from e