from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_cms_and_welcome():
    # 1. Login as admin
    login_res = client.post("/auth/login", json={"identifier": "admin@evsmith.com", "password": "Admin@EVSmith2026!"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test saving Welcome CMS with brand_logo_url
    logo_url = "https://res.cloudinary.com/dn2kulcr4/image/upload/v1789301012/evsmith_documents/bztomkgi9sce9hnzsnyt.png"
    cms_payload = {
        "title": "EARN WITH ELECTRIC",
        "subtitle": "Trusted Local EV Rental in Hyderabad",
        "image_url": "https://maxtronev.com/assets/Blog30-Bt25-yDw.webp",
        "content_data": {
            "brand_logo_url": logo_url,
            "brand_name": "EVSMITH",
            "brand_accent": "MOBILITY",
            "tagline": "Trusted Local EV Rental in Hyderabad",
            "cta_button": "Get Started",
            "login_button": "I have an account"
        }
    }

    put_res = client.put("/admin/content/welcome", headers=headers, json=cms_payload)
    assert put_res.status_code == 200, f"PUT failed: {put_res.text}"

    # 3. Verify GET /content returns brand_logo_url
    get_res = client.get("/content")
    assert get_res.status_code == 200
    data = get_res.json()
    welcome_data = data.get("welcome", {})
    content_data = welcome_data.get("content_data", {})
    assert content_data.get("brand_logo_url") == logo_url, f"Expected {logo_url}, got {content_data.get('brand_logo_url')}"
    assert content_data.get("brand_name") == "EVSMITH"
    assert content_data.get("brand_accent") == "MOBILITY"
