import os
import base64
from app.core.config import settings

print('Cloud Name:', settings.CLOUDINARY_CLOUD_NAME)
print('API Key:', settings.CLOUDINARY_API_KEY)
print('API Secret length:', len(settings.CLOUDINARY_API_SECRET or ''))

import cloudinary
import cloudinary.uploader
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)

png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
test_bytes = base64.b64decode(png_base64)

res = cloudinary.uploader.upload(test_bytes, folder=settings.CLOUDINARY_FOLDER, resource_type='image')
print('Upload Result URL:', res['secure_url'])
print('Resource Type:', res.get('resource_type'))
