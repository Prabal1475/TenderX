from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class DocumentChunkResponse(BaseModel):
    id: UUID
    document_id: UUID
    chunk_index: int
    content: str
    chunk_metadata: Optional[Dict[str, Any]] = None
    similarity_score: Optional[float] = None

    class Config:
        from_attributes = True


class CompanyDocumentResponse(BaseModel):
    id: UUID
    user_id: UUID
    filename: str
    stored_path: str
    file_type: str
    file_size_bytes: int
    category: str
    title: Optional[str] = None
    summary: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    chunks_count: Optional[int] = 0

    class Config:
        from_attributes = True


class SemanticSearchRequest(BaseModel):
    query: str
    top_k: int = 5
    category: Optional[str] = None


class SemanticSearchResult(BaseModel):
    chunk_id: UUID
    document_id: UUID
    document_name: str
    category: str
    content: str
    similarity_score: float
    chunk_metadata: Optional[Dict[str, Any]] = None
