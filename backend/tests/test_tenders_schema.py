import uuid
from datetime import datetime, timezone
from app.schemas.tender import TenderResponse, TenderMatchScore, TenderCreate


def test_tender_response_with_match_attributes():
    tender_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    
    payload = {
        "id": tender_id,
        "tender_id": "GEM/2026/B/8912401",
        "title": "Supply and Installation of Railway CCTV Surveillance",
        "authority": "Northern Railway",
        "portal": "GeM",
        "category": "Works",
        "estimated_value_inr": 35000000.0,
        "emd_amount_inr": 700000.0,
        "msme_exemption": True,
        "startup_exemption": True,
        "submission_deadline": now,
        "status": "Active",
        "created_at": now,
        "updated_at": now,
        "overall_match_score": 94,
        "is_hard_eligible": True,
    }
    
    response = TenderResponse.model_validate(payload)
    assert response.overall_match_score == 94
    assert response.is_hard_eligible is True
    assert response.authority == "Northern Railway"
    assert response.estimated_value_inr == 35000000.0


def test_tender_match_score_schema():
    match = TenderMatchScore(
        tender_id=uuid.uuid4(),
        tender_code="CPPP/2026/NHAI/TOLL/889",
        title="High-Speed Toll Plaza Modernization",
        overall_match_score=42,
        semantic_score=50,
        eligibility_score=35,
        is_hard_eligible=False,
        turnover_check={"required_cr": 25.0, "company_cr": 8.0, "passed": False},
        experience_check={"required_years": 7, "company_years": 6, "passed": False},
        msme_benefit={"eligible_for_emd_exemption": True},
        certifications_check={"matched": ["ISO 9001:2015"], "missing": []},
        ai_rationale="Turnover is significantly below the minimum threshold.",
        risk_factors=["Annual turnover is 68% below required threshold"],
    )
    
    assert match.overall_match_score == 42
    assert match.is_hard_eligible is False
    assert match.tender_code == "CPPP/2026/NHAI/TOLL/889"
    assert len(match.risk_factors) == 1
