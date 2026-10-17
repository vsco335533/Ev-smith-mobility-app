import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_admin_rbac_unauthenticated():
    # Attempting to access admin route without token
    response = client.get("/admin/riders")
    assert response.status_code == 403 or response.status_code == 401


def test_admin_rbac_as_rider():
    # Login as rider
    login_res = client.post(
        "/auth/login",
        json={"identifier": "rider@evsmith.com", "password": "9123456780"}
    )
    rider_token = login_res.json()["access_token"]

    # Rider trying to call admin endpoint
    response = client.get(
        "/admin/riders",
        headers={"Authorization": f"Bearer {rider_token}"}
    )
    assert response.status_code == 403


def test_admin_rbac_as_super_admin():
    # Login as admin
    login_res = client.post(
        "/auth/login",
        json={"identifier": "admin@evsmith.com", "password": "Admin@EVSmith2026!"}
    )
    admin_token = login_res.json()["access_token"]

    # Admin accessing admin endpoint
    response = client.get(
        "/admin/riders",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    riders = response.json()
    assert isinstance(riders, list)
