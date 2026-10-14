import os
import sys
import json
from pathlib import Path
from datetime import datetime, timezone, timedelta

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.database import SessionLocal, init_db_extensions, Base, engine
from app.core.security import get_password_hash
from app.core.logging import logger
from app.models.user import User
from app.models.company import CompanyProfile
from app.models.tender import Tender
from app.models.task import TenderTask
from app.models.document import CompanyDocument, DocumentChunk
from app.services.ai.embeddings import embedding_service


def seed_database():
    logger.info("Initializing database extension and tables...")
    init_db_extensions()
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Seed Superuser
        admin_email = settings.FIRST_SUPERUSER_EMAIL.lower()
        admin_user = db.query(User).filter(User.email == admin_email).first()

        if not admin_user:
            logger.info(f"Creating default superuser: {admin_email}")
            admin_user = User(
                email=admin_email,
                hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
                full_name=settings.FIRST_SUPERUSER_NAME,
                is_active=True,
                is_superuser=True,
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
        else:
            logger.info(f"Superuser {admin_email} already exists.")

        # 2. Seed Company Profile
        profile = db.query(CompanyProfile).filter(CompanyProfile.user_id == admin_user.id).first()
        if not profile:
            logger.info("Creating default Company Profile...")
            competencies = (
                "Turnkey system integration, enterprise software development, cloud migration, "
                "CCTV and IP surveillance systems, campus networking, AI video analytics, and multi-year AMC support for government PSUs."
            )
            profile_embedding = embedding_service.get_embedding(f"Apex Technologies Pvt Ltd. {competencies}")

            profile = CompanyProfile(
                user_id=admin_user.id,
                company_name="Apex Enterprise Solutions Pvt Ltd",
                pan_number="AAACA9876K",
                gst_number="07AAACA9876K1Z9",
                udyam_msme_number="UDYAM-DL-01-0098765",
                is_msme="Micro",
                annual_turnover_cr=6.5,
                net_worth_cr=3.2,
                years_of_experience=6,
                sectors=[
                    "IT Infrastructure",
                    "CCTV Surveillance",
                    "Software Solutions",
                    "Smart City & IoT",
                ],
                certifications=[
                    "ISO 9001:2015",
                    "ISO 27001:2022",
                    "CMMI Level 3",
                    "ISO 20000-1",
                ],
                key_clients=[
                    "Northern Railway",
                    "Bharat Electronics Limited (BEL)",
                    "Delhi Metro Rail Corporation (DMRC)",
                ],
                core_competencies=competencies,
                profile_embedding=profile_embedding,
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)
            logger.info("Company profile initialized.")

        # 3. Seed Realistic Indian Tenders
        data_path = Path(__file__).parent.parent / "app" / "data" / "sample_tenders.json"
        if data_path.exists():
            with open(data_path, "r", encoding="utf-8") as f:
                sample_tenders = json.load(f)

            for t_data in sample_tenders:
                existing = db.query(Tender).filter(Tender.tender_id == t_data["tender_id"]).first()
                if not existing:
                    logger.info(f"Seeding tender: {t_data['tender_id']} - {t_data['title'][:40]}...")
                    scope_text = f"{t_data['title']} {t_data.get('description', '')} {t_data.get('category', '')} {t_data.get('authority', '')}"
                    sub_deadline = datetime.fromisoformat(t_data["submission_deadline"].replace("Z", "+00:00"))
                    open_date = datetime.fromisoformat(t_data["opening_date"].replace("Z", "+00:00")) if t_data.get("opening_date") else None

                    tender_obj = Tender(
                        tender_id=t_data["tender_id"],
                        title=t_data["title"],
                        authority=t_data["authority"],
                        portal=t_data["portal"],
                        category=t_data["category"],
                        estimated_value_inr=t_data["estimated_value_inr"],
                        emd_amount_inr=t_data["emd_amount_inr"],
                        msme_exemption=t_data["msme_exemption"],
                        startup_exemption=t_data["startup_exemption"],
                        submission_deadline=sub_deadline,
                        opening_date=open_date,
                        location_state=t_data.get("location_state", "All India"),
                        description=t_data.get("description"),
                        document_url=t_data.get("document_url"),
                        eligibility_criteria=t_data.get("eligibility_criteria"),
                        scope_embedding=embedding_service.get_embedding(scope_text),
                        status=t_data.get("status", "Active"),
                    )
                    db.add(tender_obj)
                    db.commit()
                    db.refresh(tender_obj)

                    # Create sample tasks for the seeded tender
                    t_task = TenderTask(
                        tender_id=tender_obj.id,
                        user_id=admin_user.id,
                        title=f"Review Technical Specifications for {tender_obj.tender_id}",
                        category="Technical_Bid",
                        due_date=sub_deadline - timedelta(days=5),
                        priority="High",
                    )
                    db.add(t_task)

            db.commit()
            logger.info("Sample tenders seeded successfully.")

        # 4. Seed sample credential documents into Document Vault
        existing_doc = db.query(CompanyDocument).filter(CompanyDocument.user_id == admin_user.id).first()
        if not existing_doc:
            logger.info("Seeding sample company credential document and chunks...")
            sample_doc = CompanyDocument(
                user_id=admin_user.id,
                filename="Northern_Railway_CCTV_Completion_Certificate.pdf",
                stored_path="storage/uploads/sample_cert.pdf",
                file_type="pdf",
                file_size_bytes=1024 * 250,
                category="Past_Experience",
                title="Railway CCTV Turnkey Project Completion Certificate",
                summary="Completion certificate issued by Northern Railway for turnkey IP CCTV installation across 12 stations.",
                tags=["Railway", "CCTV", "Surveillance", "Past_Performance"],
            )
            db.add(sample_doc)
            db.commit()
            db.refresh(sample_doc)

            sample_chunks = [
                "This is to certify that Apex Enterprise Solutions Pvt Ltd has successfully completed the supply, installation, testing and commissioning of Integrated CCTV Surveillance Systems across 12 railway stations under Delhi Division against Contract Ref No: NR/SIG/2023/CCTV/089. Total contract value: INR 2.85 Crores. Performance during defect liability period is rated EXCELLENT.",
                "Apex Enterprise Solutions deployed 450 high-definition 4MP IP cameras with IR night vision, 16-channel network video recorders (NVR), gigabit PoE switches, and redundant optical fiber ring topology with zero downtime.",
                "Quality management certifications: Apex Enterprise Solutions maintains active ISO 9001:2015, ISO 27001:2022, and CMMI Level 3 accreditations ensuring institutional process adherence and software security hardening."
            ]

            for idx, text in enumerate(sample_chunks):
                chunk = DocumentChunk(
                    document_id=sample_doc.id,
                    chunk_index=idx,
                    content=text,
                    chunk_metadata={"page": idx + 1, "section": "Experience Certificate"},
                    embedding=embedding_service.get_embedding(text),
                )
                db.add(chunk)
            db.commit()
            logger.info("Sample credentials and embeddings indexed.")

        logger.info("\n=======================================================")
        logger.info("Database Seeding Completed Successfully!")
        logger.info(f"Default User Email:    {settings.FIRST_SUPERUSER_EMAIL}")
        logger.info(f"Default User Password: {settings.FIRST_SUPERUSER_PASSWORD}")
        logger.info("=======================================================\n")

    except Exception as e:
        logger.error(f"Seeding failed: {e}", exc_info=True)
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
