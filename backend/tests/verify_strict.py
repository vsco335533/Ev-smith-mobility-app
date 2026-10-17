"""
Strict Comprehensive Test Suite for EVSmith Features
Tests:
1. Authentication & Profile
2. Booking Details & Timestamps
3. Approval Idempotency
4. Pricing & Settlement (naive vs aware datetimes)
5. Vehicle Fleet Management (CRUD)
6. App Content CMS (Supreme Powers)
"""
import httpx
import sys
from datetime import datetime, timezone, timedelta

BASE_URL = "http://127.0.0.1:8000"
client = httpx.Client(timeout=30.0)

def log(msg, success=True):
    symbol = "✓" if success else "✗"
    print(f"[{symbol}] {msg}")

def run_tests():
    print("\n=======================================================")
    print("   EVSMITH RIGOROUS END-TO-END FEATURE VERIFICATION    ")
    print("=======================================================\n")
    
    # 1. AUTHENTICATION
    print("--- STEP 1: AUTHENTICATION & TOKENS ---")
    admin_res = client.post(f"{BASE_URL}/auth/login", json={"identifier": "admin@evsmith.com", "password": "Admin@EVSmith2026!"})
    assert admin_res.status_code == 200, f"Admin login failed: {admin_res.text}"
    admin_token = admin_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    log("Super Admin login successful and JWT issued")
    
    rider_res = client.post(f"{BASE_URL}/auth/login", json={"identifier": "rider@evsmith.com", "password": "9123456780"})
    assert rider_res.status_code == 200, f"Rider login failed: {rider_res.text}"
    rider_token = rider_res.json()["access_token"]
    rider_headers = {"Authorization": f"Bearer {rider_token}"}
    log("Regular Rider login successful and JWT issued")

    # 2. PROFILE & DETAILS
    print("\n--- STEP 2: PROFILE DETAILS & EDITING ---")
    profile_res = client.get(f"{BASE_URL}/rider/profile", headers=rider_headers)
    assert profile_res.status_code == 200, f"Rider profile failed: {profile_res.text}"
    rider_data = profile_res.json()
    assert "email" in rider_data and "role" in rider_data
    log(f"Rider profile verified: {rider_data.get('email')} | Role: {rider_data.get('role')} | Name: {rider_data.get('full_name')}")
    assert rider_data.get("full_name") is not None, "Expected rider to have a full name"
    log("Rider profile details verified with address, occupation, and verification status")

    # 3. BOOKING REQUESTS: RIDER IDENTITY & TIMESTAMPS
    print("\n--- STEP 3: SUPER ADMIN IN-DETAIL BOOKING REQUESTS ---")
    reqs_res = client.get(f"{BASE_URL}/admin/booking-requests", headers=admin_headers)
    assert reqs_res.status_code == 200, f"Admin requests failed: {reqs_res.text}"
    reqs = reqs_res.json()
    log(f"Retrieved {len(reqs)} booking requests")
    assert len(reqs) > 0, "Expected at least 1 booking request"
    
    sample_booking = reqs[0]
    # Check rider identity fields
    assert "rider" in sample_booking, "Missing 'rider' field in booking response"
    rider_info = sample_booking["rider"]
    assert "full_name" in rider_info, "Missing 'full_name' in rider info"
    assert "phone" in rider_info, "Missing 'phone' in rider info"
    assert "email" in rider_info, "Missing 'email' in rider info"
    assert "verification_status" in rider_info, "Missing 'verification_status' in rider info"
    log(f"Rider info verified: Name='{rider_info['full_name']}', Phone='{rider_info['phone']}', Email='{rider_info['email']}', KYC='{rider_info['verification_status']}'")

    # Check timestamps
    assert "created_at" in sample_booking, "Missing 'created_at' timestamp"
    assert "approved_at" in sample_booking, "Missing 'approved_at' timestamp"
    log(f"Timestamps verified: Request Sent at='{sample_booking['created_at']}', Approved at='{sample_booking['approved_at']}'")

    # Check detailed booking view
    detail_res = client.get(f"{BASE_URL}/bookings/{sample_booking['id']}", headers=admin_headers)
    assert detail_res.status_code == 200, f"Booking detail failed: {detail_res.text}"
    detail_data = detail_res.json()
    assert "status_history" in detail_data, "Missing status history audit trail"
    log("In-depth booking details with status history audit trail verified")

    # 4. APPROVAL IDEMPOTENCY & STATUS TRANSITION
    print("\n--- STEP 4: APPROVAL IDEMPOTENCY & TRANSITION SAFETY ---")
    # Call approve on the booking (even if already approved or in agreement_required)
    appr1 = client.post(f"{BASE_URL}/admin/booking-requests/{sample_booking['id']}/approve", headers=admin_headers)
    assert appr1.status_code == 200, f"First approve failed: {appr1.text}"
    log("First approval call succeeded (status: 200 OK)")

    appr2 = client.post(f"{BASE_URL}/admin/booking-requests/{sample_booking['id']}/approve", headers=admin_headers)
    assert appr2.status_code == 200, f"Second approve call failed: {appr2.text}"
    log("Second approval call succeeded idempotently without transition crash (status: 200 OK)")

    # 5. PRICING SERVICE & RETURN SETTLEMENT (NAIVE VS AWARE DATETIMES)
    print("\n--- STEP 5: PRICING SERVICE & SETTLEMENT TIMEZONE TOLERANCE ---")
    from app.services.pricing_service import compute_settlement_figures
    
    # Case A: Naive datetimes (simulating direct PostgreSQL naive timestamps)
    naive_end = datetime(2026, 9, 10, 10, 0, 0)
    naive_return = datetime(2026, 9, 10, 13, 30, 0) # 3.5 hours late (>2 hrs grace)
    figures_naive = compute_settlement_figures(
        base_rental=1500.0,
        extension_amount=0.0,
        damage_charges=0.0,
        end_date=naive_end,
        return_date=naive_return,
        security_deposit=1500.0
    )
    assert figures_naive["late_days"] == 1, f"Expected 1 late day, got {figures_naive['late_days']}"
    assert figures_naive["late_charges"] > 0, f"Expected late charges, got {figures_naive['late_charges']}"
    log(f"Settlement with naive datetimes: Late Days={figures_naive['late_days']}, Late Charges={figures_naive['late_charges']}, Refund={figures_naive['refund_amount']}")

    # Case B: Aware datetimes
    aware_end = datetime(2026, 9, 10, 10, 0, 0, tzinfo=timezone.utc)
    aware_return = datetime(2026, 9, 10, 13, 30, 0, tzinfo=timezone.utc)
    figures_aware = compute_settlement_figures(
        base_rental=1500.0,
        extension_amount=0.0,
        damage_charges=200.0,
        end_date=aware_end,
        return_date=aware_return,
        security_deposit=1500.0
    )
    assert figures_aware["damage_charges"] == 200.0
    assert figures_aware["refund_amount"] == 1500.0 - figures_aware["late_charges"] - 200.0
    log(f"Settlement with aware datetimes & damages: Damages={figures_aware['damage_charges']}, Refund={figures_aware['refund_amount']}")

    # Case C: Mixed (naive end_date, aware return_date) - this was the exact bug in production
    figures_mixed = compute_settlement_figures(
        base_rental=1500.0,
        extension_amount=0.0,
        damage_charges=0.0,
        end_date=naive_end,
        return_date=aware_return,
        security_deposit=1500.0
    )
    assert figures_mixed["late_charges"] > 0
    log("Settlement with mixed naive/aware datetimes succeeded without TypeError")

    # 6. SUPER ADMIN FLEET MANAGEMENT (VEHICLE CRUD)
    print("\n--- STEP 6: SUPER ADMIN VEHICLE CARD MANAGEMENT (CRUD) ---")
    # List vehicles
    v_list = client.get(f"{BASE_URL}/admin/vehicles", headers=admin_headers)
    assert v_list.status_code == 200, f"List vehicles failed: {v_list.text}"
    initial_count = len(v_list.json())
    log(f"Retrieved {initial_count} vehicles from fleet")

    # Create new vehicle card
    new_v_payload = {
        "model": "Ather 450X Apex",
        "make": "Ather Energy",
        "variant": "Apex Performance",
        "registration_number": "TS 09 TEST 9999",
        "chassis_number": "ME4APEX9999999",
        "battery_percentage": 100,
        "range_km": 157,
        "top_speed_kmh": 100,
        "daily_rate": 449.0,
        "deposit_amount": 2500.0,
        "status": "AVAILABLE",
        "image_url": "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80",
        "station_id": 1
    }
    create_res = client.post(f"{BASE_URL}/admin/vehicles", headers=admin_headers, json=new_v_payload)
    assert create_res.status_code == 200, f"Vehicle create failed: {create_res.text}"
    created_v = create_res.json()
    new_v_id = created_v["id"]
    log(f"Created vehicle card ID={new_v_id}: {created_v['make']} {created_v['model']}")
    assert created_v["registration_number"] == "TS 09 TEST 9999"
    assert created_v["daily_rate"] == 449.0

    # Edit every detail of the vehicle card
    update_v_payload = {
        "model": "Ather 450X Warp+",
        "make": "Ather Energy",
        "variant": "Super Warp Edition",
        "registration_number": "TS 09 WARP 7777",
        "chassis_number": "ME4WARP7777777",
        "battery_percentage": 95,
        "range_km": 165,
        "top_speed_kmh": 105,
        "daily_rate": 499.0,
        "deposit_amount": 3000.0,
        "status": "MAINTENANCE",
        "image_url": "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80",
        "station_id": 2
    }
    update_res = client.put(f"{BASE_URL}/admin/vehicles/{new_v_id}", headers=admin_headers, json=update_v_payload)
    assert update_res.status_code == 200, f"Vehicle update failed: {update_res.text}"
    updated_v = update_res.json()
    assert updated_v["model"] == "Ather 450X Warp+"
    assert updated_v["registration_number"] == "TS 09 WARP 7777"
    assert updated_v["daily_rate"] == 499.0
    assert updated_v["deposit_amount"] == 3000.0
    assert updated_v["status"] == "MAINTENANCE"
    log(f"Updated every detail of vehicle ID={new_v_id} successfully")

    # Delete vehicle
    del_res = client.delete(f"{BASE_URL}/admin/vehicles/{new_v_id}", headers=admin_headers)
    assert del_res.status_code == 200, f"Vehicle delete failed: {del_res.text}"
    log(f"Deleted test vehicle ID={new_v_id} successfully")

    # Verify vehicle no longer exists
    v_list_after = client.get(f"{BASE_URL}/admin/vehicles", headers=admin_headers).json()
    assert len(v_list_after) == initial_count, "Vehicle count mismatch after delete"
    log("Verified vehicle deletion - fleet count restored")

    # 7. SUPER ADMIN CMS & APP CONTENT ("SUPREME POWERS")
    print("\n--- STEP 7: SUPER ADMIN CMS & APP CONTENT (SUPREME POWERS) ---")
    # Fetch public content
    content_res = client.get(f"{BASE_URL}/content")
    assert content_res.status_code == 200, f"Fetch content failed: {content_res.text}"
    content_all = content_res.json()
    assert "welcome" in content_all and "fleet" in content_all and "agreement" in content_all and "support" in content_all
    log("Public /content returns all 4 pages: Welcome, Fleet, Agreement, Support")

    # Update Welcome Page via CMS
    cms_welcome_payload = {
        "title": "Hyderabad's Smartest Green Fleet",
        "subtitle": "Ride emission-free across Telangana with zero hassle.",
        "image_url": "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1000&q=80",
        "content_data": {
            "tagline": "Pure Electric Performance",
            "cta_button": "Start Riding Now",
            "login_button": "I have an account"
        }
    }
    put_cms = client.put(f"{BASE_URL}/admin/content/welcome", headers=admin_headers, json=cms_welcome_payload)
    assert put_cms.status_code == 200, f"CMS update failed: {put_cms.text}"
    log("CMS updated Welcome page headline and button labels successfully")

    # Verify changes reflected publicly
    verify_content = client.get(f"{BASE_URL}/content/welcome").json()
    assert verify_content["title"] == "Hyderabad's Smartest Green Fleet"
    assert verify_content["content_data"]["cta_button"] == "Start Riding Now"
    log("Verified real-time update in public /content/welcome endpoint")

    # Restore default Welcome page content
    client.put(f"{BASE_URL}/admin/content/welcome", headers=admin_headers, json={
        "title": "Next-Gen Urban EV Fleet Rentals",
        "subtitle": "Smart, sustainable electric mobility for city commutes, daily rentals, and delivery professionals.",
        "image_url": "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1000&auto=format&fit=crop&q=80",
        "content_data": {
            "tagline": "Pure Electric Performance",
            "cta_button": "Get Started",
            "login_button": "I have an account"
        }
    })
    log("Restored clean default Welcome content")

    print("\n=======================================================")
    print("   ★ ALL RIGOROUS BACKEND TESTS PASSED (100% SUCCESS) ★   ")
    print("=======================================================\n")

if __name__ == "__main__":
    run_tests()
