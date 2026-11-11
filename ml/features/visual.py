"""
Visual Texture and Pixel Density Feature Extractor.
Extracts visual descriptors such as edge gradient magnitude, luminance distribution,
and fill density from rendered document crops.
"""

from typing import Optional
import numpy as np
from PIL import Image


class VisualFeatureExtractor:
    """
    Extracts statistical visual features from an image crop or synthesizes them
    from element geometry when rendering raster is omitted.
    """

    FEATURE_NAMES = [
        "mean_luminance",
        "luminance_variance",
        "edge_density",
        "foreground_fill_ratio",
        "color_saturation",
    ]

    def extract(self, image_crop: Optional[Image.Image] = None) -> np.ndarray:
        """
        Extract visual features from a bounding box image crop.

        Args:
            image_crop: PIL Image of the cropped region (optional).

        Returns:
            np.ndarray of shape (5,) with visual features.
        """
        if image_crop is None:
            # Neutral / default prior
            return np.array([0.9, 0.05, 0.02, 0.15, 0.0], dtype=np.float32)

        # Convert to RGB array
        arr = np.asarray(image_crop.convert("RGB"), dtype=np.float32) / 255.0
        h, w, c = arr.shape
        if h == 0 or w == 0:
            return np.array([0.9, 0.05, 0.02, 0.15, 0.0], dtype=np.float32)

        # Grayscale luminance (Rec. 601)
        gray = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
        mean_lum = float(np.mean(gray))
        lum_var = float(np.std(gray))

        # Simple discrete horizontal and vertical edge gradients (Sobel approximation)
        if h > 2 and w > 2:
            dx = np.abs(gray[:, 1:] - gray[:, :-1])
            dy = np.abs(gray[1:, :] - gray[:-1, :])
            edge_density = float((np.mean(dx) + np.mean(dy)) / 2.0)
        else:
            edge_density = 0.0

        # Foreground fill ratio: pixels darker than 0.85
        foreground_pixels = np.sum(gray < 0.85)
        fill_ratio = float(foreground_pixels / (h * w))

        # Color saturation
        max_c = np.max(arr, axis=2)
        min_c = np.min(arr, axis=2)
        saturation = np.mean(np.where(max_c > 0, (max_c - min_c) / (max_c + 1e-5), 0.0))

        return np.array([
            mean_lum,
            min(1.0, lum_var * 2.0),
            min(1.0, edge_density * 5.0),
            fill_ratio,
            min(1.0, float(saturation)),
        ], dtype=np.float32)
