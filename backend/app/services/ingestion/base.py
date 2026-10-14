from abc import ABC, abstractmethod
from typing import List, Dict, Any
from datetime import datetime
from ...schemas.tender import TenderCreate
from ...core.logging import logger


class BaseTenderAdapter(ABC):
    """
    Abstract Base Class for Indian Tender Ingestion Sources.
    Ensures every portal adapter (GeM, CPPP, State) normalizes raw feed payloads
    into a validated TenderCreate schema.
    """

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Name of the portal / ingestion source."""
        pass

    @abstractmethod
    async def fetch_raw_tenders(self, **kwargs) -> List[Dict[str, Any]]:
        """Fetch raw tender records from API, scraper, or mock stream."""
        pass

    @abstractmethod
    def normalize_tender(self, raw_data: Dict[str, Any]) -> TenderCreate:
        """Normalize platform-specific raw dictionary into TenderCreate schema."""
        pass

    async def ingest(self, **kwargs) -> List[TenderCreate]:
        """Orchestrates fetching, normalizing, and validating tenders."""
        logger.info(f"Starting tender ingestion via {self.source_name} adapter...")
        raw_items = await self.fetch_raw_tenders(**kwargs)
        normalized_tenders: List[TenderCreate] = []

        for item in raw_items:
            try:
                tender_obj = self.normalize_tender(item)
                normalized_tenders.append(tender_obj)
            except Exception as e:
                logger.warning(
                    f"Failed to normalize tender record from {self.source_name}: {e}. Record: {item.get('tender_id', 'Unknown')}"
                )

        logger.info(
            f"Successfully normalized {len(normalized_tenders)} of {len(raw_items)} tenders from {self.source_name}."
        )
        return normalized_tenders
