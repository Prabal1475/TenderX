from typing import Dict, Any, List
import numpy as np
from ...models.company import CompanyProfile
from ...models.tender import Tender
from ...schemas.tender import TenderMatchScore
from .embeddings import embedding_service
from ...core.logging import logger


class TenderMatchingEngine:
    """
    Hybrid AI Tender Matching Engine.
    Combines hard deterministic eligibility rules (Indian Public Procurement rules)
    with semantic vector similarity to score qualification from 0 to 100%.
    """

    def evaluate_tender(
        self,
        company: CompanyProfile,
        tender: Tender,
    ) -> TenderMatchScore:
        # Ensure company has embedding
        if company.profile_embedding is None:
            comp_text = f"{company.company_name} {company.core_competencies or ''} {' '.join(company.sectors or [])}"
            company.profile_embedding = embedding_service.get_embedding(comp_text)

        # Ensure tender has scope embedding
        if tender.scope_embedding is None:
            tender_text = f"{tender.title} {tender.description or ''} {tender.category} {tender.authority}"
            tender.scope_embedding = embedding_service.get_embedding(tender_text)

        # 1. Hard Eligibility Rules
        crit = tender.eligibility_criteria or {}
        req_turnover = float(crit.get("min_turnover_cr", 0.0))
        req_exp = int(crit.get("min_experience_years", 0))
        req_certs = crit.get("required_certifications", [])

        is_msme = bool(company.is_msme and company.is_msme != "Not Applicable")
        msme_relaxation_applies = is_msme and (tender.msme_exemption or tender.startup_exemption)

        # Turnover evaluation
        company_turnover = float(company.annual_turnover_cr or 0.0)
        turnover_passed = company_turnover >= req_turnover
        if not turnover_passed and msme_relaxation_applies:
            # Under Indian Public Procurement Policy, MSMEs can receive up to 50% relaxation in prior turnover
            if company_turnover >= (req_turnover * 0.5):
                turnover_passed = True

        turnover_check = {
            "required_cr": req_turnover,
            "company_cr": company_turnover,
            "passed": turnover_passed,
            "relaxed_via_msme": (company_turnover < req_turnover and turnover_passed),
        }

        # Experience evaluation
        comp_exp = int(company.years_of_experience or 0)
        exp_passed = comp_exp >= req_exp
        if not exp_passed and msme_relaxation_applies:
            if comp_exp >= max(1, int(req_exp * 0.6)):
                exp_passed = True

        experience_check = {
            "required_years": req_exp,
            "company_years": comp_exp,
            "passed": exp_passed,
        }

        # Certifications evaluation
        comp_certs = [c.lower() for c in (company.certifications or [])]
        matched_certs = []
        missing_certs = []
        for rc in req_certs:
            if any(rc.lower() in c or c in rc.lower() for c in comp_certs):
                matched_certs.append(rc)
            else:
                missing_certs.append(rc)

        cert_score = 1.0 if not req_certs else (len(matched_certs) / len(req_certs))
        certifications_check = {
            "required": req_certs,
            "matched": matched_certs,
            "missing": missing_certs,
            "passed": len(missing_certs) == 0,
        }

        # Hard eligibility overall determination
        is_hard_eligible = turnover_passed and exp_passed and (cert_score >= 0.5)

        # Hard score (0 to 100)
        t_score = min(1.0, company_turnover / max(req_turnover, 0.1)) * 40
        e_score = min(1.0, comp_exp / max(req_exp, 1)) * 30
        c_score = cert_score * 30
        hard_score_num = int(min(100, t_score + e_score + c_score))

        # 2. Semantic Scope Similarity (0 to 100)
        semantic_sim = self._cosine_similarity(
            company.profile_embedding,
            tender.scope_embedding,
        )
        semantic_score_num = int(max(0.0, min(1.0, semantic_sim)) * 100)

        # 3. Overall Weighted Match Score
        # Hard eligibility: 40% weight | Semantic similarity: 60% weight
        raw_overall = (hard_score_num * 0.40) + (semantic_score_num * 0.60)
        if not is_hard_eligible:
            # Apply 20% penalty if mandatory eligibility criteria are not met
            raw_overall *= 0.80

        overall_score = max(5, min(99, int(round(raw_overall))))

        # 4. Generate Rationale & Risks
        risks: List[str] = []
        if not turnover_passed:
            risks.append(f"Turnover shortfall: required ₹{req_turnover} Cr vs your ₹{company_turnover} Cr")
        if not exp_passed:
            risks.append(f"Experience shortfall: required {req_exp} yrs vs your {comp_exp} yrs")
        if missing_certs:
            risks.append(f"Missing mandatory certifications: {', '.join(missing_certs)}")

        rationale = self._synthesize_rationale(
            overall_score,
            is_hard_eligible,
            turnover_check,
            experience_check,
            msme_relaxation_applies,
            semantic_score_num,
        )

        return TenderMatchScore(
            tender_id=tender.id,
            tender_code=tender.tender_id,
            title=tender.title,
            overall_match_score=overall_score,
            semantic_score=semantic_score_num,
            eligibility_score=hard_score_num,
            is_hard_eligible=is_hard_eligible,
            turnover_check=turnover_check,
            experience_check=experience_check,
            msme_benefit={
                "eligible_for_emd_exemption": is_msme and tender.msme_exemption,
                "emd_amount_saved_inr": tender.emd_amount_inr if (is_msme and tender.msme_exemption) else 0.0,
            },
            certifications_check=certifications_check,
            ai_rationale=rationale,
            risk_factors=risks,
        )

    def _cosine_similarity(self, vec1: Any, vec2: Any) -> float:
        """Calculates cosine similarity between two vectors."""
        try:
            a = np.array(vec1, dtype=np.float32)
            b = np.array(vec2, dtype=np.float32)
            dot = np.dot(a, b)
            norm_a = np.linalg.norm(a)
            norm_b = np.linalg.norm(b)
            if norm_a == 0 or norm_b == 0:
                return 0.5
            return float(dot / (norm_a * norm_b))
        except Exception as e:
            logger.warning(f"Error computing cosine similarity: {e}")
            return 0.5

    def _synthesize_rationale(
        self,
        score: int,
        hard_eligible: bool,
        turnover_check: dict,
        exp_check: dict,
        msme_applied: bool,
        semantic_score: int,
    ) -> str:
        if score >= 75:
            prefix = "High probability match. Your enterprise demonstrates strong qualification."
        elif score >= 50:
            prefix = "Moderate match with viable qualification prospects."
        else:
            prefix = "Low qualification compatibility; proceed with caution or partner via JV/Consortium."

        points = [prefix]
        if turnover_check["passed"]:
            points.append("Annual turnover meets tender financial threshold.")
        if exp_check["passed"]:
            points.append("Operational experience satisfies buyer minimum years.")
        if msme_applied:
            points.append("Beneficiary of MSME Public Procurement Policy relaxations (EMD waiver applicable).")
        points.append(f"Domain technical scope alignment scored at {semantic_score}%.")

        return " ".join(points)


tender_matcher = TenderMatchingEngine()
