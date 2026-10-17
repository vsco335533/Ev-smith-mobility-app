from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.booking import Booking, BookingStatusHistory, BookingStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.audit import AuditLog, Notification

# Valid transition graph
ALLOWED_TRANSITIONS = {
    BookingStatus.PENDING.value: [
        BookingStatus.UNDER_REVIEW.value,
        BookingStatus.CANCELLED.value,
        BookingStatus.REJECTED.value
    ],
    BookingStatus.UNDER_REVIEW.value: [
        BookingStatus.APPROVED.value,
        BookingStatus.REJECTED.value,
        BookingStatus.CANCELLED.value
    ],
    BookingStatus.APPROVED.value: [
        BookingStatus.AGREEMENT_REQUIRED.value,
        BookingStatus.CANCELLED.value
    ],
    BookingStatus.AGREEMENT_REQUIRED.value: [
        BookingStatus.HANDOVER_REQUIRED.value,
        BookingStatus.CANCELLED.value
    ],
    BookingStatus.HANDOVER_REQUIRED.value: [
        BookingStatus.ACTIVE.value,
        BookingStatus.CANCELLED.value
    ],
    BookingStatus.ACTIVE.value: [
        BookingStatus.EXTENSION_REQUESTED.value,
        BookingStatus.VEHICLE_CHANGE_REQUESTED.value,
        BookingStatus.RETURN_PENDING.value
    ],
    BookingStatus.EXTENSION_REQUESTED.value: [
        BookingStatus.ACTIVE.value,
        BookingStatus.RETURN_PENDING.value
    ],
    BookingStatus.VEHICLE_CHANGE_REQUESTED.value: [
        BookingStatus.ACTIVE.value,
        BookingStatus.RETURN_PENDING.value
    ],
    BookingStatus.RETURN_PENDING.value: [
        BookingStatus.SETTLEMENT_PENDING.value
    ],
    BookingStatus.SETTLEMENT_PENDING.value: [
        BookingStatus.COMPLETED.value
    ],
    BookingStatus.COMPLETED.value: [],
    BookingStatus.REJECTED.value: [],
    BookingStatus.CANCELLED.value: []
}


def transition_booking_status(
    db: Session,
    booking: Booking,
    new_status: str,
    changed_by_user_id: int,
    remarks: str = None
) -> Booking:
    old_status = booking.status

    # Validate transition
    valid_targets = ALLOWED_TRANSITIONS.get(old_status, [])
    if new_status not in valid_targets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid booking status transition from '{old_status}' to '{new_status}'. Allowed: {valid_targets}"
        )

    # Apply status change
    booking.status = new_status
    booking.updated_at = datetime.now(timezone.utc)

    # Sync vehicle status
    if new_status == BookingStatus.ACTIVE.value:
        vehicle = db.query(Vehicle).filter(Vehicle.id == booking.vehicle_id).first()
        if vehicle:
            vehicle.status = VehicleStatus.RENTED.value
    elif new_status in [BookingStatus.COMPLETED.value, BookingStatus.CANCELLED.value, BookingStatus.REJECTED.value]:
        vehicle = db.query(Vehicle).filter(Vehicle.id == booking.vehicle_id).first()
        if vehicle:
            vehicle.status = VehicleStatus.AVAILABLE.value

    # Record history
    history = BookingStatusHistory(
        booking_id=booking.id,
        old_status=old_status,
        new_status=new_status,
        changed_by_user_id=changed_by_user_id,
        remarks=remarks or f"Transitioned from {old_status} to {new_status}"
    )
    db.add(history)

    # Record audit log
    audit = AuditLog(
        user_id=changed_by_user_id,
        action=f"BOOKING_STATUS_CHANGED_{new_status}",
        entity="BOOKING",
        entity_id=str(booking.id),
        details=f"Status changed from {old_status} to {new_status}. Remarks: {remarks}"
    )
    db.add(audit)

    # Create user notification
    notif = Notification(
        user_id=booking.rider_id,
        title=f"Booking Status Update: {new_status.replace('_', ' ').title()}",
        message=remarks or f"Your booking #{booking.booking_number} is now {new_status.replace('_', ' ').title()}.",
        notification_type="BOOKING"
    )
    db.add(notif)

    db.commit()
    db.refresh(booking)
    return booking
