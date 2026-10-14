import csv
import json
import io
from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta
from .base import BaseTenderAdapter
from ...schemas.tender import TenderCreate, EligibilityCriteriaSchema
from ...core.logging import logger


class BulkImportAdapter(BaseTenderAdapter):
    """
    Adapter for bulk ingestion of tenders via JSON or CSV file uploads.
    """

    @property
    def source_name(self) -> str:
        return "Bulk File Import"

    async def fetch_raw_tenders(self, **kwargs) -> List[Dict[str, Any]]:
        file_content: str = kwargs.get("file_content", "")
        file_type: str = kwargs.get("file_type", "json").lower()

        if file_type == "json":
            try:
                data = json.loads(file_content)
                return data if isinstance(data, list) else [data]
            except Exception as e:
                logger.error(f"Failed to parse bulk JSON: {e}")
                return []
        elif file_type == "csv":
            try:
                reader = csv.DictReader(io.StringIO(file_content))
                return list(reader)
            except Exception as e:
                logger.error(f"Failed to parse bulk CSV: {e}")
                return []
        return []

    def normalize_tender(self, raw_data: Dict[str, Any]) -> TenderCreate:
        tender_id = raw_data.get("tender_id") or f"BULK/{datetime.now().strftime('%Y%m%d%H%M%S')}"
        title = raw_data.get("title", "Untitled Tender")
        authority = raw_data.get("authority", "Government Department")
        portal = raw_data.get("portal", "GeM")

        val = float(raw_data.get("estimated_value_inr", 0.0) or 0.0)
        emd = float(raw_data.get("emd_amount_inr", 0.0) or 0.0)

        deadline_raw = raw_data.get("submission_deadline")
        if deadline_raw:
            try:
                deadline = datetime.fromisoformat(str(deadline_raw).replace("Z", "+00:00"))
            except Exception:
                deadline = datetime.now(timezone.utc) + timedelta(days=20)
        else:
            deadline = datetime.now(timezone.utc) + timedelta(days=20)

        crit_raw = raw_data.get("eligibility_criteria")
        if isinstance(crit_raw, str):
            try:
                crit_dict = json.loads(crit_raw)
            except Exception:
                crit_dict = {}
        elif isinstance(crit_raw, dict):
            crit_dict = crit_raw
        else:
            crit_dict = {}

        eligibility = EligibilityCriteriaSchema(
            min_turnover_cr=float(crit_dict.get("min_turnover_cr", 1.0)),
            min_experience_years=int(crit_dict.get("min_experience_years", 2)),
            required_certifications=crit_dict.get("required_certifications", []),
            past_project_value_pct=float(crit_dict.get("past_project_value_pct", 50.0)),
        )

        return TenderCreate(
            tender_id=tender_id,
            title=title,
            authority=authority,
            portal=portal,
            category=raw_data.get("category", "Services"),
            estimated_value_inr=val,
            emd_amount_inr=emd,
            msme_exemption=str(raw_data.get("msme_exemption", "true")).lower() in ("true", "1", "yes"),
            startup_exemption=str(raw_data.get("startup_exemption", "true")).lower() in ("true", "1", "yes"),
            submission_deadline=deadline,
            opening_date=deadline + timedelta(hours=2),
            location_state=raw_data.get("location_state", "All India"),
            description=raw_data.get("description", ""),
            document_url=raw_data.get("document_url"),
            eligibility_criteria=eligibility,
            status=raw_data.get("status", "Active"),
        )


bulk_importer = BulkImportAdapter()
