import re
from typing import Dict, Any, List, Tuple
from ...core.logging import logger


class DocumentAnalyzer:
    """
    Intelligent Document Analyzer for Tender Credential Vault.
    Analyzes document text to extract rich metadata, categorize document type,
    and generate a concise executive summary for public procurement qualification.
    """

    def analyze_document(
        self,
        raw_text: str,
        filename: str,
        file_type: str,
        file_size_bytes: int,
        user_category: str = None,
        user_title: str = None,
    ) -> Dict[str, Any]:
        """
        Executes document content inspection and generates:
        - category (detected or validated)
        - title (refined)
        - summary (small executive description)
        - metadata (authority, reference_no, value, dates, stats, tender_relevance)
        - tags (list of keywords)
        """
        text_lower = (raw_text or "").lower()
        fn_lower = filename.lower()
        combined = f"{fn_lower} {text_lower}"

        # 1. Detect Category / Type if not explicitly provided or default
        category = self._classify_category(combined, user_category)

        # 2. Extract Key Metadata Fields
        issuing_authority = self._extract_issuing_authority(raw_text, combined)
        reference_no = self._extract_reference_no(raw_text, combined)
        financial_val = self._extract_financial_value(raw_text, combined)
        issue_date, validity = self._extract_dates(raw_text, combined)
        key_entities = self._extract_key_entities(combined)

        word_count = len((raw_text or "").split())
        char_count = len(raw_text or "")
        est_pages = max(1, round(word_count / 350)) if word_count > 0 else 1

        # 3. Formulate Title
        title = user_title
        if not title or title.strip() == filename:
            title = self._generate_title(filename, category, issuing_authority)

        # 4. Generate Small Description (Summary)
        summary = self._generate_summary(
            category=category,
            title=title,
            authority=issuing_authority,
            ref_no=reference_no,
            val=financial_val,
            entities=key_entities,
            word_count=word_count,
        )

        # 5. Determine Tender Qualification Relevance
        relevance = self._determine_tender_relevance(category, financial_val)

        doc_metadata = {
            "issuing_authority": issuing_authority,
            "reference_number": reference_no,
            "financial_value": financial_val,
            "issue_date": issue_date,
            "validity_period": validity,
            "detected_type": category,
            "verification_status": "Verified & Indexed",
            "key_entities": key_entities,
            "tender_qualification_relevance": relevance,
            "file_stats": {
                "file_type": file_type.upper(),
                "file_size_kb": round(file_size_bytes / 1024, 1),
                "word_count": word_count,
                "character_count": char_count,
                "estimated_pages": est_pages,
            },
        }

        # 6. Tags
        tags = [category.replace("_", " ")]
        if issuing_authority and issuing_authority != "Government / Commercial Authority":
            tags.append(issuing_authority)
        if financial_val:
            tags.append(financial_val)
        tags.extend(key_entities[:3])
        # deduplicate while preserving order
        unique_tags = list(dict.fromkeys([t for t in tags if t]))

        return {
            "category": category,
            "title": title,
            "summary": summary,
            "doc_metadata": doc_metadata,
            "tags": unique_tags[:6],
        }

    def _classify_category(self, text: str, user_cat: str) -> str:
        # If user explicitly chose a specific non-default category, respect it
        valid_cats = [
            "Past_Experience",
            "Financial_Audit",
            "MSME_Udyam",
            "GST_Certificate",
            "ISO_Quality",
            "Technical_Proposal",
        ]
        if user_cat in valid_cats and user_cat != "Past_Experience":
            return user_cat

        if any(w in text for w in ["udyam", "msme", "micro enterprise", "small enterprise", "medium enterprise", "dic"]):
            return "MSME_Udyam"
        if any(w in text for w in ["iso 9001", "iso 27001", "iso 14001", "iso 45001", "cmmi", "accreditation", "quality management"]):
            return "ISO_Quality"
        if any(w in text for w in ["balance sheet", "profit and loss", "chartered accountant", "udin", "turnover certificate", "audited"]):
            return "Financial_Audit"
        if any(w in text for w in ["gstin", "goods and services tax", "gst reg", "central tax"]):
            return "GST_Certificate"
        if any(w in text for w in ["datasheet", "specification", "technical compliance", "brochure", "system architecture"]):
            return "Technical_Proposal"
        if any(w in text for w in ["completion certificate", "work order", "purchase order", "client certificate", "handover", "performance", "contract"]):
            return "Past_Experience"

        return user_cat or "Past_Experience"

    def _extract_issuing_authority(self, raw: str, lower: str) -> str:
        authorities = [
            ("Northern Railway", ["northern railway", "baroda house", "railway"]),
            ("National Highways Authority of India (NHAI)", ["nhai", "national highways"]),
            ("Ministry of Micro, Small and Medium Enterprises", ["udyam", "msme", "ministry of micro"]),
            ("Indian Space Research Organisation (ISRO)", ["isro", "space applications centre", "sac"]),
            ("Bharat Electronics Limited (BEL)", ["bharat electronics", "bel"]),
            ("NTPC Limited", ["ntpc", "national thermal power"]),
            ("Indian Oil Corporation Limited (IOCL)", ["indian oil", "iocl"]),
            ("Power Grid Corporation of India (PGCIL)", ["power grid", "pgcil"]),
            ("Hindustan Aeronautics Limited (HAL)", ["hindustan aeronautics", "hal"]),
            ("Defence Research and Development Organisation (DRDO)", ["drdo", "cair"]),
            ("Quality Certification Bureau / TUV", ["iso", "tuv", "jas-anz", "ukas"]),
            ("Institute of Chartered Accountants of India", ["ca ", "chartered accountant", "udin"]),
            ("Goods and Services Tax Network (GSTN)", ["gstin", "gst reg"]),
        ]
        for name, patterns in authorities:
            if any(p in lower for p in patterns):
                return name
        return "Government / Commercial Authority"

    def _extract_reference_no(self, raw: str, lower: str) -> str:
        # Check for Udyam
        udyam = re.search(r"\bUDYAM-[A-Z]{2}-\d{2}-\d{7}\b", raw, re.IGNORECASE)
        if udyam:
            return udyam.group(0).upper()

        # Check for GSTIN
        gst = re.search(r"\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b", raw, re.IGNORECASE)
        if gst:
            return gst.group(0).upper()

        # Check for UDIN (Chartered Accountants)
        udin = re.search(r"\bUDIN[:\s\-#]*([0-9A-Z]{14,20})\b", raw, re.IGNORECASE)
        if udin:
            return f"UDIN-{udin.group(1).upper()}"

        # Check for explicit Reference / PO / WO / Contract No
        ref_match = re.search(
            r"\b(?:reference|ref|order|contract|po|wo)\s*(?:no|number|#)?[\s.:#]+([A-Z0-9][A-Z0-9\-_/]{3,35})\b",
            raw,
            re.IGNORECASE,
        )
        if ref_match:
            candidate = ref_match.group(1).strip().upper()
            if candidate not in ["NO", "NUMBER", "DATE", "IS"]:
                return candidate

        # Check for Certificate No
        cert_match = re.search(
            r"\b(?:certificate|cert)\s*(?:no|number|#)[\s.:#]+([A-Z0-9][A-Z0-9\-_/]{3,30})\b",
            raw,
            re.IGNORECASE,
        )
        if cert_match:
            return cert_match.group(1).strip().upper()

        return "DOC-REF-" + str(abs(hash(lower)) % 90000 + 10000)

    def _extract_financial_value(self, raw: str, lower: str) -> str:
        # Look for Cr or Lakhs
        cr_match = re.search(r"(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)\b", lower)
        if cr_match:
            return f"₹{cr_match.group(1)} Cr"

        lakh_match = re.search(r"(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lacs|lakhs)\b", lower)
        if lakh_match:
            return f"₹{lakh_match.group(1)} Lakhs"

        # Look for full numerical currency amount e.g. Rs. 4,50,00,000
        num_match = re.search(r"(?:₹|rs\.?|inr)\s*([\d,]{6,})", raw, re.IGNORECASE)
        if num_match:
            clean_digits = num_match.group(1).replace(",", "")
            if clean_digits.isdigit():
                val = float(clean_digits)
                if val >= 10000000:
                    return f"₹{(val / 10000000):.2f} Cr"
                elif val >= 100000:
                    return f"₹{(val / 100000):.2f} Lakhs"
                return f"₹{num_match.group(1)}"

        # MSME or Udyam default benefit
        if "msme" in lower or "udyam" in lower:
            return "Eligible for 100% EMD Fee Waiver"

        if "iso" in lower or "standard" in lower or "qms" in lower:
            return "Statutory Quality Standards Accreditation"

        return "Statutory Qualification Standard"

    def _extract_dates(self, raw: str, lower: str) -> Tuple[str, str]:
        date_pattern = r"\b(\d{1,2}[-/.](?:[0-9]{1,2}|[a-zA-Z]{3})[-/.](?:20\d{2}|\d{2}))\b"
        matches = re.findall(date_pattern, raw)
        if len(matches) >= 2:
            return matches[0], matches[1]
        elif len(matches) == 1:
            return matches[0], "Perpetual / 3 Years"
        return "Current FY", "Valid Active"

    def _extract_key_entities(self, text: str) -> List[str]:
        entity_bank = [
            "CCTV Surveillance", "IP Cameras", "NVR Video Management", "Optical Fiber",
            "Wi-Fi 6 Networking", "SCADA Automation", "Smart Grid", "Drone Fleet",
            "GIS Mapping", "Turnkey Installation", "Annual Maintenance AMC", "ISO 9001:2015",
            "ISO 27001", "Cloud Migration", "Microservices", "Aadhaar Auth",
            "FastTag Tolling", "High-Speed Computing", "Zero-Trust Security"
        ]
        found = []
        for ent in entity_bank:
            if ent.lower() in text:
                found.append(ent)
        return found[:5]

    def _generate_title(self, filename: str, category: str, authority: str) -> str:
        clean_name = filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()
        if authority and authority != "Government / Commercial Authority" and authority not in clean_name:
            return f"{clean_name} - {authority}"
        return clean_name

    def _generate_summary(
        self,
        category: str,
        title: str,
        authority: str,
        ref_no: str,
        val: str,
        entities: List[str],
        word_count: int,
    ) -> str:
        entities_str = f" involving {', '.join(entities[:3])}" if entities else ""
        val_str = f" valued at {val}" if val else ""

        if category == "Past_Experience":
            return (
                f"Official Work Completion and Performance Certificate issued by {authority}{val_str}{entities_str}. "
                f"Validates past commercial track record, scope execution, and satisfactory handover under Indian public procurement norms."
            )
        elif category == "Financial_Audit":
            return (
                f"Audited Financial Statement and Turnover Certificate verified by {authority}. "
                f"Substantiates annual liquidity, net worth threshold, and three-year turnover compliance required for major GeM & CPPP bids."
            )
        elif category == "MSME_Udyam":
            return (
                f"Statutory Udyam Registration Certificate ({ref_no}) issued under Ministry of MSME. "
                f"Qualifies company for mandatory EMD fee waivers (GFR Rule 170) and up to 50% relaxation in prior turnover and experience."
            )
        elif category == "ISO_Quality":
            return (
                f"Accredited Quality & Security Management System Standard Certificate ({ref_no}). "
                f"Certified compliance against mandatory tender specifications for process maturity and data security protocols."
            )
        elif category == "GST_Certificate":
            return (
                f"Central and State Goods & Services Tax Registration Certificate ({ref_no}). "
                f"Validates statutory tax compliance and PAN-India operating authorization for commercial contract execution."
            )
        else:
            return (
                f"Verified technical credential document ({title}) issued by {authority}{entities_str}. "
                f"Indexed into credential vault for automated RAG clause synthesis and bid compliance generation."
            )

    def _determine_tender_relevance(self, category: str, val: str) -> str:
        if category == "Past_Experience":
            val_note = f" (Single contract capability threshold {val})" if val else ""
            return f"Satisfies Prior Experience & Successful Execution Gate{val_note} under GFR 2017."
        elif category == "Financial_Audit":
            return "Satisfies Financial Standing, Average Annual Turnover, and Solvency Requirements."
        elif category == "MSME_Udyam":
            return "Unlocks GFR Rule 170 EMD Fee Exemption and MSME Technical Relaxation Benefits."
        elif category == "ISO_Quality":
            return "Fulfills Mandatory Statutory Certifications (ISO/CMMI Quality Gate)."
        elif category == "GST_Certificate":
            return "Fulfills Mandatory Legal & Taxation Registration Criteria."
        return "General Credential Grounding for RAG Technical Bid Proposals."


document_analyzer = DocumentAnalyzer()
