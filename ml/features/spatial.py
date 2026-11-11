"""
Spatial Geometry Feature Extractor for Document Layout Analysis.
Extracts scale-invariant and position-normalized geometric descriptors from bounding boxes.
"""

from typing import Dict, Any, List
import numpy as np


class SpatialFeatureExtractor:
    """
    Extracts geometric and positional features from document bounding boxes.
    All coordinates are normalized relative to page dimensions [0, 1].
    """

    FEATURE_NAMES = [
        "norm_x0",
        "norm_y0",
        "norm_x1",
        "norm_y1",
        "norm_width",
        "norm_height",
        "aspect_ratio",
        "norm_area",
        "center_x",
        "center_y",
    ]

    def extract(self, bbox: List[float], page_width: float, page_height: float) -> np.ndarray:
        """
        Extract normalized spatial descriptors.

        Args:
            bbox: Bounding box [x0, y0, x1, y1] in points/pixels.
            page_width: Total page width.
            page_height: Total page height.

        Returns:
            np.ndarray of shape (10,) with spatial features.
        """
        x0, y0, x1, y1 = bbox
        pw = max(page_width, 1.0)
        ph = max(page_height, 1.0)

        # Scale coordinates to unit rectangle [0, 1]
        nx0 = max(0.0, min(1.0, x0 / pw))
        ny0 = max(0.0, min(1.0, y0 / ph))
        nx1 = max(0.0, min(1.0, x1 / pw))
        ny1 = max(0.0, min(1.0, y1 / ph))

        width = max(0.0, nx1 - nx0)
        height = max(0.0, ny1 - ny0)

        # Aspect ratio with epsilon to avoid division by zero
        aspect_ratio = width / (height + 1e-5)
        # Normalized area
        norm_area = width * height
        # Centroid
        center_x = (nx0 + nx1) / 2.0
        center_y = (ny0 + ny1) / 2.0

        return np.array([
            nx0,
            ny0,
            nx1,
            ny1,
            width,
            height,
            np.log1p(aspect_ratio),
            norm_area,
            center_x,
            center_y,
        ], dtype=np.float32)
