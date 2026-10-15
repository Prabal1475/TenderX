import os
import uuid
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile
from ...core.config import settings
from ...core.logging import logger


class LocalFileManager:
    """Manages uploaded files in local storage volume."""

    def __init__(self, base_upload_dir: str = settings.UPLOAD_DIR):
        self.base_upload_dir = Path(base_upload_dir)
        self.base_upload_dir.mkdir(parents=True, exist_ok=True)

    async def save_uploaded_file(
        self,
        file: UploadFile,
        user_id: str,
    ) -> Tuple[str, str, int, str]:
        """
        Saves an uploaded file to storage.
        Returns: (stored_path, original_filename, file_size_bytes, extension)
        """
        user_dir = self.base_upload_dir / str(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)

        original_filename = file.filename or "uploaded_document"
        ext = Path(original_filename).suffix.lstrip(".").lower() or "txt"

        unique_filename = f"{uuid.uuid4().hex}_{original_filename}"
        target_path = user_dir / unique_filename

        content = await file.read()
        size = len(content)

        with open(target_path, "wb") as f:
            f.write(content)

        logger.info(f"Saved file {original_filename} ({size} bytes) to {target_path}")
        return str(target_path), original_filename, size, ext

    def delete_file(self, stored_path: str) -> bool:
        """Deletes a file from disk if present."""
        try:
            p = Path(stored_path)
            if p.exists() and p.is_file():
                p.unlink()
                logger.info(f"Deleted file {stored_path}")
                return True
        except Exception as e:
            logger.warning(f"Could not delete file {stored_path}: {e}")
        return False


file_manager = LocalFileManager()
