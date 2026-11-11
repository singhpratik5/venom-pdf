"""
High-Performance Document Layout Inference Engine.
Executes serialized ONNX models using ONNX Runtime for microsecond page element classification.
"""

import os
from typing import List, Dict, Any, Optional
import numpy as np
import onnxruntime as ort

from ..data import LAYOUT_CLASSES, ID_TO_CLASS
from ..features import MultimodalFeatureExtractor

# Visual color mapping for layout element classes
CLASS_COLORS = {
    "paragraph": "#4ade80",   # Soft emerald green
    "heading": "#38bdf8",     # Cyan blue
    "table": "#f59e0b",       # Amber
    "figure": "#ec4899",      # Pink
    "formula": "#a855f7",     # Violet
    "code_block": "#06b6d4",   # Deep teal
}


class DocumentLayoutEngine:
    """
    Production inference engine for document layout classification using ONNX Runtime.
    """

    def __init__(self, onnx_model_path: Optional[str] = None):
        self.feature_extractor = MultimodalFeatureExtractor()

        if onnx_model_path is None:
            # Default weights location
            current_dir = os.path.dirname(os.path.abspath(__file__))
            onnx_model_path = os.path.join(current_dir, "..", "models", "weights", "layout_classifier.onnx")

        self.model_path = onnx_model_path
        self.session: Optional[ort.InferenceSession] = None

        if os.path.exists(self.model_path):
            self._init_session()

    def _init_session(self):
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 2
        opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        self.session = ort.InferenceSession(self.model_path, opts, providers=["CPUExecutionProvider"])
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name

    def is_ready(self) -> bool:
        return self.session is not None

    def analyze_elements(
        self,
        elements: List[Dict[str, Any]],
        page_width: float = 595.0,
        page_height: float = 842.0,
    ) -> Dict[str, Any]:
        """
        Classify all bounding boxes on a document page.

        Returns:
            Dictionary containing classified elements, confidence scores, and aggregate statistics.
        """
        if not elements:
            return {"elements": [], "summary": {c: 0 for c in LAYOUT_CLASSES}}

        # Extract multimodal features
        feature_matrix = self.feature_extractor.extract_batch(elements, page_width, page_height)

        if self.session is not None:
            # ONNX inference
            probs = self.session.run([self.output_name], {self.input_name: feature_matrix})[0]
        else:
            # Rule/heuristic fallback if model weight is not yet trained
            probs = self._heuristic_fallback(elements, page_width, page_height)

        predicted_indices = np.argmax(probs, axis=1)
        confidences = np.max(probs, axis=1)

        analyzed_elements = []
        summary = {c: 0 for c in LAYOUT_CLASSES}

        for idx, el in enumerate(elements):
            class_id = int(predicted_indices[idx])
            label = ID_TO_CLASS.get(class_id, "paragraph")
            conf = float(confidences[idx])
            summary[label] += 1

            analyzed_elements.append({
                "id": el.get("id", f"elem_{idx}"),
                "bbox": el.get("bbox", [0.0, 0.0, 100.0, 50.0]),
                "text": el.get("text", "")[:120],
                "label": label,
                "confidence": round(conf, 4),
                "color": CLASS_COLORS.get(label, "#94a3b8"),
            })

        return {
            "page_width": page_width,
            "page_height": page_height,
            "element_count": len(analyzed_elements),
            "elements": analyzed_elements,
            "summary": summary,
        }

    def _heuristic_fallback(
        self,
        elements: List[Dict[str, Any]],
        page_width: float,
        page_height: float,
    ) -> np.ndarray:
        """Deterministic prior based on aspect ratio and text attributes."""
        n = len(elements)
        probs = np.full((n, len(LAYOUT_CLASSES)), 0.1, dtype=np.float32)

        for i, el in enumerate(elements):
            text = el.get("text", "")
            bbox = el.get("bbox", [0, 0, 100, 20])
            w = max(1.0, bbox[2] - bbox[0])
            h = max(1.0, bbox[3] - bbox[1])

            if h < 30 and len(text) < 60:
                probs[i, 1] = 0.85  # heading
            elif "|" in text or "\t" in text:
                probs[i, 2] = 0.88  # table
            elif "\\" in text or "=" in text and len(text) < 80:
                probs[i, 4] = 0.80  # formula
            elif "{" in text or "def " in text or "return" in text:
                probs[i, 5] = 0.82  # code_block
            else:
                probs[i, 0] = 0.90  # paragraph

        # Normalize rows to sum to 1
        return probs / np.sum(probs, axis=1, keepdims=True)
