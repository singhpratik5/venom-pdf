"""
Unit tests for multimodal feature extractors.
"""

import pytest
import numpy as np

from ml.features import (
    SpatialFeatureExtractor,
    TypographicFeatureExtractor,
    VisualFeatureExtractor,
    MultimodalFeatureExtractor,
)


def test_spatial_feature_extractor():
    extractor = SpatialFeatureExtractor()
    bbox = [50.0, 100.0, 250.0, 300.0]
    features = extractor.extract(bbox, page_width=500.0, page_height=1000.0)

    assert features.shape == (10,)
    assert 0.0 <= features[0] <= 1.0  # norm_x0
    assert 0.0 <= features[1] <= 1.0  # norm_y0
    assert 0.0 <= features[2] <= 1.0  # norm_x1
    assert 0.0 <= features[3] <= 1.0  # norm_y1
    assert features[4] == pytest.approx(0.4)  # norm_width = 200 / 500
    assert features[5] == pytest.approx(0.2)  # norm_height = 200 / 1000


def test_typographic_feature_extractor():
    extractor = TypographicFeatureExtractor()
    text = "Section 3.2: Quantitative Evaluation Metrics"
    features = extractor.extract(text)

    assert features.shape == (7,)
    assert features[3] > 0.0  # Uppercase ratio
    assert features[4] > 0.0  # Digit ratio (3, 2)
    assert features[5] > 0.0  # Punctuation ratio (:, .)
    assert features[6] > 0.0  # Shannon entropy


def test_multimodal_feature_extractor():
    extractor = MultimodalFeatureExtractor()
    assert extractor.feature_dim == 22

    bbox = [10.0, 20.0, 100.0, 50.0]
    vec = extractor.extract_element(bbox, "Hello World", page_width=595.0, page_height=842.0)
    assert vec.shape == (22,)
    assert not np.isnan(vec).any()
