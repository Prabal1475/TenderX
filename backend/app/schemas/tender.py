from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class EligibilityCriteriaSchema(BaseModel):
    min_turnover_cr: float = 0.0
    min_experience_years: int = 0
    required_certifications: List[str] = Field(default_factory=list)
    past_project_value_pct: Optional[float] = 50.0


class TenderBase(BaseModel):
    tender_id: str
    title: str
    authority: str
    portal: str = "GeM"
    category: str = "Services"
    estimated_value_inr: float = 0.0
    emd_amount_inr: float = 0.0
    msme_exemption: bool = True
    startup_exemption: bool = True
    publish_date: Optional[datetime] = None
    submission_deadline: datetime
    opening_date: Optional[datetime] = None
    location_state: Optional[str] = "All India"
    description: Optional[str] = None
    document_url: Optional[str] = None
    eligibility_criteria: Optional[EligibilityCriteriaSchema] = None
    status: str = "Active"


class TenderCreate(TenderBase):
    pass


class TenderUpdate(BaseModel):
    title: Optional[str] = None
    authority: Optional[str] = None
    portal: Optional[str] = None
    category: Optional[str] = None
    estimated_value_inr: Optional[float] = None
    emd_amount_inr: Optional[float] = None
    msme_exemption: Optional[bool] = None
    startup_exemption: Optional[bool] = None
    submission_deadline: Optional[datetime] = None
    opening_date: Optional[datetime] = None
    location_state: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class TenderResponse(TenderBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    overall_match_score: Optional[int] = None
    is_hard_eligible: Optional[bool] = None

    class Config:
        from_attributes = True


class TenderMatchScore(BaseModel):
    tender_id: UUID
    tender_code: str
    title: str
    overall_match_score: int  # 0 to 100%
    semantic_score: int       # 0 to 100%
    eligibility_score: int    # 0 to 100%
    is_hard_eligible: bool
    turnover_check: Dict[str, Any]
    experience_check: Dict[str, Any]
    msme_benefit: Dict[str, Any]
    certifications_check: Dict[str, Any]
    ai_rationale: str
    risk_factors: List[str]
