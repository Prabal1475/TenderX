from typing import Any, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.user import User
from ...models.company import CompanyProfile
from ...models.tender import Tender
from ...schemas.tender import TenderMatchScore
from ...services.ai.matcher import tender_matcher
from ..deps import get_current_user

router = APIRouter(prefix="/matching", tags=["AI Matching & Eligibility"])


@router.get("/evaluate/{tender_id}", response_model=TenderMatchScore)
def evaluate_tender_match(
    tender_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Run hybrid qualification analysis for a specific tender against the user's company profile.
    Returns breakdown of turnover check, experience, MSME exemption savings, and semantic similarity.
    """
    company = db.query(CompanyProfile).filter(CompanyProfile.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=400, detail="Company profile not initialized. Complete profile first.")

    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    return tender_matcher.evaluate_tender(company=company, tender=tender)


@router.get("/top-recommendations", response_model=List[TenderMatchScore])
def get_top_recommendations(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Evaluates all active tenders and returns the highest AI matching tenders for the company.
    """
    company = db.query(CompanyProfile).filter(CompanyProfile.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=400, detail="Company profile not initialized")

    tenders = db.query(Tender).filter(Tender.status != "Archived").limit(50).all()
    results: List[TenderMatchScore] = []

    for t in tenders:
        score = tender_matcher.evaluate_tender(company=company, tender=t)
        results.append(score)

    # Sort descending by overall match score
    results.sort(key=lambda x: x.overall_match_score, reverse=True)
    return results[:limit]
