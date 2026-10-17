from datetime import datetime, timezone, timedelta
from app.services.pricing_service import compute_settlement_figures


def test_on_time_return_settlement():
    start = datetime.now(timezone.utc)
    end = start + timedelta(days=7)
    return_time = end - timedelta(hours=1)  # Returned early

    figures = compute_settlement_figures(
        base_rental=2450.0,
        extension_amount=0.0,
        damage_charges=0.0,
        end_date=end,
        return_date=return_time,
        security_deposit=2000.0,
        other_charges=0.0
    )

    assert figures["late_days"] == 0
    assert figures["late_charges"] == 0.0
    assert figures["refund_amount"] == 2000.0
    assert figures["net_payable_amount"] == 0.0


def test_late_return_settlement():
    start = datetime.now(timezone.utc)
    end = start + timedelta(days=7)
    return_time = end + timedelta(days=3)  # 3 days late

    figures = compute_settlement_figures(
        base_rental=2450.0,
        extension_amount=0.0,
        damage_charges=500.0,  # Minor scratch
        end_date=end,
        return_date=return_time,
        security_deposit=2000.0,
        other_charges=0.0
    )

    assert figures["late_days"] == 3
    assert figures["late_charges"] == 300.0  # 3 * ₹100
    # Total deductions: 500 + 300 = 800. Refund from 2000 deposit = 1200.
    assert figures["refund_amount"] == 1200.0
    assert figures["net_payable_amount"] == 0.0
