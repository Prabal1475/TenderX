"""
Tender Ingestion Architecture Package
"""
from .base import BaseTenderAdapter
from .gem_adapter import GeMAdapter, gem_adapter
from .cppp_adapter import CPPPAdapter, cppp_adapter
from .bulk_importer import BulkImportAdapter, bulk_importer

__all__ = [
    "BaseTenderAdapter",
    "GeMAdapter",
    "gem_adapter",
    "CPPPAdapter",
    "cppp_adapter",
    "BulkImportAdapter",
    "bulk_importer",
]
