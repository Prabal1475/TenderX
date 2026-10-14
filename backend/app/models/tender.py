import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from ..core.database import Base, GUID, VectorField
from ..core.config import settings


class Tender(Base):
    __tablename__ = "tenders"

    id = Column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    tender_id = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(500), nullable=False, index=True)
    authority = Column(String(300), nullable=False, index=True)
    portal = Column(String(50), nullable=False, default="GeM")  # GeM, CPPP, State Portal
    category = Column(String(100), nullable=False, default="Services")  # Goods, Services, Works
    
    # Financials (in INR)
    estimated_value_inr = Column(Float, nullable=False, default=0.0)
    emd_amount_inr = Column(Float, nullable=False, default=0.0)
    msme_exemption = Column(Boolean, default=True)  # Exemption for EMD/experience for MSME
    startup_exemption = Column(Boolean, default=True)

    # Dates
    publish_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    submission_deadline = Column(DateTime(timezone=True), nullable=False, index=True)
    opening_date = Column(DateTime(timezone=True), nullable=True)

    # Geography & Details
    location_state = Column(String(100), nullable=True, default="All India")
    description = Column(Text, nullable=True)
    document_url = Column(String(500), nullable=True)

    # Structured Eligibility Requirements
    eligibility_criteria = Column(
        JSON,
        default=lambda: {
            "min_turnover_cr": 0.0,
            "min_experience_years": 0,
            "required_certifications": [],
            "past_project_value_pct": 50,
        },
    )

    # Semantic Scope Vector for AI Matching
    scope_embedding = Column(VectorField(settings.EMBEDDING_DIMENSION), nullable=True)

    # Status in platform pipeline
    status = Column(String(50), default="Active", index=True)  # Active, Bookmarked, Bidding, Submitted, Archived

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    bid_documents = relationship("BidDocument", back_populates="tender", cascade="all, delete-orphan")
    tasks = relationship("TenderTask", back_populates="tender", cascade="all, delete-orphan")
