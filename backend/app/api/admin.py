from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Body, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.user import User, RiderProfile, IdentityDocument, DocVerificationStatus
from app.models.booking import Booking, BookingStatus
from app.models.vehicle import Vehicle, VehicleStatus, Station
from app.models.app_content import AppContent
from app.models.settlement import BookingExtension, VehicleChangeRequest, FinalSettlement, RequestStatus
from app.schemas.rider import RiderProfileResponse
from app.schemas.booking import BookingDetailResponse, BookingResponse
from app.schemas.vehicle import VehicleDetailResponse, VehicleCreateRequest, VehicleUpdateRequest
from app.services.booking_machine import transition_booking_status
from app.services.pricing_service import compute_settlement_figures

router = APIRouter(prefix="/admin", tags=["Super Admin Operations"])


@router.get("/riders", response_model=List[RiderProfileResponse])
def get_all_riders(current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    users = db.query(User).filter(User.role == "RIDER").all()
    results = []
    from app.api.rider import get_rider_profile
    for u in users:
        results.append(get_rider_profile(current_user=u, db=db))
    return results


@router.post("/documents/{doc_id}/verify")
def verify_rider_document(
    doc_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    doc = db.query(IdentityDocument).filter(IdentityDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    doc.verification_status = DocVerificationStatus.VERIFIED.value
    doc.verified_at = datetime.now(timezone.utc)
    doc.rejection_reason = None
    db.commit()

    return {"success": True, "message": f"Document {doc.document_number} verified successfully."}


@router.post("/documents/{doc_id}/reject")
def reject_rider_document(
    doc_id: int,
    reason: str = Body(..., embed=True),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    doc = db.query(IdentityDocument).filter(IdentityDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    doc.verification_status = DocVerificationStatus.REJECTED.value
    doc.rejection_reason = reason
    db.commit()

    return {"success": True, "message": "Document rejected.", "reason": reason}


@router.get("/booking-requests", response_model=List[BookingDetailResponse])
def get_all_bookings(
    status_filter: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Booking).order_by(Booking.created_at.desc())
    if status_filter:
        query = query.filter(Booking.status == status_filter)
    bookings = query.all()
    from app.api.bookings import _format_booking_response
    return [_format_booking_response(b) for b in bookings]


@router.post("/booking-requests/{booking_id}/review", response_model=BookingDetailResponse)
def review_booking_request(
    booking_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    transition_booking_status(
        db=db,
        booking=booking,
        new_status=BookingStatus.UNDER_REVIEW.value,
        changed_by_user_id=current_admin.id,
        remarks="Booking request is now under administrative review."
    )
    from app.api.bookings import _format_booking_response
    return _format_booking_response(booking)


@router.post("/booking-requests/{booking_id}/approve", response_model=BookingDetailResponse)
def approve_booking_request(
    booking_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    from app.api.bookings import _format_booking_response

    # Idempotency: If already approved or past approval, return cleanly
    if booking.status in [
        BookingStatus.APPROVED.value,
        BookingStatus.AGREEMENT_REQUIRED.value,
        BookingStatus.HANDOVER_REQUIRED.value,
        BookingStatus.ACTIVE.value,
    ]:
        return _format_booking_response(booking)

    # If in PENDING, move through UNDER_REVIEW first or directly to APPROVED
    if booking.status == BookingStatus.PENDING.value:
        transition_booking_status(
            db=db,
            booking=booking,
            new_status=BookingStatus.UNDER_REVIEW.value,
            changed_by_user_id=current_admin.id,
            remarks="Fast-tracked review by Super Admin."
        )

    if booking.status == BookingStatus.UNDER_REVIEW.value:
        transition_booking_status(
            db=db,
            booking=booking,
            new_status=BookingStatus.APPROVED.value,
            changed_by_user_id=current_admin.id,
            remarks="Ride request approved by Super Admin."
        )

        # Immediately advance to AGREEMENT_REQUIRED
        transition_booking_status(
            db=db,
            booking=booking,
            new_status=BookingStatus.AGREEMENT_REQUIRED.value,
            changed_by_user_id=current_admin.id,
            remarks="Rental agreement signing required from rider."
        )

    return _format_booking_response(booking)


@router.post("/booking-requests/{booking_id}/reject", response_model=BookingDetailResponse)
def reject_booking_request(
    booking_id: int,
    reason: str = Body("Eligibility criteria not met", embed=True),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    transition_booking_status(
        db=db,
        booking=booking,
        new_status=BookingStatus.REJECTED.value,
        changed_by_user_id=current_admin.id,
        remarks=f"Rejected: {reason}"
    )

    from app.api.bookings import _format_booking_response
    return _format_booking_response(booking)


@router.post("/extensions/{ext_id}/approve", response_model=BookingDetailResponse)
def approve_extension(
    ext_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    ext = db.query(BookingExtension).filter(BookingExtension.id == ext_id).first()
    if not ext:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Extension request not found")

    ext.status = RequestStatus.APPROVED.value
    ext.reviewed_at = datetime.now(timezone.utc)
    
    booking = ext.booking
    # Extend booking end date and duration
    booking.end_date = booking.end_date + timedelta(days=ext.requested_days)
    booking.duration_days += ext.requested_days
    booking.rental_amount += ext.additional_amount
    booking.total_amount += ext.additional_amount

    # Transition booking back to ACTIVE
    transition_booking_status(
        db=db,
        booking=booking,
        new_status=BookingStatus.ACTIVE.value,
        changed_by_user_id=current_admin.id,
        remarks=f"Extension approved for {ext.requested_days} days. New end date: {booking.end_date.strftime('%d-%m-%Y')}."
    )

    from app.api.bookings import _format_booking_response
    return _format_booking_response(booking)


@router.post("/extensions/{ext_id}/reject", response_model=BookingDetailResponse)
def reject_extension(
    ext_id: int,
    reason: str = Body("Extension not possible due to fleet scheduling", embed=True),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    ext = db.query(BookingExtension).filter(BookingExtension.id == ext_id).first()
    if not ext:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Extension request not found")

    ext.status = RequestStatus.REJECTED.value
    ext.admin_notes = reason
    ext.reviewed_at = datetime.now(timezone.utc)

    booking = ext.booking
    transition_booking_status(
        db=db,
        booking=booking,
        new_status=BookingStatus.ACTIVE.value,
        changed_by_user_id=current_admin.id,
        remarks=f"Extension request rejected: {reason}"
    )

    from app.api.bookings import _format_booking_response
    return _format_booking_response(booking)


@router.post("/vehicle-change-requests/{req_id}/approve", response_model=BookingDetailResponse)
def approve_vehicle_change(
    req_id: int,
    new_vehicle_id: Optional[int] = Body(None, embed=True),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    v_req = db.query(VehicleChangeRequest).filter(VehicleChangeRequest.id == req_id).first()
    if not v_req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Change request not found")

    v_req.status = RequestStatus.APPROVED.value
    booking = v_req.booking

    # If new vehicle provided, swap
    if new_vehicle_id:
        old_vehicle = booking.vehicle
        if old_vehicle:
            old_vehicle.status = VehicleStatus.MAINTENANCE.value
        new_vehicle = db.query(Vehicle).filter(Vehicle.id == new_vehicle_id).first()
        if new_vehicle:
            new_vehicle.status = VehicleStatus.RENTED.value
            booking.vehicle_id = new_vehicle.id
            v_req.new_vehicle_id = new_vehicle.id

    transition_booking_status(
        db=db,
        booking=booking,
        new_status=BookingStatus.ACTIVE.value,
        changed_by_user_id=current_admin.id,
        remarks="Vehicle replacement approved and processed."
    )

    from app.api.bookings import _format_booking_response
    return _format_booking_response(booking)


# ==========================================
# VEHICLE & FLEET MANAGEMENT (SUPER ADMIN)
# ==========================================

@router.get("/vehicles", response_model=List[VehicleDetailResponse])
def get_admin_vehicles(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    vehicles = db.query(Vehicle).order_by(Vehicle.id.asc()).all()
    results = []
    for v in vehicles:
        resp = VehicleDetailResponse.model_validate(v)
        if v.station:
            resp.station_name = v.station.name
        results.append(resp)
    return results


@router.post("/vehicles", response_model=VehicleDetailResponse)
def create_vehicle(
    req: VehicleCreateRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Verify station exists
    station = db.query(Station).filter(Station.id == req.station_id).first()
    if not station:
        # Default to first active station if invalid
        station = db.query(Station).filter(Station.is_active == True).first()
        if not station:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active station available.")
        req.station_id = station.id

    new_vehicle = Vehicle(
        station_id=req.station_id,
        make=req.make.strip(),
        model=req.model.strip(),
        variant=req.variant.strip(),
        registration_number=req.registration_number.strip().upper(),
        chassis_number=req.chassis_number.strip().upper(),
        battery_percentage=req.battery_percentage,
        range_km=req.range_km,
        top_speed_kmh=req.top_speed_kmh,
        daily_rate=req.daily_rate,
        deposit_amount=req.deposit_amount,
        status=req.status,
        image_url=req.image_url.strip(),
        features=req.features
    )
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)

    resp = VehicleDetailResponse.model_validate(new_vehicle)
    if new_vehicle.station:
        resp.station_name = new_vehicle.station.name
    return resp


@router.put("/vehicles/{vehicle_id}", response_model=VehicleDetailResponse)
def update_vehicle(
    vehicle_id: int,
    req: VehicleUpdateRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    update_data = req.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        if val is not None:
            setattr(vehicle, key, val)

    vehicle.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(vehicle)

    resp = VehicleDetailResponse.model_validate(vehicle)
    if vehicle.station:
        resp.station_name = vehicle.station.name
    return resp


@router.delete("/vehicles/{vehicle_id}")
def delete_vehicle(
    vehicle_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    # Prevent deleting vehicle with active bookings
    active_b = db.query(Booking).filter(
        Booking.vehicle_id == vehicle_id,
        Booking.status.in_([BookingStatus.ACTIVE.value, BookingStatus.HANDOVER_REQUIRED.value])
    ).first()
    if active_b:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete vehicle with active rental ride."
        )

    db.delete(vehicle)
    db.commit()
    return {"success": True, "message": f"Vehicle {vehicle.registration_number} deleted successfully."}


# ==========================================
# APP CONTENT & CMS (SUPREME ADMIN POWERS)
# ==========================================

@router.get("/content")
def get_all_cms_content(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    contents = db.query(AppContent).all()
    results = {}
    for c in contents:
        results[c.page_key] = {
            "page_key": c.page_key,
            "title": c.title,
            "subtitle": c.subtitle,
            "image_url": c.image_url,
            "content_data": c.content_data or {},
            "updated_at": c.updated_at.isoformat() if c.updated_at else None
        }
    return results


@router.put("/content/{page_key}")
def update_cms_content(
    page_key: str,
    payload: dict = Body(...),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    content = db.query(AppContent).filter(AppContent.page_key == page_key).first()
    if not content:
        content = AppContent(
            page_key=page_key,
            title=payload.get("title"),
            subtitle=payload.get("subtitle"),
            image_url=payload.get("image_url"),
            content_data=payload.get("content_data", {})
        )
        db.add(content)
    else:
        if "title" in payload:
            content.title = payload["title"]
        if "subtitle" in payload:
            content.subtitle = payload["subtitle"]
        if "image_url" in payload:
            content.image_url = payload["image_url"]
        if "content_data" in payload:
            content.content_data = payload["content_data"]
        content.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(content)
    return {
        "success": True,
        "page_key": content.page_key,
        "title": content.title,
        "subtitle": content.subtitle,
        "image_url": content.image_url,
        "content_data": content.content_data,
        "updated_at": content.updated_at.isoformat()
    }


@router.post("/upload-image")
async def upload_admin_image(
    file: UploadFile = File(...),
    current_admin: User = Depends(get_current_admin)
):
    from app.services.cloudinary_service import upload_document
    secure_url, public_id = await upload_document(file)
    return {
        "success": True,
        "secure_url": secure_url,
        "public_id": public_id,
        "file_name": file.filename,
        "content_type": file.content_type
    }

