import os
import uuid
import logging
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

logger = logging.getLogger("evsmith.storage")

ALLOWED_MIME_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/pjpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
    "application/x-pdf": ".pdf",
}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


async def upload_document(file: UploadFile) -> Tuple[str, str]:
    """
    Validates file and uploads to Cloudinary or falls back to local static storage.
    Returns: (secure_url, public_id)
    """
    content_type = (file.content_type or "").lower()
    filename = (file.filename or "").lower()
    _, ext = os.path.splitext(filename)

    is_valid = content_type in ALLOWED_MIME_TYPES or ext in ALLOWED_EXTENSIONS
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{content_type}'. Allowed types: JPEG, PNG, WEBP, PDF."
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum permitted limit of 5MB."
        )

    # Determine resource type: images must be "image", PDFs are "raw"
    is_pdf = ext == ".pdf" or "pdf" in content_type
    cloudinary_resource_type = "raw" if is_pdf else "image"

    # If Cloudinary credentials are provided, upload to Cloudinary
    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
        try:
            import cloudinary
            import cloudinary.uploader

            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True
            )

            upload_kwargs = {
                "folder": settings.CLOUDINARY_FOLDER,
                "resource_type": cloudinary_resource_type,
            }
            if not is_pdf and ext:
                upload_kwargs["format"] = ext.lstrip(".")

            result = cloudinary.uploader.upload(
                file_bytes,
                **upload_kwargs
            )
            secure_url = result["secure_url"]
            # Safety normalization: ensure image assets never get raw URLs
            if not is_pdf and "/raw/upload/" in secure_url:
                secure_url = secure_url.replace("/raw/upload/", "/image/upload/")

            return secure_url, result["public_id"]
        except Exception as e:
            logger.error(f"Cloudinary upload failed: {e}. Falling back to local storage.")

    # Local fallback for development/testing
    upload_dir = os.path.join(os.getcwd(), "static", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    unique_id = f"doc_{uuid.uuid4().hex[:12]}"
    ext_fallback = ALLOWED_MIME_TYPES.get(content_type, ext or ".jpg")
    file_name = f"{unique_id}{ext_fallback}"
    file_path = os.path.join(upload_dir, file_name)

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    secure_url = f"{settings.API_BASE_URL}/static/uploads/{file_name}"
    return secure_url, unique_id
