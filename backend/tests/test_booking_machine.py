import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_public_fleet_listing():
    response = client.get("/vehicles")
    assert response.status_code == 200
    vehicles = response.json()
    assert len(vehicles) >= 3
    assert any(v["model"] == "S1 Pro" for v in vehicles)


def test_stations_listing():
    response = client.get("/vehicles/stations")
    assert response.status_code == 200
    stations = response.json()
    assert len(stations) >= 3
    assert any("HITEC" in s["name"] for s in stations)


def test_quote_calculation():
    vehicles = client.get("/vehicles").json()
    vehicle_id = vehicles[0]["id"]
    
    quote_res = client.post(
        "/vehicles/calculate-quote",
        json={"vehicle_id": vehicle_id, "duration_days": 7}
    )
    assert quote_res.status_code == 200
    quote = quote_res.json()
    assert quote["duration_days"] == 7
    assert quote["rental_amount"] == round(quote["daily_rate"] * 7, 2)
    assert quote["total_amount"] == round(quote["rental_amount"] + quote["deposit_amount"], 2)
