import uuid
from datetime import datetime, timezone
from app.models.company import CompanyProfile
from app.models.tender import Tender
from app.services.ai.matcher import tender_matcher


def test_hybrid_tender_matching():
    # Setup mock company profile
    company = CompanyProfile(
        id=uuid.uuid4(),
        company_name="Apex Technologies",
        annual_turnover_cr=8.0,
        years_of_experience=6,
        is_msme="Micro",
        certifications=["ISO 9001:2015", "ISO 27001"],
        core_competencies="CCTV and IP surveillance systems for railway and urban infrastructure.",
    )

    # Setup mock tender
    tender = Tender(
        id=uuid.uuid4(),
        tender_id="GEM/2026/B/10001",
        title="Supply and Installation of Railway CCTV Surveillance",
        authority="Northern Railway",
        category="Works",
        estimated_value_inr=30000000.0,
        emd_amount_inr=600000.0,
        msme_exemption=True,
        submission_deadline=datetime.now(timezone.utc),
        eligibility_criteria={
            "min_turnover_cr": 5.0,
            "min_experience_years": 3,
            "required_certifications": ["ISO 9001:2015"],
            "past_project_value_pct": 50,
        },
        description="Turnkey installation of IP cameras and NVR video management systems across railway stations.",
    )

    result = tender_matcher.evaluate_tender(company, tender)

    assert result is not None
    assert result.tender_code == "GEM/2026/B/10001"
    assert result.overall_match_score > 60
    assert result.is_hard_eligible is True
    assert result.turnover_check["passed"] is True
    assert result.experience_check["passed"] is True
    assert result.msme_benefit["eligible_for_emd_exemption"] is True
