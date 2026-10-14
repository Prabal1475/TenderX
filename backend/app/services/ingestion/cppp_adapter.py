import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Dict, Any
from .base import BaseTenderAdapter
from ...schemas.tender import TenderCreate, EligibilityCriteriaSchema
from ...core.logging import logger


class CPPPAdapter(BaseTenderAdapter):
    """
    Adapter for Central Public Procurement Portal (CPPP / eProcure).
    Handles standard Central PSU, Railway, and Ministry two-cover tender notices.
    """

    @property
    def source_name(self) -> str:
        return "Central Public Procurement Portal (CPPP)"

    async def fetch_raw_tenders(self, **kwargs) -> List[Dict[str, Any]]:
        """Fetches CPPP tenders from seed file or synthetic feed."""
        data_path = Path(__file__).parent.parent.parent / "data" / "sample_tenders.json"
        cppp_tenders = []

        if data_path.exists():
            try:
                with open(data_path, "r", encoding="utf-8") as f:
                    all_data = json.load(f)
                    cppp_tenders = [t for t in all_data if t.get("portal") == "CPPP"]
            except Exception as e:
                logger.error(f"Error reading sample tenders for CPPP: {e}")

        if not cppp_tenders or kwargs.get("generate_mock", False):
            cppp_tenders.append(self._generate_synthetic_cppp_tender())

        return cppp_tenders

    def normalize_tender(self, raw_data: Dict[str, Any]) -> TenderCreate:
        """Normalizes CPPP raw schema to standard TenderCreate schema."""
        crit = raw_data.get("eligibility_criteria", {})
        eligibility = EligibilityCriteriaSchema(
            min_turnover_cr=float(crit.get("min_turnover_cr", 5.0)),
            min_experience_years=int(crit.get("min_experience_years", 5)),
            required_certifications=crit.get("required_certifications", ["ISO 9001:2015"]),
            past_project_value_pct=float(crit.get("past_project_value_pct", 50.0)),
        )

        sub_deadline = raw_data.get("submission_deadline")
        if isinstance(sub_deadline, str):
            deadline_dt = datetime.fromisoformat(sub_deadline.replace("Z", "+00:00"))
        else:
            deadline_dt = sub_deadline or (datetime.now(timezone.utc) + timedelta(days=25))

        return TenderCreate(
            tender_id=raw_data["tender_id"],
            title=raw_data["title"],
            authority=raw_data["authority"],
            portal="CPPP",
            category=raw_data.get("category", "Works"),
            estimated_value_inr=float(raw_data.get("estimated_value_inr", 0.0)),
            emd_amount_inr=float(raw_data.get("emd_amount_inr", 0.0)),
            msme_exemption=bool(raw_data.get("msme_exemption", True)),
            startup_exemption=bool(raw_data.get("startup_exemption", False)),
            submission_deadline=deadline_dt,
            opening_date=deadline_dt + timedelta(hours=24),
            location_state=raw_data.get("location_state", "All India"),
            description=raw_data.get("description", ""),
            document_url=raw_data.get("document_url"),
            eligibility_criteria=eligibility,
            status=raw_data.get("status", "Active"),
        )

    def _generate_synthetic_cppp_tender(self) -> Dict[str, Any]:
        """Generates realistic synthetic CPPP tender notification."""
        nit_num = random.randint(100, 999)
        agency = random.choice([
            "Indian Oil Corporation Limited (IOCL) Refineries",
            "Bharat Heavy Electricals Limited (BHEL) Bhopal",
            "Dedicated Freight Corridor Corporation of India (DFCCIL)",
            "Container Corporation of India (CONCOR)",
        ])
        days_ahead = random.randint(14, 40)
        est_val = float(random.randint(30, 120) * 1000000)

        return {
            "tender_id": f"CPPP/2026/{agency[:4].upper()}/NIT/{nit_num}",
            "title": f"Turnkey EPC for Industrial SCADA Telemetry & Remote RTU Monitoring System",
            "authority": agency,
            "portal": "CPPP",
            "category": "Works",
            "estimated_value_inr": est_val,
            "emd_amount_inr": est_val * 0.02,
            "msme_exemption": True,
            "startup_exemption": False,
            "submission_deadline": (datetime.now(timezone.utc) + timedelta(days=days_ahead)).isoformat(),
            "location_state": "All India",
            "description": "Engineering, procurement, supply, site erection, software integration, testing and commissioning of redundant PLC/SCADA systems with 5-year comprehensive operation and maintenance support.",
            "document_url": f"https://eprocure.gov.in/eprocure/app?nit_{nit_num}",
            "eligibility_criteria": {
                "min_turnover_cr": round(est_val / 10000000 * 0.5, 2),
                "min_experience_years": 5,
                "required_certifications": ["ISO 9001:2015", "ISO 45001", "IEC 61850 Compliance"],
                "past_project_value_pct": 50,
            },
            "status": "Active",
        }


cppp_adapter = CPPPAdapter()
