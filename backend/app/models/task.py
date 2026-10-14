import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..core.database import Base, GUID


class TenderTask(Base):
    __tablename__ = "tender_tasks"

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

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(
        String(50),
        default="Technical_Bid",
    )  # EMD_Payment, Technical_Bid, Financial_Bid, Pre_Bid_Clarification, Submission
    
    due_date = Column(DateTime(timezone=True), nullable=True)
    is_completed = Column(Boolean, default=False, index=True)
    priority = Column(String(20), default="Medium")  # High, Medium, Low

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
    tender = relationship("Tender", back_populates="tasks")
    user = relationship("User", back_populates="tasks")
