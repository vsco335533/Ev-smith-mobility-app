from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class StationResponse(BaseModel):
    id: int
    name: str
    code: str
    address: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_number: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class VehicleResponse(BaseModel):
    id: int
    station_id: int
    station_name: Optional[str] = None
    make: str
    model: str
    variant: str
    registration_number: str
    chassis_number: str
    battery_percentage: int
    range_km: int
    top_speed_kmh: int
    daily_rate: float
    deposit_amount: float
    status: str
    image_url: str
    features: Optional[str] = None

    class Config:
        from_attributes = True


class VehicleDetailResponse(VehicleResponse):
    station: Optional[StationResponse] = None


class VehicleCreateRequest(BaseModel):
    station_id: int
    make: str
    model: str
    variant: str = "Standard"
    registration_number: str
    chassis_number: str
    battery_percentage: int = 100
    range_km: int = 100
    top_speed_kmh: int = 80
    daily_rate: float
    deposit_amount: float
    status: str = "AVAILABLE"
    image_url: str
    features: Optional[str] = None


class VehicleUpdateRequest(BaseModel):
    station_id: Optional[int] = None
    make: Optional[str] = None
    model: Optional[str] = None
    variant: Optional[str] = None
    registration_number: Optional[str] = None
    chassis_number: Optional[str] = None
    battery_percentage: Optional[int] = None
    range_km: Optional[int] = None
    top_speed_kmh: Optional[int] = None
    daily_rate: Optional[float] = None
    deposit_amount: Optional[float] = None
    status: Optional[str] = None
    image_url: Optional[str] = None
    features: Optional[str] = None

