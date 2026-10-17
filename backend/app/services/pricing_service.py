from datetime import datetime, timedelta, timezone
from typing import Dict, Any
from app.core.config import settings
from app.models.vehicle import Vehicle


def calculate_rental_quote(vehicle: Vehicle, duration_days: int, start_date: datetime = None) -> Dict[str, Any]:
    if not start_date:
        start_date = datetime.now(timezone.utc)
        
    end_date = start_date + timedelta(days=duration_days)
    
    daily_rate = vehicle.daily_rate
    rental_amount = round(daily_rate * duration_days, 2)
    deposit_amount = round(vehicle.deposit_amount, 2)
    total_amount = round(rental_amount + deposit_amount, 2)
    
    return {
        "vehicle_id": vehicle.id,
        "daily_rate": daily_rate,
        "duration_days": duration_days,
        "start_date": start_date,
        "end_date": end_date,
        "rental_amount": rental_amount,
        "deposit_amount": deposit_amount,
        "total_amount": total_amount
    }


def compute_settlement_figures(
    base_rental: float,
    extension_amount: float,
    damage_charges: float,
    end_date: datetime,
    return_date: datetime,
    security_deposit: float,
    other_charges: float = 0.0
) -> Dict[str, Any]:
    # Normalize datetime timezones to avoid TypeError: can't compare offset-naive and offset-aware datetimes
    if end_date.tzinfo is None:
        end_date = end_date.replace(tzinfo=timezone.utc)
    if return_date.tzinfo is None:
        return_date = return_date.replace(tzinfo=timezone.utc)

    # Calculate late days
    late_days = 0
    if return_date > end_date:
        delta = return_date - end_date
        late_days = max(0, delta.days)
        # If there are fractional hours greater than 2 hours grace period, count as another day
        if delta.seconds > 7200 and delta.days == 0:
            late_days = 1

    late_charges = round(late_days * settings.LATE_RETURN_DAILY_RATE, 2)
    
    total_dues = round(base_rental + extension_amount + damage_charges + late_charges + other_charges, 2)
    
    # Net calculation: if security deposit > dues, refund. If dues > deposit, net payable.
    # In rentals, base_rental is usually paid upfront, but let's calculate the deduction from deposit:
    # Deductions from security deposit: damage + late + other
    total_deductions = round(damage_charges + late_charges + other_charges, 2)
    
    if security_deposit >= total_deductions:
        refund_amount = round(security_deposit - total_deductions, 2)
        net_payable_amount = 0.0
    else:
        refund_amount = 0.0
        net_payable_amount = round(total_deductions - security_deposit, 2)

    return {
        "base_rental_amount": base_rental,
        "extension_amount": extension_amount,
        "damage_charges": damage_charges,
        "late_days": late_days,
        "late_charges": late_charges,
        "other_charges": other_charges,
        "security_deposit_held": security_deposit,
        "refund_amount": refund_amount,
        "net_payable_amount": net_payable_amount
    }
