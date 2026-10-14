from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class BidDocumentCreateRequest(BaseModel):
    tender_id: UUID
    doc_type: str = Field(
        default="Compliance_Matrix",
        description="Compliance_Matrix | Cover_Letter | Technical_Bid | Experience_Summary",
    )
    custom_instructions: Optional[str] = None


class BidDocumentUpdateRequest(BaseModel):
    title: Optional[str] = None
    edited_content: Optional[str] = None
    status: Optional[str] = Field(
        None,
        description="Draft | Under_Review | Approved | Exported",
    )


class BidDocumentResponse(BaseModel):
    id: UUID
    tender_id: UUID
    user_id: UUID
    doc_type: str
    title: str
    drafted_content: str
    edited_content: Optional[str] = None
    status: str
    rag_citations: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
