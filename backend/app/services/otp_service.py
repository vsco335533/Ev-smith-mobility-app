import random
import time
import logging
from typing import Dict, Tuple, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger("evsmith.otp")

# In-memory OTP store: email -> (otp, expiry_timestamp, attempts)
_otp_store: Dict[str, Tuple[str, float, int]] = {}

OTP_EXPIRY_SECONDS = 300  # 5 minutes
MAX_ATTEMPTS = 5


def generate_otp(email: str) -> Tuple[str, bool]:
    """
    Generates a 6-digit OTP, stores it with expiry, and dispatches it.
    Returns (otp, is_sandbox).
    """
    otp = f"{random.randint(100000, 999999)}"
    expiry = time.time() + OTP_EXPIRY_SECONDS
    _otp_store[email.lower()] = (otp, expiry, 0)

    is_sandbox = True

    if settings.BRAVO_API_KEY and settings.BRAVO_API_KEY.strip():
        try:
            # Check if this is a Brevo API key (starts with xkeysib-) or Brevo URL
            is_brevo = settings.BRAVO_API_KEY.strip().startswith("xkeysib-") or "brevo.com" in settings.BRAVO_API_URL.lower()

            if is_brevo:
                url = settings.BRAVO_API_URL if "brevo.com" in settings.BRAVO_API_URL.lower() else "https://api.brevo.com/v3/smtp/email"
                headers = {
                    "api-key": settings.BRAVO_API_KEY.strip(),
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
                # Brevo templateId must be an integer if numeric
                template_id_val = settings.BRAVO_EMAIL_TEMPLATE_ID.strip() if settings.BRAVO_EMAIL_TEMPLATE_ID else "1"
                template_id = int(template_id_val) if template_id_val.isdigit() else 1
                payload = {
                    "to": [{"email": email}],
                    "templateId": template_id,
                    "params": {
                        "otp": otp,
                        "platform": "EVSMITH Mobility Services",
                        "expiry_minutes": 5
                    }
                }
            else:
                url = settings.BRAVO_API_URL
                headers = {
                    "Authorization": f"Bearer {settings.BRAVO_API_KEY}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "to": email,
                    "template_id": settings.BRAVO_EMAIL_TEMPLATE_ID,
                    "params": {
                        "otp": otp,
                        "platform": "EVSMITH Mobility Services",
                        "expiry_minutes": 5
                    }
                }

            with httpx.Client(timeout=10.0) as client:
                res = client.post(url, json=payload, headers=headers)
                if res.is_success:
                    logger.info(f"Brevo/Bravo OTP successfully sent to {email}")
                    is_sandbox = False
                else:
                    logger.warning(f"Bravo/Brevo API responded with status {res.status_code}: {res.text}. Falling back to sandbox logging.")
        except Exception as e:
            logger.error(f"Error dispatching Bravo/Brevo OTP: {e}. Falling back to sandbox logging.")

    if is_sandbox:
        print(f"\n=======================================================")
        print(f" [EVSMITH BRAVO OTP SANDBOX] To: {email} | OTP: {otp}")
        print(f"=======================================================\n")
        logger.info(f"[EVSMITH BRAVO OTP SANDBOX] OTP for {email} is: {otp}")

    return otp, is_sandbox


def verify_otp(email: str, entered_otp: str) -> Tuple[bool, str]:
    email_key = email.lower()
    if email_key not in _otp_store:
        return False, "No OTP request found for this email or OTP expired."

    otp, expiry, attempts = _otp_store[email_key]

    if time.time() > expiry:
        del _otp_store[email_key]
        return False, "OTP has expired. Please request a new code."

    if attempts >= MAX_ATTEMPTS:
        del _otp_store[email_key]
        return False, "Too many failed attempts. Please request a new OTP."

    if entered_otp.strip() != otp:
        _otp_store[email_key] = (otp, expiry, attempts + 1)
        remaining = MAX_ATTEMPTS - (attempts + 1)
        return False, f"Incorrect OTP. {remaining} attempt(s) remaining."

    # OTP is valid!
    del _otp_store[email_key]
    return True, "Email verified successfully."
