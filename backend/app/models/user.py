from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    RIDER = "RIDER"
    SUPER_ADMIN = "SUPER_ADMIN"


class DocVerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class DocumentType(str, enum.Enum):
    AADHAAR = "AADHAAR"
    PAN = "PAN"
    DRIVING_LICENCE = "DRIVING_LICENCE"


class AddressType(str, enum.Enum):
    CURRENT = "CURRENT"
    PERMANENT = "PERMANENT"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default=UserRole.RIDER.value, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    must_change_password = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    profile = relationship("RiderProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("IdentityDocument", back_populates="user", cascade="all, delete-orphan")
    emergency_contact = relationship("EmergencyContact", back_populates="user", uselist=False, cascade="all, delete-orphan")
    declaration = relationship("RiderDeclaration", back_populates="user", uselist=False, cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="rider")


class RiderProfile(Base):
    __tablename__ = "rider_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    dob = Column(String(20), nullable=True)
    gender = Column(String(20), nullable=True)
    occupation = Column(String(100), nullable=True)
    employer_id = Column(String(100), nullable=True)
    alt_phone = Column(String(20), nullable=True)
    is_profile_complete = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="profile")


class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    address_type = Column(String(20), default=AddressType.CURRENT.value, nullable=False)
    line = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(20), nullable=False)
    country = Column(String(100), default="India", nullable=False)
    is_same_as_current = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="addresses")


class IdentityDocument(Base):
    __tablename__ = "identity_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String(30), nullable=False)
    document_number = Column(String(100), nullable=False)
    cloudinary_public_id = Column(String(255), nullable=True)
    secure_url = Column(String(500), nullable=False)
    verification_status = Column(String(20), default=DocVerificationStatus.PENDING.value, nullable=False)
    rejection_reason = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    verified_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="documents")


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    reference_name = Column(String(255), nullable=False)
    reference_phone = Column(String(20), nullable=False)
    emergency_name = Column(String(255), nullable=False)
    emergency_phone = Column(String(20), nullable=False)

    user = relationship("User", back_populates="emergency_contact")


class RiderDeclaration(Base):
    __tablename__ = "riders_declarations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    agreed = Column(Boolean, default=False, nullable=False)
    declaration_text = Column(Text, nullable=False)
    ip_address = Column(String(50), nullable=True)
    signed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="declaration")
