from typing import List
import numpy as np
from ...core.config import settings
from ...core.logging import logger

# Try importing fastembed for local embeddings; provide fallback if not installed yet
try:
    from fastembed import TextEmbedding
    _FASTEMBED_AVAILABLE = True
except ImportError:
    _FASTEMBED_AVAILABLE = False


class LocalEmbeddingService:
    """
    Local-first embedding generator producing 384-dimensional dense vectors.
    Uses fastembed (BAAI/bge-small-en-v1.5) locally.
    Includes a deterministic fallback vectorizer so the entire platform
    runs immediately even in zero-dependency or offline environments.
    """

    def __init__(self, model_name: str = settings.EMBEDDING_MODEL, dimension: int = settings.EMBEDDING_DIMENSION):
        self.model_name = model_name
        self.dimension = dimension
        self._model = None
        self._initialize_model()

    def _initialize_model(self):
        if _FASTEMBED_AVAILABLE:
            try:
                logger.info(f"Loading local embedding model: {self.model_name}")
                self._model = TextEmbedding(model_name=self.model_name)
                logger.info("Local embedding model loaded successfully.")
            except Exception as e:
                logger.warning(f"Could not initialize fastembed model: {e}. Using deterministic fallback.")
                self._model = None
        else:
            logger.info("fastembed not installed. Using local deterministic fallback vectorizer.")

    def get_embedding(self, text: str) -> List[float]:
        """Generates a 384-dimensional vector embedding for a single text string."""
        if not text or not text.strip():
            return [0.0] * self.dimension

        if self._model is not None:
            try:
                embeddings = list(self._model.embed([text]))
                vector = embeddings[0].tolist()
                return self._normalize(vector)
            except Exception as e:
                logger.error(f"Error generating fastembed vector: {e}. Falling back.")

        return self._deterministic_fallback_vector(text)

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Batch generates embeddings for multiple texts."""
        if not texts:
            return []

        if self._model is not None:
            try:
                embeddings = list(self._model.embed(texts))
                return [self._normalize(emb.tolist()) for emb in embeddings]
            except Exception as e:
                logger.error(f"Error in batch fastembed: {e}. Falling back.")

        return [self._deterministic_fallback_vector(t) for t in texts]

    def _normalize(self, vector: List[float]) -> List[float]:
        """L2 normalizes a vector to unit length."""
        arr = np.array(vector, dtype=np.float32)
        norm = np.linalg.norm(arr)
        if norm > 0:
            arr = arr / norm
        return arr.tolist()

    def _deterministic_fallback_vector(self, text: str) -> List[float]:
        """
        Creates a consistent, semantically-biased 384-dimensional unit vector
        based on hash seeds and keyword presence (e.g. CCTV, railway, cloud, software).
        Used when the deep learning weight files are not yet loaded.
        """
        vector = np.zeros(self.dimension, dtype=np.float32)
        tokens = text.lower().split()

        # Seed initial pseudo-features from tokens
        for token in tokens:
            token_hash = hash(token) % self.dimension
            vector[token_hash] += 1.0

        # Inject semantic cluster biases for Indian tender domains
        domain_clusters = {
            "cctv": 10, "surveillance": 11, "camera": 12, "nvr": 13, "security": 14,
            "railway": 30, "station": 31, "track": 32, "locomotive": 33,
            "cloud": 50, "server": 51, "datacenter": 52, "storage": 53, "san": 54,
            "software": 70, "hmis": 71, "hospital": 72, "health": 73, "portal": 74,
            "iot": 90, "sensor": 91, "lorawan": 92, "smart": 93, "environment": 94,
            "toll": 110, "fastag": 111, "anpr": 112, "expressway": 113, "nhai": 114,
            "iso": 130, "msme": 131, "turnover": 132, "experience": 133,
        }

        for word, idx in domain_clusters.items():
            if word in text.lower():
                vector[idx] += 3.5

        return self._normalize(vector.tolist())


embedding_service = LocalEmbeddingService()
