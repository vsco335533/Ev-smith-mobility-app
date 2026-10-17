import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.otp_service import generate_otp, verify_otp

client = TestClient(app)


def test_otp_flow():
    email = "testrider@example.com"
    otp, is_sandbox = generate_otp(email)
    assert len(otp) == 6
    assert isinstance(is_sandbox, bool)

    # Bad OTP fails
    valid, msg = verify_otp(email, "000000")
    assert valid is False

    # Good OTP succeeds
    valid, msg = verify_otp(email, otp)
    assert valid is True
    assert "successfully" in msg.lower()


def test_login_admin():
    response = client.post(
        "/auth/login",
        json={"identifier": "admin@evsmith.com", "password": "Admin@EVSmith2026!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "SUPER_ADMIN"


def test_login_seeded_rider():
    response = client.post(
        "/auth/login",
        json={"identifier": "rider@evsmith.com", "password": "9123456780"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "RIDER"
