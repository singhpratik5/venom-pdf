"""
Document Layout Dataset Generator.
Synthesizes structured multi-modal document layout annotations (academic, financial, technical)
for training and evaluating document intelligence models.
"""

import os
import json
import random
from typing import List, Dict, Any, Tuple
import numpy as np


LAYOUT_CLASSES = [
    "paragraph",
    "heading",
    "table",
    "figure",
    "formula",
    "code_block",
]

CLASS_TO_ID = {name: idx for idx, name in enumerate(LAYOUT_CLASSES)}
ID_TO_CLASS = {idx: name for idx, name in enumerate(LAYOUT_CLASSES)}


class DocumentDatasetGenerator:
    """
    Generates synthetic and rule-augmented document layout samples
    mimicking distributions from PubLayNet and DocBank benchmarks.
    """

    SAMPLE_PARAGRAPHS = [
        "In this study, we propose a novel framework for document layout analysis utilizing deep multimodal representations.",
        "Experimental evaluations demonstrate superior performance across precision, recall, and inference throughput benchmarks.",
        "The primary challenge in legacy document conversion arises from the absence of semantic structural tagging within low-level streams.",
        "Contrast sensitivity and visual readability remain critical considerations when mapping documents into ergonomic display themes.",
        "Recent advances in neural representation learning have enabled robust extraction of hierarchical structures from unannotated content.",
        "We observe that standard RGB inversion distorts critical tabular boundaries and produces non-compliant visual contrast ratios.",
    ]

    SAMPLE_HEADINGS = [
        "1. Introduction and Problem Formulation",
        "2. Related Work in Document Intelligence",
        "3. Proposed Multimodal Architecture",
        "4. Quantitative Experimental Results",
        "5. Ablation Studies and Latency Profiling",
        "Abstract",
        "Conclusion and Future Directions",
    ]

    SAMPLE_TABLES = [
        "Method | Precision | Recall | F1-Score | Latency (ms)\nBaseline RF | 0.884 | 0.865 | 0.874 | 0.42\nNeural ONNX | 0.946 | 0.938 | 0.942 | 1.15",
        "Metric | OLED Black | Venom Dark | Nord | Sepia\nContrast Ratio | 21.0:1 | 12.4:1 | 10.8:1 | 7.5:1\nWCAG AAA | Pass | Pass | Pass | Pass",
        "Layer | Input Dim | Output Dim | Activation | Parameters\nLinear_1 | 22 | 64 | GELU | 1,472\nLinear_2 | 64 | 32 | GELU | 2,080\nOutput | 32 | 6 | Softmax | 198",
    ]

    SAMPLE_FORMULAS = [
        "f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} \\exp\\left( -\\frac{(x - \\mu)^2}{2\\sigma^2} \\right)",
        "\\mathcal{L}_{total} = \\alpha \\mathcal{L}_{CE} + \\beta \\mathcal{L}_{contrast} + \\gamma \\mathcal{L}_{spatial}",
        "CR = \\frac{L_1 + 0.05}{L_2 + 0.05} \\ge 7.0 \\quad (\\text{WCAG AAA})",
        "H(X) = - \\sum_{i=1}^{n} P(x_i) \\log_2 P(x_i)",
    ]

    SAMPLE_CODE_BLOCKS = [
        "def analyze_layout(pdf_path: str) -> List[Dict[str, Any]]:\n    doc = pymupdf.open(pdf_path)\n    return [classify_block(b) for b in doc[0].get_text('blocks')]",
        "fn invert_stream(stream: &[u8], theme: &Theme) -> Vec<u8> {\n    let mut output = Vec::with_capacity(stream.len());\n    apply_color_mapping(stream, &mut output, theme);\n    output\n}",
        "curl -X POST http://localhost:8000/analyze/layout -H 'Content-Type: application/json' -d '{\"doc_id\": 101}'",
    ]

    def __init__(self, page_width: float = 595.0, page_height: float = 842.0, seed: int = 42):
        self.page_width = page_width
        self.page_height = page_height
        random.seed(seed)
        np.random.seed(seed)

    def generate_sample(self, label: str) -> Dict[str, Any]:
        """Generate a single realistic element given target label."""
        pw, ph = self.page_width, self.page_height

        if label == "heading":
            text = random.choice(self.SAMPLE_HEADINGS)
            w = random.uniform(200.0, 480.0)
            h = random.uniform(16.0, 32.0)
            x0 = random.uniform(50.0, 70.0)
            y0 = random.uniform(50.0, ph - 100.0)

        elif label == "paragraph":
            text = " ".join(random.choices(self.SAMPLE_PARAGRAPHS, k=random.randint(1, 3)))
            w = random.uniform(350.0, 480.0)
            h = random.uniform(40.0, 140.0)
            x0 = random.uniform(50.0, 70.0)
            y0 = random.uniform(80.0, ph - 180.0)

        elif label == "table":
            text = random.choice(self.SAMPLE_TABLES)
            w = random.uniform(380.0, 500.0)
            h = random.uniform(80.0, 220.0)
            x0 = random.uniform(50.0, 60.0)
            y0 = random.uniform(120.0, ph - 250.0)

        elif label == "figure":
            text = f"[Figure {random.randint(1, 10)}: Diagram of system architecture and data pipeline]"
            w = random.uniform(300.0, 480.0)
            h = random.uniform(150.0, 280.0)
            x0 = random.uniform(55.0, 75.0)
            y0 = random.uniform(100.0, ph - 320.0)

        elif label == "formula":
            text = random.choice(self.SAMPLE_FORMULAS)
            w = random.uniform(180.0, 380.0)
            h = random.uniform(22.0, 48.0)
            x0 = random.uniform(100.0, 200.0)  # Centered equation
            y0 = random.uniform(100.0, ph - 100.0)

        elif label == "code_block":
            text = random.choice(self.SAMPLE_CODE_BLOCKS)
            w = random.uniform(360.0, 480.0)
            h = random.uniform(50.0, 130.0)
            x0 = random.uniform(60.0, 70.0)
            y0 = random.uniform(100.0, ph - 160.0)

        else:
            raise ValueError(f"Unknown label: {label}")

        bbox = [round(x0, 2), round(y0, 2), round(x0 + w, 2), round(y0 + h, 2)]

        return {
            "bbox": bbox,
            "text": text,
            "label": label,
            "class_id": CLASS_TO_ID[label],
            "page_width": pw,
            "page_height": ph,
        }

    def generate_dataset(self, num_samples_per_class: int = 150) -> List[Dict[str, Any]]:
        """Generate balanced multi-class dataset."""
        dataset = []
        for label in LAYOUT_CLASSES:
            for _ in range(num_samples_per_class):
                dataset.append(self.generate_sample(label))
        random.shuffle(dataset)
        return dataset

    def save_dataset(self, dataset: List[Dict[str, Any]], output_path: str):
        """Save dataset to JSON file."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(dataset, f, indent=2)


def get_default_dataset_path() -> str:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(current_dir, "document_layout_dataset.json")


def load_or_generate_dataset(
    path: str = None,
    samples_per_class: int = 150,
) -> List[Dict[str, Any]]:
    """Loads existing dataset or generates fresh dataset if missing."""
    if path is None:
        path = get_default_dataset_path()

    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    generator = DocumentDatasetGenerator()
    data = generator.generate_dataset(num_samples_per_class=samples_per_class)
    generator.save_dataset(data, path)
    return data
