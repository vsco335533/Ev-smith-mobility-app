from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class PersonalDetailsSchema(BaseModel):
    full_name: str = Field(..., min_length=2)
    dob: str
    gender: str
    occupation: str
    employer_id: str
    mobile_number: str
    email: EmailStr
    alt_mobile: Optional[str] = None


class AddressItemSchema(BaseModel):
    address_type: str = "CURRENT"
    line: str = Field(..., min_length=5)
    city: str
    state: str
    pincode: str = Field(..., min_length=6, max_length=6)
    country: str = "India"
    is_same_as_current: bool = False


class AddressDetailsSchema(BaseModel):
    current: AddressItemSchema
    permanent: AddressItemSchema


class IdentityDocumentInputSchema(BaseModel):
    document_type: str = Field(..., description="AADHAAR, PAN, or DRIVING_LICENCE")
    document_number: str = Field(..., min_length=4)
    secure_url: str
    cloudinary_public_id: Optional[str] = None


class EmergencyContactSchema(BaseModel):
    reference_name: str = Field(..., min_length=2)
    reference_phone: str = Field(..., min_length=10, max_length=15)
    emergency_name: str = Field(..., min_length=2)
    emergency_phone: str = Field(..., min_length=10, max_length=15)


class RiderDeclarationSchema(BaseModel):
    agreed: bool = Field(..., description="Must agree to terms and conditions")


class MultiStepRegistrationRequest(BaseModel):
    personal: PersonalDetailsSchema
    address: AddressDetailsSchema
    document: IdentityDocumentInputSchema
    contacts: EmergencyContactSchema
    declaration: RiderDeclarationSchema


class DocumentResponse(BaseModel):
    id: int
    document_type: str
    document_number: str
    secure_url: str
    verification_status: str
    rejection_reason: Optional[str] = None
    uploaded_at: datetime


class RiderProfileResponse(BaseModel):
    user_id: int
    email: str
    phone: str
    role: str
    full_name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    employer_id: Optional[str] = None
    alt_phone: Optional[str] = None
    is_profile_complete: bool
    addresses: List[AddressItemSchema] = []
    documents: List[DocumentResponse] = []
    emergency_contact: Optional[EmergencyContactSchema] = None
    declaration_agreed: bool = False
