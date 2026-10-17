from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    AGREEMENT_REQUIRED = "AGREEMENT_REQUIRED"
    HANDOVER_REQUIRED = "HANDOVER_REQUIRED"
    ACTIVE = "ACTIVE"
    EXTENSION_REQUESTED = "EXTENSION_REQUESTED"
    VEHICLE_CHANGE_REQUESTED = "VEHICLE_CHANGE_REQUESTED"
    RETURN_PENDING = "RETURN_PENDING"
    SETTLEMENT_PENDING = "SETTLEMENT_PENDING"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class ConditionStatus(str, enum.Enum):
    GOOD = "GOOD"
    DAMAGED = "DAMAGED"


class ElectricalCondition(str, enum.Enum):
    WORKING = "WORKING"
    NOT_WORKING = "NOT_WORKING"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_number = Column(String(50), unique=True, index=True, nullable=False)
    rider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    status = Column(String(30), default=BookingStatus.PENDING.value, nullable=False)
    
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    duration_days = Column(Integer, default=7, nullable=False)
    
    daily_rate = Column(Float, nullable=False)
    rental_amount = Column(Float, nullable=False)
    deposit_amount = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    rider = relationship("User", back_populates="bookings")
    vehicle = relationship("Vehicle", back_populates="bookings")
    station = relationship("Station", back_populates="bookings")
    status_history = relationship("BookingStatusHistory", back_populates="booking", cascade="all, delete-orphan", order_by="BookingStatusHistory.created_at.desc()")
    agreement = relationship("RentalAgreement", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    handover = relationship("VehicleHandover", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    extensions = relationship("BookingExtension", back_populates="booking", cascade="all, delete-orphan")
    change_requests = relationship("VehicleChangeRequest", back_populates="booking", cascade="all, delete-orphan")
    settlement = relationship("FinalSettlement", back_populates="booking", uselist=False, cascade="all, delete-orphan")


class BookingStatusHistory(Base):
    __tablename__ = "booking_status_history"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    old_status = Column(String(30), nullable=True)
    new_status = Column(String(30), nullable=False)
    changed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    booking = relationship("Booking", back_populates="status_history")


class VehicleHandover(Base):
    __tablename__ = "vehicle_handovers"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Inspection Items
    tyres_condition = Column(String(20), default=ConditionStatus.GOOD.value, nullable=False)
    brakes_condition = Column(String(20), default=ConditionStatus.GOOD.value, nullable=False)
    electricals_condition = Column(String(20), default=ElectricalCondition.WORKING.value, nullable=False)
    battery_percentage_at_handover = Column(Integer, default=100, nullable=False)
    
    # Accessories
    has_helmet = Column(Boolean, default=True, nullable=False)
    has_charger = Column(Boolean, default=True, nullable=False)
    has_toolbox = Column(Boolean, default=True, nullable=False)
    
    inspector_notes = Column(Text, nullable=True)
    handover_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    booking = relationship("Booking", back_populates="handover")
