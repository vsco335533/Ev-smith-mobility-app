from fastapi.testclient import TestClient
from app.main import app
import base64

client = TestClient(app)


def test_upload_image_endpoint():
    # 1. Login as admin
    login_res = client.post("/auth/login", json={"identifier": "admin@evsmith.com", "password": "Admin@EVSmith2026!"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload test PNG
    png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    png_bytes = base64.b64decode(png_base64)

    files = {"file": ("test_logo.png", png_bytes, "image/png")}
    upload_res = client.post("/admin/upload-image", headers=headers, files=files)
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    data = upload_res.json()
    assert data["success"] is True
    assert "secure_url" in data or "url" in data
