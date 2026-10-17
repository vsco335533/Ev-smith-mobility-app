from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class SendOTPRequest(BaseModel):
    email: EmailStr
    purpose: str = Field(default="registration")


class SendOTPResponse(BaseModel):
    success: bool
    message: str
    email: str
    is_sandbox: bool = False
    sandbox_otp: Optional[str] = None  # Returned only in development mode for easy testing!


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)


class VerifyOTPResponse(BaseModel):
    success: bool
    message: str
    email: str
    verified: bool


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., min_length=10, max_length=15)
    email: EmailStr


class LoginRequest(BaseModel):
    identifier: str = Field(..., description="Email or mobile number")
    password: str = Field(..., min_length=4)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    role: str
    must_change_password: bool
    is_profile_complete: bool
    full_name: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str = Field(..., min_length=6)
