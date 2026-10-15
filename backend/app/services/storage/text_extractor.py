import os
from pathlib import Path
from typing import List, Tuple, Dict, Any
from ...core.logging import logger

try:
    import pypdf
    _PYPDF_AVAILABLE = True
except ImportError:
    _PYPDF_AVAILABLE = False

try:
    import docx
    _DOCX_AVAILABLE = True
except ImportError:
    _DOCX_AVAILABLE = False


class DocumentTextExtractor:
    """Extracts text content from various document formats and handles chunking."""

    def extract_text(self, file_path: str, ext: str) -> str:
        """Extract text from PDF, DOCX, TXT, or markdown files."""
        ext = ext.lower().lstrip(".")
        path = Path(file_path)

        if not path.exists():
            return ""

        if ext == "pdf" and _PYPDF_AVAILABLE:
            try:
                reader = pypdf.PdfReader(str(path))
                text_pages = [page.extract_text() or "" for page in reader.pages]
                return "\n\n".join(text_pages).strip()
            except Exception as e:
                logger.warning(f"pypdf extraction failed for {file_path}: {e}")

        elif ext in ("docx", "doc") and _DOCX_AVAILABLE:
            try:
                doc = docx.Document(str(path))
                return "\n".join([p.text for p in doc.paragraphs if p.text]).strip()
            except Exception as e:
                logger.warning(f"docx extraction failed for {file_path}: {e}")

        # Fallback to UTF-8 plain text reading
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read().strip()
        except Exception as e:
            logger.error(f"Failed to read file as text: {e}")
            return ""

    def chunk_text(
        self,
        raw_text: str,
        chunk_size_chars: int = 1000,
        overlap_chars: int = 150,
        metadata_prefix: Dict[str, Any] = None,
    ) -> List[Tuple[str, Dict[str, Any]]]:
        """
        Splits text into chunks with sliding window overlap.
        Returns list of tuples: (chunk_text, chunk_metadata)
        """
        if not raw_text or not raw_text.strip():
            return []

        chunks: List[Tuple[str, Dict[str, Any]]] = []
        start = 0
        text_len = len(raw_text)
        chunk_idx = 0

        while start < text_len:
            end = min(start + chunk_size_chars, text_len)
            
            # Try to break at a paragraph or sentence boundary if possible
            if end < text_len:
                boundary = raw_text.rfind("\n\n", start, end)
                if boundary != -1 and boundary > start + (chunk_size_chars // 2):
                    end = boundary + 2
                else:
                    period_boundary = raw_text.rfind(". ", start, end)
                    if period_boundary != -1 and period_boundary > start + (chunk_size_chars // 2):
                        end = period_boundary + 2

            chunk = raw_text[start:end].strip()
            if chunk:
                meta = dict(metadata_prefix or {})
                meta["chunk_index"] = chunk_idx
                meta["char_start"] = start
                meta["char_end"] = end
                chunks.append((chunk, meta))
                chunk_idx += 1

            if end >= text_len:
                break

            start = max(end - overlap_chars, start + 1)

        return chunks


text_extractor = DocumentTextExtractor()
