from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class VehicleStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    RENTED = "RENTED"
    MAINTENANCE = "MAINTENANCE"
    RESERVED = "RESERVED"


class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, index=True, nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(50), default="Hyderabad", nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    contact_number = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    vehicles = relationship("Vehicle", back_populates="station")
    bookings = relationship("Booking", back_populates="station")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    make = Column(String(50), default="EVSMITH", nullable=False)
    model = Column(String(50), nullable=False)
    variant = Column(String(50), default="Pro Edition", nullable=False)
    registration_number = Column(String(30), unique=True, index=True, nullable=False)
    chassis_number = Column(String(50), unique=True, nullable=False)
    battery_percentage = Column(Integer, default=100, nullable=False)
    range_km = Column(Integer, default=120, nullable=False)
    top_speed_kmh = Column(Integer, default=85, nullable=False)
    daily_rate = Column(Float, default=350.0, nullable=False)
    deposit_amount = Column(Float, default=2000.0, nullable=False)
    status = Column(String(30), default=VehicleStatus.AVAILABLE.value, nullable=False)
    image_url = Column(String(500), nullable=False)
    features = Column(Text, nullable=True)  # Comma-separated or JSON string
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    station = relationship("Station", back_populates="vehicles")
    bookings = relationship("Booking", back_populates="vehicle")
