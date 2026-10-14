"""
API v1 Router aggregator
"""
from fastapi import APIRouter
from .auth import router as auth_router
from .company import router as company_router
from .tenders import router as tenders_router
from .matching import router as matching_router
from .documents import router as documents_router
from .bid_studio import router as bid_studio_router
from .tasks import router as tasks_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(company_router)
api_router.include_router(tenders_router)
api_router.include_router(matching_router)
api_router.include_router(documents_router)
api_router.include_router(bid_studio_router)
api_router.include_router(tasks_router)

__all__ = ["api_router"]
