"""
Unified Multimodal Feature Extraction Pipeline for Document Elements.
Fuses spatial geometry, typographic linguistics, and visual textures into a single vector.
"""

from typing import List, Optional, Dict, Any
import numpy as np
from PIL import Image

from .spatial import SpatialFeatureExtractor
from .typographic import TypographicFeatureExtractor
from .visual import VisualFeatureExtractor


class MultimodalFeatureExtractor:
    """
    Combines spatial (10 dims), typographic (7 dims), and visual (5 dims)
    into a unified 22-dimensional feature representation per document element.
    """

    def __init__(self):
        self.spatial = SpatialFeatureExtractor()
        self.typographic = TypographicFeatureExtractor()
        self.visual = VisualFeatureExtractor()

        self.feature_names = (
            [f"spatial_{name}" for name in self.spatial.FEATURE_NAMES]
            + [f"typo_{name}" for name in self.typographic.FEATURE_NAMES]
            + [f"visual_{name}" for name in self.visual.FEATURE_NAMES]
        )

    @property
    def feature_dim(self) -> int:
        return len(self.feature_names)

    def extract_element(
        self,
        bbox: List[float],
        text: str,
        page_width: float,
        page_height: float,
        image_crop: Optional[Image.Image] = None,
    ) -> np.ndarray:
        """
        Extract complete multimodal feature vector for a single document region.
        """
        s_feat = self.spatial.extract(bbox, page_width, page_height)
        t_feat = self.typographic.extract(text)
        v_feat = self.visual.extract(image_crop)

        return np.concatenate([s_feat, t_feat, v_feat], axis=0).astype(np.float32)

    def extract_batch(
        self,
        elements: List[Dict[str, Any]],
        page_width: float,
        page_height: float,
    ) -> np.ndarray:
        """
        Extract feature matrix for a list of document element dicts.
        """
        vectors = []
        for el in elements:
            bbox = el.get("bbox", [0.0, 0.0, 100.0, 50.0])
            text = el.get("text", "")
            crop = el.get("image_crop", None)
            vec = self.extract_element(bbox, text, page_width, page_height, crop)
            vectors.append(vec)

        if not vectors:
            return np.empty((0, self.feature_dim), dtype=np.float32)

        return np.stack(vectors, axis=0)
