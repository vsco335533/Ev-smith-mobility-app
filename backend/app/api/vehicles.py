from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.vehicle import Vehicle, Station, VehicleStatus
from app.schemas.vehicle import VehicleResponse, VehicleDetailResponse, StationResponse
from app.schemas.booking import CalculatePriceRequest, CalculatePriceResponse
from app.services.pricing_service import calculate_rental_quote

router = APIRouter(prefix="/vehicles", tags=["Fleet & Stations"])


@router.get("/stations", response_model=List[StationResponse])
def list_stations(db: Session = Depends(get_db)):
    stations = db.query(Station).filter(Station.is_active == True).all()
    return stations


@router.get("", response_model=List[VehicleResponse])
def list_vehicles(
    station_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    query = db.query(Vehicle)
    if station_id:
        query = query.filter(Vehicle.station_id == station_id)
    if status_filter:
        query = query.filter(Vehicle.status == status_filter)
    
    vehicles = query.all()
    results = []
    for v in vehicles:
        resp = VehicleResponse.model_validate(v)
        if v.station:
            resp.station_name = v.station.name
        results.append(resp)
    return results


@router.get("/{vehicle_id}", response_model=VehicleDetailResponse)
def get_vehicle_details(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    resp = VehicleDetailResponse.model_validate(vehicle)
    if vehicle.station:
        resp.station_name = vehicle.station.name
        resp.station = StationResponse.model_validate(vehicle.station)
    return resp


@router.post("/calculate-quote", response_model=CalculatePriceResponse)
def get_price_calculation(req: CalculatePriceRequest, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == req.vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    quote = calculate_rental_quote(vehicle, req.duration_days, req.start_date)
    return CalculatePriceResponse(**quote)
