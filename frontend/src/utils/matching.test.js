import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { calculateTenderMatch } from "./matching.js";

describe("Tender Matching Engine - Frontend Tests", () => {
  const mockCompany = {
    company_name: "Apex Technologies",
    annual_turnover_cr: 6.5,
    years_of_experience: 6,
    is_msme: "Micro",
  };

  test("handles null or empty tender safely", () => {
    const res = calculateTenderMatch(null, mockCompany);
    assert.equal(res.overall_match_score, 50);
    assert.equal(res.is_hard_eligible, false);
  });

  test("returns predefined high match for GEM railway CCTV tender", () => {
    const res = calculateTenderMatch({ id: "gem-railway-cctv-01" }, mockCompany);
    assert.equal(res.overall_match_score, 94);
    assert.equal(res.is_hard_eligible, true);
  });

  test("returns predefined low match for CPPP NHAI FASTag tender", () => {
    const res = calculateTenderMatch({ id: "cppp-nhai-fastag-02" }, mockCompany);
    assert.equal(res.overall_match_score, 42);
    assert.equal(res.is_hard_eligible, false);
  });

  test("preserves existing pre-evaluated match score from backend", () => {
    const tender = {
      id: "custom-tender-99",
      overall_match_score: 88,
      is_hard_eligible: true,
    };
    const res = calculateTenderMatch(tender, mockCompany);
    assert.equal(res.overall_match_score, 88);
    assert.equal(res.is_hard_eligible, true);
  });

  test("calculates eligible score for qualified tender without MSME relaxation", () => {
    const tender = {
      id: "tender-accessible-01",
      eligibility_criteria: {
        min_turnover_cr: 5.0,
        min_experience_years: 4,
      },
      msme_exemption: false,
    };
    const res = calculateTenderMatch(tender, mockCompany);
    assert.equal(res.is_hard_eligible, true);
    assert.ok(res.overall_match_score >= 80);
  });

  test("applies MSME turnover relaxation under Indian Public Procurement rules (GFR)", () => {
    const highTurnoverTender = {
      id: "tender-msme-relaxed-01",
      eligibility_criteria: {
        min_turnover_cr: 10.0, // company has 6.5, normally fails (6.5 < 10)
        min_experience_years: 4,
      },
      msme_exemption: true, // 50% relaxation -> 5.0 Cr required
    };
    const res = calculateTenderMatch(highTurnoverTender, mockCompany);
    assert.equal(res.is_hard_eligible, true);
    assert.equal(res.overall_match_score, 76);
  });

  test("flags hard ineligible when company turnover is below even MSME relaxation limit", () => {
    const impossibleTender = {
      id: "tender-impossible-01",
      eligibility_criteria: {
        min_turnover_cr: 25.0, // 50% relaxation is 12.5 Cr > 6.5 Cr
        min_experience_years: 4,
      },
      msme_exemption: true,
    };
    const res = calculateTenderMatch(impossibleTender, mockCompany);
    assert.equal(res.is_hard_eligible, false);
    assert.ok(res.overall_match_score < 60);
  });
});
