from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class RentalAgreement(Base):
    __tablename__ = "rental_agreements"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    lessor_name = Column(String(100), default="EVSmith Mobility Services", nullable=False)
    lessor_address = Column(String(255), default="HITEC City Main Hub, Hyderabad, Telangana, 500081", nullable=False)
    
    lessee_name = Column(String(255), nullable=False)
    lessee_phone = Column(String(20), nullable=False)
    lessee_dob = Column(String(20), nullable=True)
    lessee_address = Column(String(500), nullable=False)
    
    terms_version = Column(String(20), default="v1.0-TS-2026", nullable=False)
    signature_data = Column(Text, nullable=False)  # Base64 SVG or image data URL
    is_locked = Column(Boolean, default=True, nullable=False)
    agreed_to_terms = Column(Boolean, default=True, nullable=False)
    signed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    ip_address = Column(String(50), nullable=True)

    booking = relationship("Booking", back_populates="agreement")
