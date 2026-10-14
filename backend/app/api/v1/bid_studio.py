from typing import Any, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.user import User
from ...models.company import CompanyProfile
from ...models.tender import Tender
from ...models.bid_document import BidDocument
from ...schemas.bid_document import (
    BidDocumentCreateRequest,
    BidDocumentUpdateRequest,
    BidDocumentResponse,
)
from ...services.ai.rag_engine import rag_engine
from ..deps import get_current_user

router = APIRouter(prefix="/bid-studio", tags=["Bid Document Studio & RAG"])


@router.get("/tender/{tender_id}", response_model=List[BidDocumentResponse])
def list_tender_bid_documents(
    tender_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List all bid drafts generated for a specific tender."""
    docs = db.query(BidDocument).filter(
        BidDocument.tender_id == tender_id,
        BidDocument.user_id == current_user.id,
    ).order_by(BidDocument.created_at.desc()).all()
    return docs


@router.get("/{document_id}", response_model=BidDocumentResponse)
def get_bid_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve single drafted bid document by ID."""
    doc = db.query(BidDocument).filter(
        BidDocument.id == document_id,
        BidDocument.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Bid document not found")
    return doc


@router.post("/generate", response_model=BidDocumentResponse)
async def generate_bid_document(
    request: BidDocumentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    RAG-powered bid document generation.
    Retrieves company credentials matching tender requirements, invokes AI synthesis,
    and creates a reviewable draft record.
    """
    tender = db.query(Tender).filter(Tender.id == request.tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    company = db.query(CompanyProfile).filter(CompanyProfile.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=400, detail="Company profile not configured")

    draft_title = f"{request.doc_type.replace('_', ' ')} - {tender.tender_id}"

    draft_content, citations = await rag_engine.generate_bid_document(
        db=db,
        user_id=str(current_user.id),
        tender=tender,
        company=company,
        doc_type=request.doc_type,
        custom_instructions=request.custom_instructions,
    )

    bid_doc = BidDocument(
        tender_id=tender.id,
        user_id=current_user.id,
        doc_type=request.doc_type,
        title=draft_title,
        drafted_content=draft_content,
        edited_content=draft_content,  # Initialized with draft
        status="Draft",
        rag_citations=citations,
    )
    db.add(bid_doc)
    db.commit()
    db.refresh(bid_doc)

    return bid_doc


@router.put("/{document_id}", response_model=BidDocumentResponse)
def update_bid_document(
    document_id: UUID,
    update_in: BidDocumentUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update human edits, title, or review state (Draft -> Under_Review -> Approved -> Exported)."""
    doc = db.query(BidDocument).filter(
        BidDocument.id == document_id,
        BidDocument.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Bid document not found")

    update_dict = update_in.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(doc, field, value)

    db.commit()
    db.refresh(doc)
    return doc


@router.get("/{document_id}/export")
def export_bid_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Export the approved/edited document as a downloadable Markdown file."""
    doc = db.query(BidDocument).filter(
        BidDocument.id == document_id,
        BidDocument.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Bid document not found")

    content = doc.edited_content or doc.drafted_content
    filename = f"{doc.title.replace(' ', '_')}.md"

    # Mark status as Exported
    doc.status = "Exported"
    db.commit()

    return Response(
        content=content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
