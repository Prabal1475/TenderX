from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, cast, String
from ...core.database import get_db
from ...models.user import User
from ...models.company import CompanyProfile
from ...models.tender import Tender
from ...schemas.tender import TenderResponse, TenderCreate, TenderUpdate
from ...services.ingestion.gem_adapter import gem_adapter
from ...services.ingestion.cppp_adapter import cppp_adapter
from ...services.ingestion.bulk_importer import bulk_importer
from ...services.ai.embeddings import embedding_service
from ...services.ai.matcher import tender_matcher
from ..deps import get_current_user
from ...core.logging import logger

router = APIRouter(prefix="/tenders", tags=["Tenders"])


@router.get("/", response_model=List[TenderResponse])
def list_tenders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50,
    portal: Optional[str] = Query(None, description="Filter by portal: GeM or CPPP"),
    category: Optional[str] = Query(None, description="Filter by Goods, Services, Works"),
    status: Optional[str] = Query(None, description="Filter by pipeline status"),
    eligibility: Optional[str] = Query(None, description="Filter by eligibility: eligible, ineligible, msme"),
    min_value: Optional[float] = Query(None, description="Minimum estimated value in INR"),
    max_value: Optional[float] = Query(None, description="Maximum estimated value in INR"),
    search: Optional[str] = Query(None, description="Keyword search in title, name, type, authority, eligibility, or description"),
) -> Any:
    """List and filter Indian government tenders by title, type, authority, eligibility, etc."""
    query = db.query(Tender)

    if portal:
        query = query.filter(Tender.portal.ilike(f"%{portal}%"))
    if category:
        query = query.filter(Tender.category.ilike(f"%{category}%"))
    if status:
        query = query.filter(Tender.status == status)
    if eligibility == "msme":
        query = query.filter(or_(Tender.msme_exemption == True, Tender.startup_exemption == True))
    if min_value is not None:
        query = query.filter(Tender.estimated_value_inr >= min_value)
    if max_value is not None:
        query = query.filter(Tender.estimated_value_inr <= max_value)
    if search:
        search_fmt = f"%{search.strip()}%"
        s_lower = search.strip().lower()
        search_conditions = [
            Tender.title.ilike(search_fmt),
            Tender.authority.ilike(search_fmt),
            Tender.tender_id.ilike(search_fmt),
            Tender.category.ilike(search_fmt),
            Tender.description.ilike(search_fmt),
            Tender.location_state.ilike(search_fmt),
            cast(Tender.eligibility_criteria, String).ilike(search_fmt),
        ]
        if any(term in s_lower for term in ["msme", "exemption", "startup", "waiver"]):
            search_conditions.append(Tender.msme_exemption == True)
            search_conditions.append(Tender.startup_exemption == True)

        query = query.filter(or_(*search_conditions))

    tenders = query.order_by(Tender.submission_deadline.asc()).offset(skip).limit(limit).all()

    company = db.query(CompanyProfile).filter(CompanyProfile.user_id == current_user.id).first()
    if company:
        for t in tenders:
            try:
                score = tender_matcher.evaluate_tender(company=company, tender=t)
                t.overall_match_score = score.overall_match_score
                t.is_hard_eligible = score.is_hard_eligible
            except Exception as e:
                logger.warning(f"Could not compute match score for tender {t.id}: {e}")

    if eligibility in ("eligible", "matched"):
        tenders = [t for t in tenders if getattr(t, 'is_hard_eligible', False) or (getattr(t, 'overall_match_score', 0) or 0) >= 60]
    elif eligibility in ("ineligible", "disqualified"):
        tenders = [t for t in tenders if not getattr(t, 'is_hard_eligible', True) or (getattr(t, 'overall_match_score', 0) or 0) < 60]

    return tenders


@router.get("/{tender_id}", response_model=TenderResponse)
def get_tender(
    tender_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get single tender detail by its UUID."""
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    company = db.query(CompanyProfile).filter(CompanyProfile.user_id == current_user.id).first()
    if company:
        try:
            score = tender_matcher.evaluate_tender(company=company, tender=tender)
            tender.overall_match_score = score.overall_match_score
            tender.is_hard_eligible = score.is_hard_eligible
        except Exception as e:
            logger.warning(f"Could not compute match score for tender {tender.id}: {e}")

    return tender


@router.post("/ingest", response_model=List[TenderResponse])
async def trigger_ingestion(
    portal: str = Query("GeM", description="Source portal to ingest: 'GeM', 'CPPP', or 'all'"),
    generate_mock: bool = Query(False, description="Generate realistic synthetic mock bids"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Trigger ingestion from Indian government tender adapters (GeM and CPPP)."""
    adapters = []
    if portal.lower() == "gem" or portal.lower() == "all":
        adapters.append(gem_adapter)
    if portal.lower() == "cppp" or portal.lower() == "all":
        adapters.append(cppp_adapter)

    ingested_records: List[Tender] = []

    for adapter in adapters:
        candidates = await adapter.ingest(generate_mock=generate_mock)
        for cand in candidates:
            existing = db.query(Tender).filter(Tender.tender_id == cand.tender_id).first()
            if not existing:
                tender_data = cand.model_dump()
                # Compute scope embedding
                scope_text = f"{cand.title} {cand.description or ''} {cand.category} {cand.authority}"
                embedding = embedding_service.get_embedding(scope_text)

                new_tender = Tender(
                    **tender_data,
                    scope_embedding=embedding,
                )
                db.add(new_tender)
                ingested_records.append(new_tender)

    db.commit()
    for t in ingested_records:
        db.refresh(t)

    logger.info(f"Ingested {len(ingested_records)} new tenders into platform.")
    return ingested_records


@router.post("/bulk-import", response_model=List[TenderResponse])
async def bulk_import_tenders(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Bulk import tenders from uploaded JSON or CSV files."""
    contents = await file.read()
    text = contents.decode("utf-8", errors="ignore")
    ext = (file.filename or "").split(".")[-1].lower()

    candidates = await bulk_importer.ingest(file_content=text, file_type=ext)
    imported: List[Tender] = []

    for cand in candidates:
        existing = db.query(Tender).filter(Tender.tender_id == cand.tender_id).first()
        if not existing:
            scope_text = f"{cand.title} {cand.description or ''} {cand.category} {cand.authority}"
            new_tender = Tender(
                **cand.model_dump(),
                scope_embedding=embedding_service.get_embedding(scope_text),
            )
            db.add(new_tender)
            imported.append(new_tender)

    db.commit()
    for t in imported:
        db.refresh(t)

    return imported


@router.patch("/{tender_id}/status", response_model=TenderResponse)
def update_tender_status(
    tender_id: UUID,
    status: str = Query(..., description="Status: Active, Bookmarked, Bidding, Submitted, Archived"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update tender pipeline status."""
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    tender.status = status
    db.commit()
    db.refresh(tender)
    return tender
