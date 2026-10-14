import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Dict, Any
from .base import BaseTenderAdapter
from ...schemas.tender import TenderCreate, EligibilityCriteriaSchema
from ...core.logging import logger


class GeMAdapter(BaseTenderAdapter):
    """
    Adapter for Government e-Marketplace (GeM) Tenders.
    Handles GeM BID format, Ministry/Department mapping, and MSME/Startup relaxation clauses.
    """

    @property
    def source_name(self) -> str:
        return "Government e-Marketplace (GeM)"

    async def fetch_raw_tenders(self, **kwargs) -> List[Dict[str, Any]]:
        """
        Fetches GeM tenders.
        In MVP: loads seed GeM data from sample_tenders.json or generates synthetic live bids.
        """
        data_path = Path(__file__).parent.parent.parent / "data" / "sample_tenders.json"
        gem_tenders = []

        if data_path.exists():
            try:
                with open(data_path, "r", encoding="utf-8") as f:
                    all_data = json.load(f)
                    gem_tenders = [t for t in all_data if t.get("portal") == "GeM"]
            except Exception as e:
                logger.error(f"Error reading sample tenders for GeM: {e}")

        # If empty or requested, generate synthetic GeM mock bid
        if not gem_tenders or kwargs.get("generate_mock", False):
            gem_tenders.append(self._generate_synthetic_gem_bid())

        return gem_tenders

    def normalize_tender(self, raw_data: Dict[str, Any]) -> TenderCreate:
        """Normalizes GeM raw schema to standard TenderCreate schema."""
        crit = raw_data.get("eligibility_criteria", {})
        eligibility = EligibilityCriteriaSchema(
            min_turnover_cr=float(crit.get("min_turnover_cr", 2.0)),
            min_experience_years=int(crit.get("min_experience_years", 3)),
            required_certifications=crit.get("required_certifications", ["ISO 9001:2015"]),
            past_project_value_pct=float(crit.get("past_project_value_pct", 50.0)),
        )

        sub_deadline = raw_data.get("submission_deadline")
        if isinstance(sub_deadline, str):
            deadline_dt = datetime.fromisoformat(sub_deadline.replace("Z", "+00:00"))
        else:
            deadline_dt = sub_deadline or (datetime.now(timezone.utc) + timedelta(days=21))

        return TenderCreate(
            tender_id=raw_data["tender_id"],
            title=raw_data["title"],
            authority=raw_data["authority"],
            portal="GeM",
            category=raw_data.get("category", "Services"),
            estimated_value_inr=float(raw_data.get("estimated_value_inr", 0.0)),
            emd_amount_inr=float(raw_data.get("emd_amount_inr", 0.0)),
            msme_exemption=bool(raw_data.get("msme_exemption", True)),
            startup_exemption=bool(raw_data.get("startup_exemption", True)),
            submission_deadline=deadline_dt,
            opening_date=deadline_dt + timedelta(minutes=30),
            location_state=raw_data.get("location_state", "All India"),
            description=raw_data.get("description", ""),
            document_url=raw_data.get("document_url"),
            eligibility_criteria=eligibility,
            status=raw_data.get("status", "Active"),
        )

    def _generate_synthetic_gem_bid(self) -> Dict[str, Any]:
        """Generates realistic synthetic GeM bid for simulation."""
        bid_num = random.randint(8900000, 9999999)
        dept = random.choice([
            "Ministry of Defence - Ordnance Factory Board",
            "Central Public Works Department (CPWD)",
            "DRDO Headquarters, New Delhi",
            "Ministry of Electronics & Information Technology (MeitY)",
        ])
        days_ahead = random.randint(10, 30)
        est_val = float(random.randint(15, 80) * 1000000)

        return {
            "tender_id": f"GEM/2026/B/{bid_num}",
            "title": f"Procurement & Implementation of Secure Communication Hardware & Cloud VDI",
            "authority": dept,
            "portal": "GeM",
            "category": "Goods",
            "estimated_value_inr": est_val,
            "emd_amount_inr": est_val * 0.02,
            "msme_exemption": True,
            "startup_exemption": True,
            "submission_deadline": (datetime.now(timezone.utc) + timedelta(days=days_ahead)).isoformat(),
            "location_state": "Delhi",
            "description": "Supply, installation, multi-factor authentication integration and 3-year AMC for enterprise zero-trust hardware appliances.",
            "document_url": f"https://gem.gov.in/tenders/GEM-2026-B-{bid_num}.pdf",
            "eligibility_criteria": {
                "min_turnover_cr": round(est_val / 10000000 * 0.4, 2),
                "min_experience_years": 3,
                "required_certifications": ["ISO 9001:2015", "ISO 27001"],
                "past_project_value_pct": 50,
            },
            "status": "Active",
        }


gem_adapter = GeMAdapter()
