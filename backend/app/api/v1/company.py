from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.user import User
from ...models.company import CompanyProfile
from ...schemas.company import CompanyProfileResponse, CompanyProfileUpdate
from ...services.ai.embeddings import embedding_service
from ..deps import get_current_user

router = APIRouter(prefix="/company", tags=["Company Profile"])


@router.get("/profile", response_model=CompanyProfileResponse)
def get_company_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve the company qualification profile for the current user."""
    profile = db.query(CompanyProfile).filter(CompanyProfile.user_id == current_user.id).first()
    if not profile:
        profile = CompanyProfile(
            user_id=current_user.id,
            company_name="Enterprise Solutions",
            core_competencies="IT services and government supplies.",
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.put("/profile", response_model=CompanyProfileResponse)
def update_company_profile(
    profile_in: CompanyProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update company qualification metrics, turnover, certifications, and re-compute semantic embedding."""
    profile = db.query(CompanyProfile).filter(CompanyProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Company profile not found")

    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    # Re-compute semantic embedding if competencies, company name, or sectors changed
    if any(k in update_data for k in ["core_competencies", "sectors", "company_name"]):
        competency_text = f"{profile.company_name}. Competencies: {profile.core_competencies or ''}. Sectors: {', '.join(profile.sectors or [])}"
        profile.profile_embedding = embedding_service.get_embedding(competency_text)

    db.commit()
    db.refresh(profile)
    return profile
