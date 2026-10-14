import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from ..core.database import Base, GUID, VectorField
from ..core.config import settings


class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    id = Column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    user_id = Column(
        GUID,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    company_name = Column(String(255), nullable=False, default="My Company")
    pan_number = Column(String(20), nullable=True)
    gst_number = Column(String(25), nullable=True)
    udyam_msme_number = Column(String(50), nullable=True)
    is_msme = Column(String(20), default="Micro", nullable=True)  # Micro, Small, Medium, Not Applicable
    
    annual_turnover_cr = Column(Float, default=5.0)  # Average 3-year turnover in INR Crores
    net_worth_cr = Column(Float, default=2.0)        # Net worth in INR Crores
    years_of_experience = Column(Integer, default=5)
    
    sectors = Column(JSON, default=list)            # e.g., ["IT Infrastructure", "Software Development", "CCTV Surveillance"]
    certifications = Column(JSON, default=list)     # e.g., ["ISO 9001:2015", "ISO 27001", "CMMI Level 3"]
    key_clients = Column(JSON, default=list)        # Past government/PSU clients
    
    core_competencies = Column(Text, nullable=True) # Text summary for semantic profile embedding
    profile_embedding = Column(VectorField(settings.EMBEDDING_DIMENSION), nullable=True)

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
    user = relationship("User", back_populates="company_profile")
