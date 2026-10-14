import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from ..core.database import Base, GUID


class BidDocument(Base):
    __tablename__ = "bid_documents"

    id = Column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    tender_id = Column(
        GUID,
        ForeignKey("tenders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        GUID,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    doc_type = Column(
        String(100),
        nullable=False,
        default="Compliance_Matrix",
    )  # Compliance_Matrix, Cover_Letter, Technical_Bid, Experience_Summary

    title = Column(String(255), nullable=False)
    drafted_content = Column(Text, nullable=False)
    edited_content = Column(Text, nullable=True)
    
    # State machine for human-in-the-loop review
    status = Column(
        String(50),
        default="Draft",
        index=True,
    )  # Draft, Under_Review, Approved, Exported

    rag_citations = Column(JSON, default=list)  # Referenced document chunk IDs & titles

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
    tender = relationship("Tender", back_populates="bid_documents")
    user = relationship("User", back_populates="bid_documents")
