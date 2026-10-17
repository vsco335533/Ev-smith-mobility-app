import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_rider, get_current_user
from app.models.user import User
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.booking import (
    Booking, BookingStatusHistory, VehicleHandover,
    BookingStatus, ConditionStatus, ElectricalCondition
)
from app.models.agreement import RentalAgreement
from app.models.settlement import (
    BookingExtension, VehicleChangeRequest, FinalSettlement,
    RequestStatus, PaymentMode
)
from app.schemas.booking import (
    CreateBookingRequest, BookingResponse, BookingDetailResponse,
    AgreementSubmitRequest, HandoverSubmitRequest,
    ExtensionCreateRequest, VehicleChangeCreateRequest,
    FinalSettlementAcknowledgeRequest, RiderBasicInfo
)
from app.services.pricing_service import calculate_rental_quote, compute_settlement_figures
from app.services.booking_machine import transition_booking_status

router = APIRouter(prefix="/bookings", tags=["Bookings Lifecycle"])


def _format_booking_response(b: Booking) -> BookingDetailResponse:
    resp = BookingDetailResponse.model_validate(b)
    if b.vehicle:
        resp.vehicle.station_name = b.vehicle.station.name if b.vehicle.station else None
    if b.rider:
        prof = b.rider.profile
        doc_status = "PENDING"
        if b.rider.documents:
            doc_status = b.rider.documents[0].verification_status
        resp.rider = RiderBasicInfo(
            id=b.rider.id,
            email=b.rider.email,
            phone=b.rider.phone,
            full_name=prof.full_name if prof else None,
            dob=prof.dob if prof else None,
            is_profile_complete=prof.is_profile_complete if prof else False,
            verification_status=doc_status
        )
    if b.status_history:
        for item in b.status_history:
            if item.new_status in [BookingStatus.APPROVED.value, BookingStatus.AGREEMENT_REQUIRED.value]:
                resp.approved_at = item.created_at
                break
    return resp


@router.post("/request", response_model=BookingDetailResponse)
def create_booking_request(
    req: CreateBookingRequest,
    current_user: User = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    # Ensure profile is complete
    if not current_user.profile or not current_user.profile.is_profile_complete:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your rider profile and identity verification before booking."
        )

    # Check if rider already has an active or in-progress booking
    active_booking = db.query(Booking).filter(
        Booking.rider_id == current_user.id,
        Booking.status.in_([
            BookingStatus.PENDING.value,
            BookingStatus.UNDER_REVIEW.value,
            BookingStatus.APPROVED.value,
            BookingStatus.AGREEMENT_REQUIRED.value,
            BookingStatus.HANDOVER_REQUIRED.value,
            BookingStatus.ACTIVE.value,
            BookingStatus.EXTENSION_REQUESTED.value,
            BookingStatus.VEHICLE_CHANGE_REQUESTED.value,
            BookingStatus.RETURN_PENDING.value,
            BookingStatus.SETTLEMENT_PENDING.value
        ])
    ).first()

    if active_booking:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You already have an ongoing booking #{active_booking.booking_number} in status '{active_booking.status}'."
        )

    vehicle = db.query(Vehicle).filter(Vehicle.id == req.vehicle_id).first()
    if not vehicle or vehicle.status != VehicleStatus.AVAILABLE.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The requested EV scooter is currently not available for booking."
        )

    # Calculate authoritative pricing
    quote = calculate_rental_quote(vehicle, req.duration_days, req.start_date)

    booking_num = f"EVS-{uuid.uuid4().hex[:8].upper()}"
    booking = Booking(
        booking_number=booking_num,
        rider_id=current_user.id,
        vehicle_id=vehicle.id,
        station_id=req.station_id,
        status=BookingStatus.PENDING.value,
        start_date=quote["start_date"],
        end_date=quote["end_date"],
        duration_days=req.duration_days,
        daily_rate=quote["daily_rate"],
        rental_amount=quote["rental_amount"],
        deposit_amount=quote["deposit_amount"],
        total_amount=quote["total_amount"],
        notes=req.notes
    )
    db.add(booking)
    db.flush()

    # Initial history entry
    history = BookingStatusHistory(
        booking_id=booking.id,
        old_status=None,
        new_status=BookingStatus.PENDING.value,
        changed_by_user_id=current_user.id,
        remarks="Booking request submitted by rider"
    )
    db.add(history)
    db.commit()
    db.refresh(booking)

    return _format_booking_response(booking)


