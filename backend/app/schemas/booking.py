from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.vehicle import VehicleResponse, StationResponse


class CalculatePriceRequest(BaseModel):
    vehicle_id: int
    duration_days: int = Field(default=7, ge=1, le=365)
    start_date: Optional[datetime] = None


class CalculatePriceResponse(BaseModel):
    vehicle_id: int
    duration_days: int
    daily_rate: float
    rental_amount: float
    deposit_amount: float
    total_amount: float
    start_date: datetime
    end_date: datetime


class CreateBookingRequest(BaseModel):
    vehicle_id: int
    station_id: int
    duration_days: int = Field(default=7, ge=1)
    start_date: Optional[datetime] = None
    notes: Optional[str] = None


class AgreementSubmitRequest(BaseModel):
    lessee_name: str
    lessee_phone: str
    lessee_dob: Optional[str] = None
    lessee_address: str
    signature_data: str = Field(..., description="Digital signature base64/SVG")
    agreed_to_terms: bool = True


class HandoverSubmitRequest(BaseModel):
    tyres_condition: str = Field(default="GOOD", description="GOOD or DAMAGED")
    brakes_condition: str = Field(default="GOOD", description="GOOD or DAMAGED")
    electricals_condition: str = Field(default="WORKING", description="WORKING or NOT_WORKING")
    battery_percentage_at_handover: int = Field(default=100, ge=0, le=100)
    has_helmet: bool = True
    has_charger: bool = True
    has_toolbox: bool = True
    inspector_notes: Optional[str] = None


class ExtensionCreateRequest(BaseModel):
    requested_days: int = Field(..., ge=1)
    reason: Optional[str] = None


class VehicleChangeCreateRequest(BaseModel):
    reason: str = Field(..., min_length=5)
    preferred_payment_mode: str = "ONLINE"
    pre_existing_damage_remarks: Optional[str] = None


class FinalSettlementReviewRequest(BaseModel):
    damage_charges: float = 0.0
    damage_notes: Optional[str] = None
    other_charges: float = 0.0


class FinalSettlementAcknowledgeRequest(BaseModel):
    rider_acknowledged: bool = True


class AdminStatusUpdateRequest(BaseModel):
    status: str
    remarks: Optional[str] = None


class StatusHistoryItem(BaseModel):
    id: int
    old_status: Optional[str] = None
    new_status: str
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AgreementDetailResponse(BaseModel):
    id: int
    lessor_name: str
    lessor_address: str
    lessee_name: str
    lessee_phone: str
    lessee_dob: Optional[str] = None
    lessee_address: str
    terms_version: str
    signed_at: datetime
    is_locked: bool

    class Config:
        from_attributes = True


class HandoverDetailResponse(BaseModel):
    id: int
    tyres_condition: str
    brakes_condition: str
    electricals_condition: str
    battery_percentage_at_handover: int
    has_helmet: bool
    has_charger: bool
    has_toolbox: bool
    inspector_notes: Optional[str] = None
    handover_timestamp: datetime

    class Config:
        from_attributes = True


class ExtensionDetailResponse(BaseModel):
    id: int
    requested_days: int
    additional_amount: float
    reason: Optional[str] = None
    status: str
    admin_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SettlementDetailResponse(BaseModel):
    id: int
    base_rental_amount: float
    extension_amount: float
    damage_charges: float
    damage_notes: Optional[str] = None
    late_days: int
    late_charges: float
    other_charges: float
    security_deposit_held: float
    refund_amount: float
    net_payable_amount: float
    rider_acknowledged: bool
    acknowledged_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RiderBasicInfo(BaseModel):
    id: int
    email: str
    phone: str
    full_name: Optional[str] = None
    dob: Optional[str] = None
    is_profile_complete: bool = False
    verification_status: Optional[str] = None

    class Config:
        from_attributes = True


class BookingResponse(BaseModel):
    id: int
    booking_number: str
    rider_id: int
    vehicle_id: int
    station_id: int
    status: str
    start_date: datetime
    end_date: datetime
    duration_days: int
    daily_rate: float
    rental_amount: float
    deposit_amount: float
    total_amount: float
    created_at: datetime
    approved_at: Optional[datetime] = None
    vehicle: Optional[VehicleResponse] = None
    station: Optional[StationResponse] = None
    rider: Optional[RiderBasicInfo] = None

    class Config:
        from_attributes = True


class BookingDetailResponse(BookingResponse):
    status_history: List[StatusHistoryItem] = []
    agreement: Optional[AgreementDetailResponse] = None
    handover: Optional[HandoverDetailResponse] = None
    extensions: List[ExtensionDetailResponse] = []
    settlement: Optional[SettlementDetailResponse] = None

