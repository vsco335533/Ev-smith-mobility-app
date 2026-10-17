from datetime import datetime, timezone
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, RiderProfile, Address, IdentityDocument, EmergencyContact, RiderDeclaration, UserRole, DocVerificationStatus
from app.models.vehicle import Station, Vehicle, VehicleStatus


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Super Admin
        admin = db.query(User).filter(User.email == "admin@evsmith.com").first()
        if not admin:
            admin = User(
                email="admin@evsmith.com",
                phone="9876543210",
                password_hash=get_password_hash("Admin@EVSmith2026!"),
                role=UserRole.SUPER_ADMIN.value,
                must_change_password=False,
                is_active=True
            )
            db.add(admin)
            db.flush()
            admin_profile = RiderProfile(
                user_id=admin.id,
                full_name="EVSMITH Operations Admin",
                is_profile_complete=True
            )
            db.add(admin_profile)
            print("✓ Seeded Super Admin: admin@evsmith.com / Admin@EVSmith2026!")

        # 2. Sample Rider
        rider = db.query(User).filter(User.email == "rider@evsmith.com").first()
        if not rider:
            rider = User(
                email="rider@evsmith.com",
                phone="9123456780",
                password_hash=get_password_hash("9123456780"),  # Default password = phone
                role=UserRole.RIDER.value,
                must_change_password=False,
                is_active=True
            )
            db.add(rider)
            db.flush()
            
            rider_profile = RiderProfile(
                user_id=rider.id,
                full_name="Sai Kumar Varma",
                dob="1996-05-14",
                gender="Male",
                occupation="Software Engineer",
                employer_id="EMP-OCTA-928",
                alt_phone="9887766554",
                is_profile_complete=True
            )
            db.add(rider_profile)

            current_addr = Address(
                user_id=rider.id,
                address_type="CURRENT",
                line="Plot 42, Silicon Valley Colony, Madhapur",
                city="Hyderabad",
                state="Telangana",
                pincode="500081",
                country="India"
            )
            db.add(current_addr)

            doc = IdentityDocument(
                user_id=rider.id,
                document_type="DRIVING_LICENCE",
                document_number="TS09-20210087654",
                secure_url="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=60",
                verification_status=DocVerificationStatus.VERIFIED.value
            )
            db.add(doc)

            emergency = EmergencyContact(
                user_id=rider.id,
                reference_name="Rahul Sharma",
                reference_phone="9988776655",
                emergency_name="Lakshmi Varma",
                emergency_phone="9876501234"
            )
            db.add(emergency)

            declaration = RiderDeclaration(
                user_id=rider.id,
                agreed=True,
                declaration_text="I agree to all terms and conditions of EVSMITH scooter rental."
            )
            db.add(declaration)
            print("✓ Seeded Sample Rider: rider@evsmith.com / 9123456780")

        # 3. Stations in Hyderabad
        stations_data = [
            {
                "name": "HITEC City Main Hub",
                "code": "HYD-HITEC-01",
                "address": "Cyber Towers Junction, Madhapur",
                "city": "Hyderabad",
                "latitude": 17.4504,
                "longitude": 78.3808,
                "contact_number": "+91 40 6789 1001"
            },
            {
                "name": "Gachibowli Financial District Hub",
                "code": "HYD-GACH-02",
                "address": "Opposite WaveRock SEZ, Nanakramguda",
                "city": "Hyderabad",
                "latitude": 17.4239,
                "longitude": 78.3370,
                "contact_number": "+91 40 6789 1002"
            },
            {
                "name": "Jubilee Hills Metro Station Hub",
                "code": "HYD-JUB-03",
                "address": "Road No. 36 Metro Pillar 1400",
                "city": "Hyderabad",
                "latitude": 17.4319,
                "longitude": 78.4073,
                "contact_number": "+91 40 6789 1003"
            }
        ]

        station_map = {}
        for s_data in stations_data:
            st = db.query(Station).filter(Station.code == s_data["code"]).first()
            if not st:
                st = Station(**s_data)
                db.add(st)
                db.flush()
            station_map[st.code] = st.id
        print("✓ Seeded EV Stations across Hyderabad")

        # 4. EV Scooters
        vehicles_data = [
            {
                "station_id": station_map["HYD-HITEC-01"],
                "make": "EVSMITH",
                "model": "S1 Pro",
                "variant": "Electric Performance",
                "registration_number": "TS 09 EV 4102",
                "chassis_number": "EVS-2026-CH-009182",
                "battery_percentage": 96,
                "range_km": 135,
                "top_speed_kmh": 90,
                "daily_rate": 350.0,
                "deposit_amount": 2000.0,
                "status": VehicleStatus.AVAILABLE.value,
                "image_url": "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80",
                "features": "Cruise Control, Hyper Mode, GPS Anti-Theft, Regenerative Braking, 7-inch TFT Touchscreen"
            },
            {
                "station_id": station_map["HYD-HITEC-01"],
                "make": "EVSMITH",
                "model": "S1 Air",
                "variant": "City Commuter",
                "registration_number": "TS 09 EV 5521",
                "chassis_number": "EVS-2026-CH-004419",
                "battery_percentage": 88,
                "range_km": 105,
                "top_speed_kmh": 80,
                "daily_rate": 299.0,
                "deposit_amount": 1500.0,
                "status": VehicleStatus.AVAILABLE.value,
                "image_url": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80",
                "features": "Eco/Ride Modes, LED Headlamps, USB Charging, Quick-Swap Battery"
            },
            {
                "station_id": station_map["HYD-GACH-02"],
                "make": "EVSMITH",
                "model": "Apex 450",
                "variant": "Hyper Edition",
                "registration_number": "TS 08 EV 8890",
                "chassis_number": "EVS-2026-CH-007788",
                "battery_percentage": 100,
                "range_km": 150,
                "top_speed_kmh": 95,
                "daily_rate": 450.0,
                "deposit_amount": 2500.0,
                "status": VehicleStatus.AVAILABLE.value,
                "image_url": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80",
                "features": "Warp Mode, Fast DC Charging (0-80% in 35m), Dual Disc Brakes, Sport Suspension"
            },
            {
                "station_id": station_map["HYD-JUB-03"],
                "make": "EVSMITH",
                "model": "Urban Glide",
                "variant": "Eco Explorer",
                "registration_number": "TS 10 EV 1034",
                "chassis_number": "EVS-2026-CH-001290",
                "battery_percentage": 92,
                "range_km": 95,
                "top_speed_kmh": 70,
                "daily_rate": 250.0,
                "deposit_amount": 1500.0,
                "status": VehicleStatus.AVAILABLE.value,
                "image_url": "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80",
                "features": "Lightweight Frame, Removable Battery, Large Storage Boot, Smartphone Sync"
            }
        ]

        for v_data in vehicles_data:
            veh = db.query(Vehicle).filter(Vehicle.registration_number == v_data["registration_number"]).first()
            if not veh:
                veh = Vehicle(**v_data)
                db.add(veh)
        print("✓ Seeded EV Scooter Fleet with specs, batteries, and images")

        db.commit()
        print("★ EVSMITH Database Seed Complete! Ready for production workflows.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
