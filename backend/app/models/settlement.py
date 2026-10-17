from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class RequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class PaymentMode(str, enum.Enum):
    CASH = "CASH"
    ONLINE = "ONLINE"


class BookingExtension(Base):
    __tablename__ = "booking_extensions"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    requested_days = Column(Integer, nullable=False)
    additional_amount = Column(Float, nullable=False)
    reason = Column(String(255), nullable=True)
    status = Column(String(20), default=RequestStatus.PENDING.value, nullable=False)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    reviewed_at = Column(DateTime, nullable=True)

    booking = relationship("Booking", back_populates="extensions")


class VehicleChangeRequest(Base):
    __tablename__ = "vehicle_change_requests"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    reason = Column(Text, nullable=False)
    preferred_payment_mode = Column(String(20), default=PaymentMode.ONLINE.value, nullable=False)
    pre_existing_damage_remarks = Column(Text, nullable=True)
    status = Column(String(20), default=RequestStatus.PENDING.value, nullable=False)
    new_vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    booking = relationship("Booking", back_populates="change_requests")


class FinalSettlement(Base):
    __tablename__ = "final_settlements"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    base_rental_amount = Column(Float, default=0.0, nullable=False)
    extension_amount = Column(Float, default=0.0, nullable=False)
    damage_charges = Column(Float, default=0.0, nullable=False)
    damage_notes = Column(Text, nullable=True)
    late_days = Column(Integer, default=0, nullable=False)
    late_charges = Column(Float, default=0.0, nullable=False)
    other_charges = Column(Float, default=0.0, nullable=False)
    
    security_deposit_held = Column(Float, default=0.0, nullable=False)
    refund_amount = Column(Float, default=0.0, nullable=False)
    net_payable_amount = Column(Float, default=0.0, nullable=False)
    
    rider_acknowledged = Column(Boolean, default=False, nullable=False)
    acknowledged_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)

    booking = relationship("Booking", back_populates="settlement")
