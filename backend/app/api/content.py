from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.core.database import get_db
from app.models.app_content import AppContent

router = APIRouter(prefix="/content", tags=["App Dynamic Content & CMS"])

DEFAULT_PAGES = {
    "welcome": {
        "page_key": "welcome",
        "title": "EARN WITH ELECTRIC",
        "subtitle": "Trusted Local EV Rental in Hyderabad",
        "image_url": "https://maxtronev.com/assets/Blog30-Bt25-yDw.webp",
        "content_data": {
            "brand_logo_url": "https://ev-smith-mobility-app.onrender.com/static/uploads/App-logo.jpeg",
            "brand_name": "EVSMITH",
            "brand_accent": "MOBILITY",
            "tagline": "Trusted Local EV Rental in Hyderabad",
            "cta_button": "Get Started",
            "login_button": "I have an account",
            "feature_1_title": "Fast KYC Approval",
            "feature_1_desc": "Instant identity and DL verification within minutes.",
            "feature_2_title": "Smart Battery Telemetry",
            "feature_2_desc": "Live range monitoring and seamless battery management.",
            "feature_3_title": "Zero Maintenance Hassle",
            "feature_3_desc": "Comprehensive roadside support and station assistance."
        }
    },
    "fleet": {
        "page_key": "fleet",
        "title": "Explore EVSMITH Fleet",
        "subtitle": "Choose your premium electric scooter. Fully charged and ready for immediate pickup.",
        "image_url": "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80",
        "content_data": {
            "banner_text": "⚡ Special Offer: Save on weekly & monthly rentals!",
            "support_phone": "+91 98765 43210"
        }
    },
    "agreement": {
        "page_key": "agreement",
        "title": "EVSMITH Rental & Lease Agreement",
        "subtitle": "Terms, conditions, and liability policies governing commercial EV scooter rentals.",
        "content_data": {
            "jurisdiction": "Hyderabad, Telangana, India",
            "terms_version": "v2.6-legal",
            "clause_summary": "All riders are covered by standard third-party insurance and 24/7 breakdown assistance."
        }
    },
    "support": {
        "page_key": "support",
        "title": "24/7 EVSMITH Station & Helpline",
        "subtitle": "Need vehicle swap, maintenance, or rental extension assistance? We are here.",
        "content_data": {
            "support_email": "support@evsmith.com",
            "support_phone": "+91 98765 43210",
            "headquarters": "Plot 42, Hitech City Main Road, Madhapur, Hyderabad - 500081"
        }
    }
}


@router.get("")
def get_all_public_content(db: Session = Depends(get_db)) -> Dict[str, Any]:
    records = db.query(AppContent).all()
    results = dict(DEFAULT_PAGES)
    for r in records:
        default_p = DEFAULT_PAGES.get(r.page_key, {})
        results[r.page_key] = {
            "page_key": r.page_key,
            "title": r.title if r.title is not None else default_p.get("title"),
            "subtitle": r.subtitle if r.subtitle is not None else default_p.get("subtitle"),
            "image_url": r.image_url if r.image_url is not None else default_p.get("image_url"),
            "content_data": {
                **default_p.get("content_data", {}),
                **(r.content_data or {})
            },
            "updated_at": r.updated_at.isoformat() if r.updated_at else None
        }
    return results


@router.get("/{page_key}")
def get_page_content(page_key: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    record = db.query(AppContent).filter(AppContent.page_key == page_key).first()
    default_val = DEFAULT_PAGES.get(page_key, {
        "page_key": page_key,
        "title": page_key.title(),
        "subtitle": "",
        "image_url": "",
        "content_data": {}
    })
    if not record:
        return default_val

    return {
        "page_key": record.page_key,
        "title": record.title if record.title is not None else default_val.get("title"),
        "subtitle": record.subtitle if record.subtitle is not None else default_val.get("subtitle"),
        "image_url": record.image_url if record.image_url is not None else default_val.get("image_url"),
        "content_data": {
            **default_val.get("content_data", {}),
            **(record.content_data or {})
        },
        "updated_at": record.updated_at.isoformat() if record.updated_at else None
    }
