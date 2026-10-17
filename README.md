# EVSMITH MOBILITY SERVICES — EV SCOOTER RENTAL PLATFORM

Welcome to **EVSMITH Mobility Services**, a production-grade electric scooter rental ecosystem featuring a **React Native (Expo)** mobile application and a high-performance **Python FastAPI** backend with a PostgreSQL/SQLite database architecture.

---

## 🚀 HOW TO SCAN & SEE THE BUILD IN EXPO GO

You can run and test this application on your real physical phone (Android or iPhone) with **Expo Go**, or view it instantly in your web browser.

### Option 1: On Your Physical Phone (Android / iPhone)

1. **Install the App**:
   - **Android**: Install [Expo Go from Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent).
   - **iOS (iPhone)**: Install [Expo Go from the App Store](https://apps.apple.com/app/expo-go/id982107779).

2. **Connect to the Same Wi-Fi Network**:
   - Ensure your phone and development computer are connected to the same local Wi-Fi network (`192.168.1.x`).

3. **Scan the QR Code**:
   - **Android**: Open the **Expo Go** app -> Tap **"Scan QR code"** -> Scan the QR code shown in the Metro terminal.
   - **iOS**: Open the native **Camera app** -> Point at the QR code -> Tap the yellow **"Open in Expo Go"** banner.
   - **Manual URL**: Alternatively, inside Expo Go tap *"Enter URL manually"* and enter:
     ```
     exp://192.168.1.42:8081
     ```

4. **Experience the Live App**:
   - The app will bundle and load directly on your phone with live hot-reloading, touch gestures, and smooth animations!

---

### Option 2: In Your Web Browser

The project is fully compiled for the web. Simply open your browser and navigate to:
```
http://localhost:8081
```

---

## 🔑 DEFAULT DEV CREDENTIALS

For immediate zero-friction testing, the database is pre-seeded with sample accounts:

| Role | Email / Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@evsmith.com` | `Admin@EVSmith2026!` | Super Admin console access |
| **Verified Rider** | `rider@evsmith.com` | `9123456780` | Registered mobile number is default password |

*(You can also use the in-app "Demo Rider" and "Super Admin" quick-fill buttons on the login screen!)*

---

## 🔄 COMPLETE 14-STAGE RIDER JOURNEY

1. **Welcome Screen**: Logo, tagline, and animated electric mobility branding.
2. **Registration & Bravo Email OTP**: Enter name, phone, and email. Verify 6-digit Bravo OTP (with dev sandbox auto-fill).
3. **5-Step Rider Profile & KYC**:
   - Step 1: Personal Info (DOB, gender, occupation, employer ID).
   - Step 2: Addresses (Current & Permanent with "Same as current" toggle).
   - Step 3: Identification & Document Upload (Aadhaar / PAN / Driving Licence with Cloudinary/local upload).
   - Step 4: Emergency Contacts & References.
   - Step 5: Rider Legal Declaration.
4. **Dashboard**: View active ride hero card or available EV scooter fleet.
5. **Vehicle Details**: Specs (Battery %, Range, Top Speed, Daily Rate, Security Deposit).
6. **Ride Request**: Select duration (1 week, 2 weeks, 1 month) -> Dynamic server-calculated quote -> Submit.
7. **Lifecycle Timeline**: State machine enforces `PENDING` -> `UNDER_REVIEW` -> `APPROVED`.
8. **Super Admin Approval**: Review and approve requests (or use the in-app Admin shortcut button).
9. **Rental Agreement**: Review 11 statutory clauses + Draw signature on touch Signature Pad.
10. **Vehicle Station Handover**: Physical checklist (Tyres, Brakes, Electricals, Battery %, Accessories: Helmet, Charger, Toolbox).
11. **Active Ride**: Live telemetry, remaining days countdown, and expiry notification alert.
12. **Extension Request**: Request +1 week, +1 month, or custom days with instant price recalculation.
13. **Vehicle Return & Final Settlement**: Base rent + extension + late fees (₹100/day) - security deposit deduction.
14. **Completion Celebration**: Acknowledge settlement -> Ride Completed celebration -> Full booking history.

---

## 🛠 TECH STACK

- **Mobile**: React Native 0.76, Expo 52, TypeScript, React Navigation 7, Zustand, Axios, React Native Reanimated, Lucide Icons.
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy 2, Pydantic v2, Passlib (bcrypt), Python-Jose (JWT), Pytest.
- **Database**: SQLite (zero-setup local dev) and PostgreSQL 15 (Docker Compose support).
- **Storage**: Cloudinary API with local dev static fallback.
- **Email**: Bravo Email OTP with automated dev sandbox fallback.

---

## 💻 DEVELOPER COMMANDS

### Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
- API Docs (Swagger): `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`
- Run Test Suite: `pytest -v`

### Mobile
```bash
cd /home/octa/Downloads/evsmith-mobility/mobile
npx expo start -c

cd mobile
npm run start
```
- Press `w` in terminal to open Web preview.
- Press `r` to reload the bundle.






Implementation Plan: Date Pickers, Form Reset, Return & Transition Fixes, Super Admin Powers & CMS
Overview
This plan addresses all items in the user request:

Calendar Option (EVDatePicker): Replace manual text inputs for date fields (e.g., Date of Birth, booking start date, agreement DOB) with an interactive, dark-theme calendar date picker with year/month selection and quick decade jumping.
Remove Default / Auto-Fill Form Data: Ensure agreement forms, handover remarks, vehicle replacement reasons, extension reasons, and battery percentages are not pre-filled with dummy strings, requiring clean manual user entry.
Fix Return Error: Fix the offset-naive vs offset-aware datetime comparison crash (TypeError: can't compare offset-naive and offset-aware datetimes) in compute_settlement_figures during vehicle return.
Fix Super Admin Approval Status Transition: Make approve_booking_request idempotent, add loading state to prevent rapid double-clicks, and correctly filter action buttons.
Super Admin In-Detail Request View: Enrich booking responses with rider profile info (name, phone, email, KYC status), submission timestamps (created_at), acceptance timestamps (approved_at), and expandable in-depth detail modal with complete timeline and documents.
Profile Option & Logout for User and Super Admin: Dedicated in-depth Profile views for both Rider and Super Admin displaying all profile details, KYC documents/status, contact info, and a prominent, functional Log Out button.
Super Admin Vehicle Card Management: Full CRUD for vehicles (Edit any vehicle's make, model, variant, reg number, chassis, battery, range, top speed, daily rate, deposit, status, image URL; and Add New Vehicle).
Super Admin "Supreme Powers" CMS: An App Content Management System storing dynamic page texts, hero headlines, taglines, terms, support contacts, and image URLs, with an Admin CMS Editor to change texts and images across Welcome, Fleet, Agreement, and Support pages.
Super Admin Tab Renaming: In Super Admin view, change the tab label from "My Rides" to "Rentals", while keeping "My Rides" for regular riders.
User Review Required
NOTE

All changes maintain backward compatibility with existing databases and Expo configurations. The calendar date picker is implemented in pure React Native / dark theme to ensure zero native dependency linking issues on Expo Go Android & iOS.

Proposed Changes
Backend Changes
1. Models & Database Schema
[NEW] 
backend/app/models/app_content.py
Model AppContent storing page_key, section_key, content_json (or key-value text/image mappings), and updated_at.
Add to backend/app/models/__init__.py and auto-create via Base.metadata.create_all.
[MODIFY] 
backend/app/schemas/booking.py
Add RiderBasicInfo (id, full_name, email, phone, is_profile_complete, dob) to BookingResponse and BookingDetailResponse.
Add approved_at: Optional[datetime] or derive from status history.
[MODIFY] 
backend/app/schemas/vehicle.py
Add VehicleCreateRequest and VehicleUpdateRequest schemas for adding and editing vehicles.
[MODIFY] 
backend/app/services/pricing_service.py
Normalize datetime timezones in compute_settlement_figures:
python

if end_date.tzinfo is None:
    end_date = end_date.replace(tzinfo=timezone.utc)
if return_date.tzinfo is None:
    return_date = return_date.replace(tzinfo=timezone.utc)
This eliminates the TypeError: can't compare offset-naive and offset-aware datetimes during vehicle return.
[MODIFY] 
backend/app/services/booking_machine.py
Add resilience to transition_booking_status and allow Super Admin overrides where necessary.
[MODIFY] 
backend/app/api/admin.py
Approve Booking Idempotency: If a booking is already AGREEMENT_REQUIRED or APPROVED, return existing booking cleanly instead of throwing transition error.
Vehicle CRUD:
POST /admin/vehicles: Create new vehicle card.
PUT /admin/vehicles/{vehicle_id}: Update any and all vehicle attributes (make, model, reg number, chassis, battery, range, top speed, rates, deposit, status, image URL, station).
DELETE /admin/vehicles/{vehicle_id}: Decommission vehicle.
In-Detail Booking Requests: Return full rider information, vehicle telemetry, creation timestamp, and approval timestamp.
CMS / App Content Endpoints:
GET /admin/content: Get all editable pages and fields.
PUT /admin/content/{page_key}: Update page text and images.
[NEW] 
backend/app/api/content.py
Public endpoint GET /content and GET /content/{page_key} for mobile app dynamic content fetching with sensible defaults.
[MODIFY] 
backend/app/main.py
Include content.router in FastAPI application.
Mobile App Changes
2. Reusable UI Components
[NEW] 
mobile/src/components/common/EVDatePicker.tsx
Reusable, theme-styled Date Picker component with:
Input field with calendar icon and formatted display date.
Modal calendar with month/year navigation, quick year selector grid (for DOB selection 1960–2026), day grid, today shortcut, and confirm button.
Dark glassmorphic design matching EVSmith aesthetics.
3. Form Clean-Up (Removing Default Hardcoded Data)
[MODIFY] 
mobile/src/screens/agreement/RentalAgreementScreen.tsx
Remove hardcoded default values:
lesseeName: use user?.full_name || '' (was fallback to 'Sai Kumar Varma')
lesseePhone: use user?.phone || '' (was fallback to '9123456780')
lesseeDob: '' (was '1996-08-20') -> use EVDatePicker
lesseeAddress: '' (was hardcoded Madhapur address)
Integrate EVDatePicker for Date of Birth.
[MODIFY] 
mobile/src/screens/handover/VehicleHandoverScreen.tsx
Empty inspectorNotes ('' instead of 'Vehicle inspected in pristine condition...').
Empty batteryPct ('' instead of '100').
Require manual verification of accessories checklist instead of all defaulting to true.
[MODIFY] 
mobile/src/screens/active/ActiveBookingScreen.tsx
Reset vehicle replacement changeReason to '' and damageRemarks to ''.
[MODIFY] 
mobile/src/screens/extension/ExtendBookingScreen.tsx
Reset extension reason to ''.
[MODIFY] 
mobile/src/screens/registration/RiderRegistrationScreen.tsx
Replace plain DOB text input with EVDatePicker.
4. Navigation & Tab Labels
[MODIFY] 
mobile/src/navigation/RootNavigator.tsx
Dynamically label tab:
isSuperAdmin ? 'Rentals' : 'My Rides'
Add ProfileScreen to navigation and tabs/header.
Hide Admin tab from regular riders if not Super Admin.
5. User & Super Admin Profile with Logout
[NEW] 
mobile/src/screens/profile/ProfileScreen.tsx
Full Profile Details:
User details: Full Name, Email, Phone, DOB, Gender, Occupation, Employer ID, Current Address, Permanent Address, Emergency Contact, KYC Documents (with status badge & preview links).
Super Admin details: Name, Email, Phone, Role badge (SUPER ADMIN), System permissions overview.
Prominent Log Out button that clears auth token in useAuthStore and navigates to Welcome/Login screen.
Edit Profile modal to update contact/address info.
6. Super Admin Console Enhancements
[MODIFY] 
mobile/src/screens/admin/AdminPortalScreen.tsx
Tabs:
Booking Requests: In-depth booking cards with Rider Name, Phone, Email, Request Time (created_at), Acceptance Time (approved_at), Vehicle details, and full detail modal.
Riders & KYC: Rider identity verification.
Fleet Management: All vehicle cards with Edit Vehicle and + Add New Vehicle modals.
App Content & CMS: Supreme admin powers to edit page texts, hero titles, descriptions, and image URLs across Welcome, Fleet, Agreement, and Support pages.
Add debouncing & loading states to approval buttons to avoid double-action race conditions.
7. Dynamic App Content (CMS Store & Integration)
[NEW] 
mobile/src/store/useAppContentStore.ts
Zustand store fetching dynamic content from /content with local fallback defaults.
[MODIFY] 
mobile/src/screens/auth/WelcomeScreen.tsx
Use dynamic hero title, subtitle, image URL, and feature highlights from useAppContentStore.
Verification Plan
Automated Tests
Run backend unit tests:
bash

./venv/bin/pytest
Run targeted test on settlement calculation with timezone-aware and naive datetimes:
bash

./venv/bin/python -c "
from datetime import datetime, timezone
from app.services.pricing_service import compute_settlement_figures
# Test return with naive end_date and aware return_date
res = compute_settlement_figures(100.0, 0.0, 0.0, datetime.now(), datetime.now(timezone.utc), 500.0)
print('Settlement test PASSED:', res['base_rental_amount'])
"
Test vehicle CRUD endpoints via curl / python script.
Test CMS content endpoints via curl / python script.
Manual Verification
Calendar Picker: Open Rider Registration and Rental Agreement -> tap Date of Birth -> verify smooth calendar popup, year selector jump, day selection, and formatted date update.
Empty Default Data: Open Rental Agreement -> verify name/phone only prefilled from account, but DOB, Address, and Handover remarks are completely empty and require manual input.
Return Scooter: On an active booking, tap "Return Scooter & Settle Dues" -> confirm return proceeds to Final Settlement without 500 or "An unexpected error occurred".
Super Admin Approval: Open Admin Portal -> tap "Approve Booking" -> verify instant approval without status transition error, button shows loading, and card updates cleanly.
Super Admin Request In-Detail: Check booking cards in Admin Portal -> verify rider name, phone, email, request time, and approval time are clearly visible.
Vehicle Card CRUD: In Admin Portal -> Fleet Management -> Edit an existing vehicle's rate/battery/image -> tap Save -> verify updated on Fleet screen. Add a new vehicle -> verify it appears on Fleet screen.
CMS Supreme Powers: In Admin Portal -> CMS -> Edit Welcome screen title and image URL -> tap Publish -> navigate to Welcome screen and verify new text and image are rendered.
Profile & Logout: Tap Profile in user/admin dashboard -> check all in-depth details -> tap Logout -> verify user is logged out and returned to Welcome screen.
Tab Label: Login as Super Admin -> verify bottom tab says "Rentals". Login as Rider -> verify bottom tab says "My Rides".
done with admin portal !!
done with curl 