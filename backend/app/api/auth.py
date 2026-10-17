from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user
)
from app.models.user import User, RiderProfile, UserRole
from app.schemas.auth import (
    SendOTPRequest, SendOTPResponse,
    VerifyOTPRequest, VerifyOTPResponse,
    RegisterRequest, LoginRequest,
    TokenResponse, RefreshTokenRequest,
    ChangePasswordRequest
)
from app.services.otp_service import generate_otp, verify_otp

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/send-otp", response_model=SendOTPResponse)
def handle_send_otp(req: SendOTPRequest):
    otp, is_sandbox = generate_otp(req.email)
    return SendOTPResponse(
        success=True,
        message=f"OTP sent to {req.email}",
        email=req.email,
        is_sandbox=is_sandbox,
        sandbox_otp=otp if is_sandbox else None
    )


@router.post("/verify-otp", response_model=VerifyOTPResponse)
def handle_verify_otp(req: VerifyOTPRequest):
    valid, message = verify_otp(req.email, req.otp)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    return VerifyOTPResponse(
        success=True,
        message=message,
        email=req.email,
        verified=True
    )


@router.post("/register", response_model=TokenResponse)
def handle_register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter((User.email == req.email) | (User.phone == req.phone)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email or mobile number already exists."
        )

    # Initial default password is the registered mobile number (hashed securely with bcrypt)
    hashed_pwd = get_password_hash(req.phone)

    user = User(
        email=req.email.lower(),
        phone=req.phone,
        password_hash=hashed_pwd,
        role=UserRole.RIDER.value,
        must_change_password=True,
        is_active=True
    )
    db.add(user)
    db.flush()

    # Create initial RiderProfile with imported registration data
    profile = RiderProfile(
        user_id=user.id,
        full_name=req.full_name,
        is_profile_complete=False
    )
    db.add(profile)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id, user.role)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role,
        must_change_password=user.must_change_password,
        is_profile_complete=False,
        full_name=req.full_name
    )


@router.post("/login", response_model=TokenResponse)
def handle_login(req: LoginRequest, db: Session = Depends(get_db)):
    identifier = req.identifier.strip()
    user = db.query(User).filter(
        (User.email == identifier.lower()) | (User.phone == identifier)
    ).first()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/mobile number or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been suspended. Please contact EVSMITH support."
        )

    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id, user.role)

    is_complete = user.profile.is_profile_complete if user.profile else False
    full_name = user.profile.full_name if user.profile else user.email.split("@")[0]

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role,
        must_change_password=user.must_change_password,
        is_profile_complete=is_complete,
        full_name=full_name
    )


@router.post("/refresh", response_model=TokenResponse)
def handle_refresh(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(req.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type for refresh."
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive."
        )

    new_access = create_access_token(user.id, user.role)
    new_refresh = create_refresh_token(user.id, user.role)
    is_complete = user.profile.is_profile_complete if user.profile else False
    full_name = user.profile.full_name if user.profile else ""

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role,
        must_change_password=user.must_change_password,
        is_profile_complete=is_complete,
        full_name=full_name
    )


@router.post("/change-password")
def handle_change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password verification failed."
        )

    current_user.password_hash = get_password_hash(req.new_password)
    current_user.must_change_password = False
    db.commit()

    return {"success": True, "message": "Password changed successfully."}