@router.get("", response_model=List[BookingResponse])
def get_rider_bookings(
    current_user: User = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    bookings = db.query(Booking).filter(
        Booking.rider_id == current_user.id
    ).order_by(Booking.created_at.desc()).all()
    
    return [BookingResponse.model_validate(b) for b in bookings]


@router.get("/{booking_id}", response_model=BookingDetailResponse)
def get_booking_details(
    booking_id: int,
    current_user: User = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.rider_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return _format_booking_response(booking)


@router.post("/{booking_id}/agreement", response_model=BookingDetailResponse)
def submit_rental_agreement(
    booking_id: int,
    req: AgreementSubmitRequest,
    current_user: User = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.rider_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if booking.status != BookingStatus.AGREEMENT_REQUIRED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rental agreement cannot be submitted for booking in status '{booking.status}'."
        )

    # Save Agreement
    agreement = RentalAgreement(
        booking_id=booking.id,
        lessee_name=req.lessee_name,
        lessee_phone=req.lessee_phone,
        lessee_dob=req.lessee_dob,
        lessee_address=req.lessee_address,
        signature_data=req.signature_data,
        agreed_to_terms=req.agreed_to_terms,
        is_locked=True
    )
    db.add(agreement)
    db.flush()

    # Move to HANDOVER_REQUIRED
    transition_booking_status(
        db=db,
        booking=booking,
        new_status=BookingStatus.HANDOVER_REQUIRED.value,
        changed_by_user_id=current_user.id,
        remarks="Rental agreement signed and submitted. Proceed to EV Station for physical handover."
    )

    return _format_booking_response(booking)


@router.post("/{booking_id}/handover", response_model=BookingDetailResponse)
def submit_vehicle_handover(
    booking_id: int,
    req: HandoverSubmitRequest,
    current_user: User = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.status != BookingStatus.HANDOVER_REQUIRED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Handover cannot be completed in status '{booking.status}'."
        )

    handover = VehicleHandover(
        booking_id=booking.id,
        tyres_condition=req.tyres_condition,
        brakes_condition=req.brakes_condition,
        electricals_condition=req.electricals_condition,
        battery_percentage_at_handover=req.battery_percentage_at_handover,
        has_helmet=req.has_helmet,
        has_charger=req.has_charger,
        has_toolbox=req.has_toolbox,
        inspector_notes=req.inspector_notes
    )
    db.add(handover)
    db.flush()

    # Move to ACTIVE
    transition_booking_status(
        db=db,
        booking=booking,
        new_status=BookingStatus.ACTIVE.value,
        changed_by_user_id=current_user.id,
        remarks="Vehicle inspection completed and handed over. Ride is now ACTIVE!"
    )

    return _format_booking_response(booking)


@router.post("/{booking_id}/extension", response_model=BookingDetailResponse)
def request_booking_extension(
    booking_id: int,
    req: ExtensionCreateRequest,
    current_user: User = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking or booking.rider_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.status != BookingStatus.ACTIVE.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Extension can only be requested on an ACTIVE booking. Current: '{booking.status}'"
        )

    additional_amount = round(booking.daily_rate * req.requested_days, 2)
    ext = BookingExtension(
        booking_id=booking.id,
        requested_days=req.requested_days,
        additional_amount=additional_amount,
        reason=req.reason,
        status=RequestStatus.PENDING.value
    )
    db.add(ext)
    db.flush()

    transition_booking_status(
        db=db,
        booking=booking,
        new_status=BookingStatus.EXTENSION_REQUESTED.value,
        changed_by_user_id=current_user.id,
        remarks=f"Extension requested for {req.requested_days} additional days (₹{additional_amount})."
    )

    return _format_booking_response(booking)


@router.post("/{booking_id}/vehicle-change", response_model=BookingDetailResponse)
def request_vehicle_change(
    booking_id: int,
    req: VehicleChangeCreateRequest,
    current_user: User = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking or booking.rider_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.status != BookingStatus.ACTIVE.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle replacement can only be requested on an ACTIVE booking. Current: '{booking.status}'"
        )

    v_change = VehicleChangeRequest(
        booking_id=booking.id,
        reason=req.reason,
        preferred_payment_mode=req.preferred_payment_mode,
        pre_existing_damage_remarks=req.pre_existing_damage_remarks,
        status=RequestStatus.PENDING.value
    )
    db.add(v_change)
    db.flush()

    transition_booking_status(
        db=db,
        booking=booking,
        new_status=BookingStatus.VEHICLE_CHANGE_REQUESTED.value,
        changed_by_user_id=current_user.id,
        remarks=f"Vehicle replacement requested. Reason: {req.reason}"
    )

    return _format_booking_response(booking)


@router.post("/{booking_id}/return", response_model=BookingDetailResponse)
def initiate_return_and_settlement(
    booking_id: int,
    current_user: User = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking or booking.rider_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.status not in [BookingStatus.ACTIVE.value, BookingStatus.EXTENSION_REQUESTED.value, BookingStatus.VEHICLE_CHANGE_REQUESTED.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot initiate return from status '{booking.status}'."
        )

    # Move to RETURN_PENDING
    transition_booking_status(
        db=db,
        booking=booking,
        new_status=BookingStatus.RETURN_PENDING.value,
        changed_by_user_id=current_user.id,
        remarks="Vehicle return initiated by rider. Station generating final settlement statement."
    )

    # Compute settlement numbers
    now = datetime.now(timezone.utc)
    # Sum approved extensions
    approved_extensions_total = sum(
        ext.additional_amount for ext in booking.extensions if ext.status == RequestStatus.APPROVED.value
    )

    settlement_data = compute_settlement_figures(
        base_rental=booking.rental_amount,
        extension_amount=approved_extensions_total,
        damage_charges=0.0,
        end_date=booking.end_date,
        return_date=now,
        security_deposit=booking.deposit_amount,
        other_charges=0.0
    )

    # Upsert final settlement
    existing_settlement = db.query(FinalSettlement).filter(FinalSettlement.booking_id == booking.id).first()
    if existing_settlement:
        for k, v in settlement_data.items():
            setattr(existing_settlement, k, v)
    else:
        settlement = FinalSettlement(
            booking_id=booking.id,
            **settlement_data
        )
        db.add(settlement)

    # Move to SETTLEMENT_PENDING
    transition_booking_status(
        db=db,
        booking=booking,
        new_status=BookingStatus.SETTLEMENT_PENDING.value,
        changed_by_user_id=current_user.id,
        remarks="Final settlement statement generated for rider acknowledgement."
    )

    return _format_booking_response(booking)


@router.post("/{booking_id}/settlement-acknowledge", response_model=BookingDetailResponse)
def acknowledge_final_settlement(
    booking_id: int,
    req: FinalSettlementAcknowledgeRequest,
    current_user: User = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking or booking.rider_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.status != BookingStatus.SETTLEMENT_PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Settlement cannot be acknowledged in status '{booking.status}'."
        )

    if not req.rider_acknowledged:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must acknowledge and accept the final settlement details to close the booking."
        )

    settlement = db.query(FinalSettlement).filter(FinalSettlement.booking_id == booking.id).first()
    if settlement:
        settlement.rider_acknowledged = True
        settlement.acknowledged_at = datetime.now(timezone.utc)
        settlement.closed_at = datetime.now(timezone.utc)

    # Transition to COMPLETED
    transition_booking_status(
        db=db,
        booking=booking,
        new_status=BookingStatus.COMPLETED.value,
        changed_by_user_id=current_user.id,
        remarks="Final settlement accepted by rider. Booking closed successfully!"
    )

    return _format_booking_response(booking)
