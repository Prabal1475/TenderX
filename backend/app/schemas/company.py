from typing import Optional, List
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class CompanyProfileBase(BaseModel):
    company_name: str = "My Enterprise Solutions Pvt Ltd"
    pan_number: Optional[str] = "AAACR1234F"
    gst_number: Optional[str] = "07AAACR1234F1Z5"
    udyam_msme_number: Optional[str] = "UDYAM-DL-01-0012345"
    is_msme: Optional[str] = "Micro"
    annual_turnover_cr: float = Field(default=5.0, description="Average 3-year turnover in INR Crores")
    net_worth_cr: float = Field(default=2.0, description="Net worth in INR Crores")
    years_of_experience: int = Field(default=5, description="Years in business")
    sectors: List[str] = Field(default_factory=lambda: ["IT Infrastructure", "Software Solutions", "Networking & CCTV"])
    certifications: List[str] = Field(default_factory=lambda: ["ISO 9001:2015", "ISO 27001:2022", "CMMI Level 3"])
    key_clients: List[str] = Field(default_factory=lambda: ["Northern Railway", "BHEL", "BSNL"])
    core_competencies: Optional[str] = (
        "Turnkey system integration, enterprise software development, cloud migration, "
        "campus networking, smart surveillance systems, and multi-year AMC support for government PSUs."
    )


class CompanyProfileCreate(CompanyProfileBase):
    pass


class CompanyProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    pan_number: Optional[str] = None
    gst_number: Optional[str] = None
    udyam_msme_number: Optional[str] = None
    is_msme: Optional[str] = None
    annual_turnover_cr: Optional[float] = None
    net_worth_cr: Optional[float] = None
    years_of_experience: Optional[int] = None
    sectors: Optional[List[str]] = None
    certifications: Optional[List[str]] = None
    key_clients: Optional[List[str]] = None
    core_competencies: Optional[str] = None


class CompanyProfileResponse(CompanyProfileBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
