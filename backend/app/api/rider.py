from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_rider
from app.models.user import (
    User, RiderProfile, Address, IdentityDocument,
    EmergencyContact, RiderDeclaration, DocVerificationStatus, AddressType
)
from app.schemas.rider import (
    RiderProfileResponse, MultiStepRegistrationRequest,
    AddressItemSchema, DocumentResponse
)
from app.services.cloudinary_service import upload_document

router = APIRouter(prefix="/rider", tags=["Rider Management"])


@router.get("/profile", response_model=RiderProfileResponse)
def get_rider_profile(current_user: User = Depends(get_current_rider), db: Session = Depends(get_db)):
    profile = current_user.profile
    addresses = [
        AddressItemSchema(
            address_type=addr.address_type,
            line=addr.line,
            city=addr.city,
            state=addr.state,
            pincode=addr.pincode,
            country=addr.country,
            is_same_as_current=addr.is_same_as_current
        ) for addr in current_user.addresses
    ]
    docs = [
        DocumentResponse(
            id=doc.id,
            document_type=doc.document_type,
            document_number=doc.document_number,
            secure_url=doc.secure_url,
            verification_status=doc.verification_status,
            rejection_reason=doc.rejection_reason,
            uploaded_at=doc.uploaded_at
        ) for doc in current_user.documents
    ]

    emergency_dict = None
    if current_user.emergency_contact:
        emergency_dict = {
            "reference_name": current_user.emergency_contact.reference_name,
            "reference_phone": current_user.emergency_contact.reference_phone,
            "emergency_name": current_user.emergency_contact.emergency_name,
            "emergency_phone": current_user.emergency_contact.emergency_phone
        }

    return RiderProfileResponse(
        user_id=current_user.id,
        email=current_user.email,
        phone=current_user.phone,
        role=current_user.role,
        full_name=profile.full_name if profile else None,
        dob=profile.dob if profile else None,
        gender=profile.gender if profile else None,
        occupation=profile.occupation if profile else None,
        employer_id=profile.employer_id if profile else None,
        alt_phone=profile.alt_phone if profile else None,
        is_profile_complete=profile.is_profile_complete if profile else False,
        addresses=addresses,
        documents=docs,
        emergency_contact=emergency_dict,
        declaration_agreed=current_user.declaration.agreed if current_user.declaration else False
    )


@router.post("/upload-document")
async def handle_document_upload(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_rider)
):
    secure_url, public_id = await upload_document(file)
    return {
        "success": True,
        "secure_url": secure_url,
        "public_id": public_id,
        "file_name": file.filename,
        "content_type": file.content_type
    }


@router.post("/registration", response_model=RiderProfileResponse)
def submit_multi_step_registration(
    req: MultiStepRegistrationRequest,
    current_user: User = Depends(get_current_rider),
    db: Session = Depends(get_db)
):
    # Step 1: Update Personal Info
    profile = current_user.profile
    if not profile:
        profile = RiderProfile(user_id=current_user.id)
        db.add(profile)

    profile.full_name = req.personal.full_name
    profile.dob = req.personal.dob
    profile.gender = req.personal.gender
    profile.occupation = req.personal.occupation
    profile.employer_id = req.personal.employer_id
    profile.alt_phone = req.personal.alt_mobile
    profile.is_profile_complete = True

    # Step 2: Addresses
    # Clear existing addresses
    db.query(Address).filter(Address.user_id == current_user.id).delete()
    
    current_addr = Address(
        user_id=current_user.id,
        address_type=AddressType.CURRENT.value,
        line=req.address.current.line,
        city=req.address.current.city,
        state=req.address.current.state,
        pincode=req.address.current.pincode,
        country=req.address.current.country,
        is_same_as_current=False
    )
    db.add(current_addr)

    perm_addr = Address(
        user_id=current_user.id,
        address_type=AddressType.PERMANENT.value,
        line=req.address.permanent.line,
        city=req.address.permanent.city,
        state=req.address.permanent.state,
        pincode=req.address.permanent.pincode,
        country=req.address.permanent.country,
        is_same_as_current=req.address.permanent.is_same_as_current
    )
    db.add(perm_addr)

    # Step 3: Identification Document
    # Remove old documents of the same type if updating
    db.query(IdentityDocument).filter(
        IdentityDocument.user_id == current_user.id,
        IdentityDocument.document_type == req.document.document_type
    ).delete()

    doc = IdentityDocument(
        user_id=current_user.id,
        document_type=req.document.document_type,
        document_number=req.document.document_number,
        cloudinary_public_id=req.document.cloudinary_public_id,
        secure_url=req.document.secure_url,
        verification_status=DocVerificationStatus.UNDER_REVIEW.value
    )
    db.add(doc)

    # Step 4: Emergency Contacts
    if current_user.emergency_contact:
        contact = current_user.emergency_contact
    else:
        contact = EmergencyContact(user_id=current_user.id)
        db.add(contact)

    contact.reference_name = req.contacts.reference_name
    contact.reference_phone = req.contacts.reference_phone
    contact.emergency_name = req.contacts.emergency_name
    contact.emergency_phone = req.contacts.emergency_phone

    # Step 5: Declaration
    if current_user.declaration:
        decl = current_user.declaration
    else:
        decl = RiderDeclaration(user_id=current_user.id)
        db.add(decl)

    decl.agreed = req.declaration.agreed
    decl.declaration_text = (
        "I hereby declare that all the information provided above is true and correct. "
        "I have submitted the required information and required original documents for verification "
        "and agree to abide by the terms and conditions of the EVSMITH scooter rental agreement."
    )

    db.commit()
    db.refresh(current_user)

    return get_rider_profile(current_user=current_user, db=db)
