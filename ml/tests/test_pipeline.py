"""
Unit tests for layout inference engine, contrast optimizer, and visualizer.
"""

import os
import tempfile
import pytest
from PIL import Image

from ml.pipeline import DocumentLayoutEngine, ContrastOptimizer, LayoutVisualizer


def test_layout_engine_analysis():
    engine = DocumentLayoutEngine()
    elements = [
        {"id": "e1", "bbox": [50, 50, 450, 80], "text": "1. Introduction to Neural Document Intelligence"},
        {"id": "e2", "bbox": [50, 100, 450, 250], "text": "We evaluate multimodal layout models across accuracy and latency metrics."},
    ]

    res = engine.analyze_elements(elements, page_width=595.0, page_height=842.0)
    assert res["element_count"] == 2
    assert len(res["elements"]) == 2
    assert "summary" in res
    assert res["elements"][0]["label"] in ["heading", "paragraph", "table", "figure", "formula", "code_block"]
    assert 0.0 <= res["elements"][0]["confidence"] <= 1.0


def test_contrast_optimizer():
    optimizer = ContrastOptimizer()

    # White on Black
    cr_high = optimizer.contrast_ratio((0, 0, 0), (255, 255, 255))
    assert cr_high == pytest.approx(21.0, rel=1e-2)

    # Black on Black
    cr_low = optimizer.contrast_ratio((0, 0, 0), (0, 0, 0))
    assert cr_low == pytest.approx(1.0, rel=1e-2)

    # Adaptive optimization
    res = optimizer.optimize_theme_for_layout((30, 30, 30), (212, 212, 212), {"formula": 8, "table": 4})
    assert res["wcag_aaa_compliant"] is True
    assert res["fine_stroke_adaptive_boost"] > 1.0


def test_layout_visualizer():
    visualizer = LayoutVisualizer()
    elements = [
        {"id": "e1", "bbox": [50, 50, 200, 100], "label": "heading", "confidence": 0.95, "color": "#38bdf8"}
    ]

    with tempfile.TemporaryDirectory() as tmp_dir:
        out_png = os.path.join(tmp_dir, "overlay.png")
        visualizer.save_annotated_page(elements, out_png, page_width=400, page_height=600)
        assert os.path.exists(out_png)
        with Image.open(out_png) as img:
            assert img.size == (600, 900)  # 1.5x scale
