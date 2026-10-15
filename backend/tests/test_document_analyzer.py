import pytest
from app.services.storage.document_analyzer import DocumentAnalyzer

def test_document_analyzer_past_experience():
    analyzer = DocumentAnalyzer()
    sample_text = """
    NORTHERN RAILWAY HEADQUARTERS
    Baroda House, New Delhi
    Reference: NR/ENGG/2024/CCTV/781
    Date of Issue: 12 January 2025
    
    WORK COMPLETION CERTIFICATE
    This is to certify that M/s Apex Enterprise Solutions Pvt Ltd has satisfactorily
    completed the installation, commissioning and handover of Turnkey IP-CCTV
    Surveillance Network across 14 railway stations under Delhi Division.
    Total executed contract value: Rs. 4,50,00,000 (Four Crore Fifty Lakhs only).
    The performance during the DLP period has been found satisfactory.
    """
    
    analysis = analyzer.analyze_document(
        raw_text=sample_text,
        filename="Northern_Railway_Completion_Certificate.pdf",
        file_type="pdf",
        file_size_bytes=245000,
    )
    
    assert analysis["category"] == "Past_Experience"
    assert "Northern Railway" in analysis["doc_metadata"]["issuing_authority"]
    assert "NR/ENGG/2024/CCTV/781" in analysis["doc_metadata"]["reference_number"]
    assert "Cr" in analysis["doc_metadata"]["financial_value"] or "Lakh" in analysis["doc_metadata"]["financial_value"]
    assert len(analysis["summary"]) > 20
    assert analysis["doc_metadata"]["file_stats"]["file_type"] == "PDF"
    assert "Verified" in analysis["doc_metadata"]["verification_status"]

def test_document_analyzer_msme_udyam():
    analyzer = DocumentAnalyzer()
    sample_text = """
    GOVERNMENT OF INDIA
    MINISTRY OF MICRO, SMALL AND MEDIUM ENTERPRISES
    UDYAM REGISTRATION CERTIFICATE
    Udyam Registration Number: UDYAM-DL-03-0098765
    Name of Enterprise: Apex Enterprise Solutions Private Limited
    Major Activity: Services
    Type of Enterprise: Micro Enterprise
    Date of Registration: 15/06/2023
    """
    
    analysis = analyzer.analyze_document(
        raw_text=sample_text,
        filename="Udyam_Registration.pdf",
        file_type="pdf",
        file_size_bytes=120000,
    )
    
    assert analysis["category"] == "MSME_Udyam"
    assert "UDYAM-DL-03-0098765" in analysis["doc_metadata"]["reference_number"]
    assert "Micro" in analysis["doc_metadata"]["issuing_authority"] or "MSME" in analysis["doc_metadata"]["issuing_authority"]
    assert "EMD" in analysis["doc_metadata"]["financial_value"] or "Waiver" in analysis["doc_metadata"]["financial_value"]

def test_document_analyzer_financial_audit():
    analyzer = DocumentAnalyzer()
    sample_text = """
    INDEPENDENT AUDITOR'S REPORT
    To the Members of Apex Enterprise Solutions Pvt Ltd
    UDIN: 25098765AAAA1092
    We have audited the accompanying Balance Sheet as at March 31, 2025.
    The company reported an annual turnover of Rs 6.80 Cr and Net Worth of Rs 3.50 Cr.
    For S.K. Bansal & Associates, Chartered Accountants
    Date: 28/08/2025
    """
    
    analysis = analyzer.analyze_document(
        raw_text=sample_text,
        filename="Audited_Balance_Sheet_2025.pdf",
        file_type="pdf",
        file_size_bytes=580000,
    )
    
    assert analysis["category"] == "Financial_Audit"
    assert "UDIN" in analysis["doc_metadata"]["reference_number"]
    assert "Chartered Accountant" in analysis["doc_metadata"]["issuing_authority"] or "Auditor" in analysis["doc_metadata"]["issuing_authority"]
    assert "6.8" in analysis["doc_metadata"]["financial_value"] or "Cr" in analysis["doc_metadata"]["financial_value"]
