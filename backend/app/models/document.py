import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from ..core.database import Base, GUID, VectorField
from ..core.config import settings


class CompanyDocument(Base):
    __tablename__ = "company_documents"

    id = Column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    user_id = Column(
        GUID,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    filename = Column(String(255), nullable=False)
    stored_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, docx, txt
    file_size_bytes = Column(Integer, default=0)

    # Document Classification
    category = Column(
        String(100),
        default="Past_Experience",
        index=True,
    )  # Past_Experience, Financial_Audit, MSME_Udyam, GST_Certificate, ISO_Quality, Technical_Proposal
    
    title = Column(String(255), nullable=True)
    summary = Column(Text, nullable=True)
    tags = Column(JSON, default=list)

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
    user = relationship("User", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    document_id = Column(
        GUID,
        ForeignKey("company_documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    chunk_metadata = Column(JSON, default=dict)
    
    # Vector embedding
    embedding = Column(VectorField(settings.EMBEDDING_DIMENSION), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    document = relationship("CompanyDocument", back_populates="chunks")
