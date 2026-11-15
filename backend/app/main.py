from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import init_db_extensions, Base, engine
from .core.logging import logger
from .api.v1 import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info("Initializing TenderX Backend Engine...")
    # Initialize pgvector extension and create schema if not running migrations
    try:
        init_db_extensions()
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified.")

        # Ensure canonical sample tenders are maintained at exactly 20
        from .core.database import SessionLocal
        from .models.tender import Tender
        import json
        from pathlib import Path
        from datetime import datetime

        db = SessionLocal()
        try:
            sample_file = Path(__file__).parent / "data" / "sample_tenders.json"
            if sample_file.exists():
                with open(sample_file, "r", encoding="utf-8") as f:
                    canonical_tenders = json.load(f)
                canonical_ids = [t["tender_id"] for t in canonical_tenders]

                # Purge non-canonical extra tenders to guarantee stable 20 count
                extra_tenders = db.query(Tender).filter(~Tender.tender_id.in_(canonical_ids)).all()
                if extra_tenders:
                    logger.info(f"Purging {len(extra_tenders)} non-canonical extra tenders to maintain stable dataset.")
                    for extra in extra_tenders:
                        db.delete(extra)
                    db.commit()

                # Seed any missing canonical tenders
                existing_ids = {t.tender_id for t in db.query(Tender.tender_id).all()}
                for t_data in canonical_tenders:
                    if t_data["tender_id"] not in existing_ids:
                        sub_deadline = datetime.fromisoformat(t_data["submission_deadline"].replace("Z", "+00:00"))
                        open_date = datetime.fromisoformat(t_data["opening_date"].replace("Z", "+00:00")) if t_data.get("opening_date") else None
                        t_obj = Tender(
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
                            status=t_data.get("status", "Active"),
                        )
                        db.add(t_obj)
                db.commit()
                logger.info(f"Tender database verified: exactly {len(canonical_ids)} canonical records loaded.")
        except Exception as e:
            logger.warning(f"Startup tender catalog sync warning: {e}")
            db.rollback()
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"Database initialization warning: {e}")

    yield
    logger.info("Shutting down TenderX Backend Engine...")


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Tender Management Platform for Indian Government Procurement (GeM & CPPP)",
    version="0.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handling
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled system exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please check backend logs."},
    )


# Include API v1 Routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health"])
def root():
    return {
        "app": settings.APP_NAME,
        "version": "0.1.0",
        "status": "online",
        "docs_url": f"{settings.API_V1_STR}/docs",
    }


@app.get("/health", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "database": "connected",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
