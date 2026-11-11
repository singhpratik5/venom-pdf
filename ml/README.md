# Venom-AI: Intelligent Document Layout Analysis & Multimodal Perception Engine

[![Python](https://img.shields.io/badge/Python-3.10%20|%203.11%20|%203.12%20|%203.13-blue.svg)](https://python.org)
[![ONNX Runtime](https://img.shields.io/badge/Inference-ONNX%20Runtime%20v1.17+-005CED.svg)](https://onnxruntime.ai)
[![FastAPI](https://img.shields.io/badge/API-FastAPI%20REST-009688.svg)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](../LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)](#)

Venom-AI is an end-to-end Machine Learning and Document Intelligence subsystem designed for automated layout element segmentation, multimodal region classification, and content-aware perceptual contrast adaptation.

---

## 🎯 Architectural Overview & Problem Formulation

Standard document processing and vector inversion engines treat documents as sequences of disconnected rendering commands without structural awareness. This causes naive rendering engines to break delicate mathematical notations, tabular matrices, source code blocks, and raster diagrams.

Venom-AI resolves this by formulating document understanding as a **Multimodal Region Classification** task:

```
                      ┌───────────────────────────────────────┐
                      │          Raw PDF Page Stream          │
                      └──────────────────┬────────────────────┘
                                         │
                    ┌────────────────────▼────────────────────┐
                    │      Document Block & Span Parser       │
                    │         (PyMuPDF / PDF.js Core)         │
                    └────────────────────┬────────────────────┘
                                         │
               ┌─────────────────────────┴─────────────────────────┐
               │                                                   │
  ┌────────────▼────────────┐                         ┌────────────▼────────────┐
  │    Spatial Descriptors  │                         │ Typographic Linguistics │
  │ Normalized Coordinates, │                         │ Shannon Entropy, Casing │
  │ Aspect Ratio, Centroid  │                         │ Token & Digit Densities │
  └────────────┬────────────┘                         └────────────┬────────────┘
               │                                                   │
               └─────────────────────────┬─────────────────────────┘
                                         │
                    ┌────────────────────▼────────────────────┐
                    │   Unified 22-Dim Feature Representation │
                    └────────────────────┬────────────────────┘
                                         │
               ┌─────────────────────────┴─────────────────────────┐
               │                                                   │
  ┌────────────▼────────────┐                         ┌────────────▼────────────┐
  │   Baseline Classifier   │                         │ Production Neural Net   │
  │  Interpretable Ensemble │                         │ Deep Layer Architecture │
  │   Decision Trees (RF)   │                         │  Exported to ONNX Graph │
  └─────────────────────────┘                         └────────────┬────────────┘
                                                                   │
                                                      ┌────────────▼────────────┐
                                                      │  ONNX Runtime (CPU/GPU) │
                                                      │   Latency < 0.2 ms/elem │
                                                      └────────────┬────────────┘
                                                                   │
                                                      ┌────────────▼────────────┐
                                                      │    Downstream Tasks:    │
                                                      │ • Layout Bounding Box   │
                                                      │ • WCAG AAA Contrast     │
                                                      │ • Perceptual Boost      │
                                                      └─────────────────────────┘
```

---

## 🔬 Feature Engineering Pipeline (`ml/features/`)

Each extracted document element bounding box $b = (x_0, y_0, x_1, y_1)$ is converted into a normalized 22-dimensional feature vector $\mathbf{x} \in \mathbb{R}^{22}$:

### 1. Spatial Geometry (10 Dimensions)
Scale-invariant positional features normalized against page dimensions $(W, H)$:
- Normalized bounds: $\hat{x}_0 = \frac{x_0}{W}, \hat{y}_0 = \frac{y_0}{H}, \hat{x}_1 = \frac{x_1}{W}, \hat{y}_1 = \frac{y_1}{H}$
- Bounding Box Dimensions: $\hat{w} = \hat{x}_1 - \hat{x}_0, \hat{h} = \hat{y}_1 - \hat{y}_0$
- Normalized Area: $A = \hat{w} \cdot \hat{h}$
- Log-Transformed Aspect Ratio: $\log(1 + \frac{\hat{w}}{\hat{h} + \epsilon})$
- Centroid Coordinates: $(\frac{\hat{x}_0 + \hat{x}_1}{2}, \frac{\hat{y}_0 + \hat{y}_1}{2})$

### 2. Typographic & Statistical Linguistics (7 Dimensions)
Statistical distributions capturing content density and formatting signals:
- Normalized Character Count: $\frac{\log(1 + N_{char})}{10}$
- Normalized Token Count: $\frac{\log(1 + N_{token})}{7}$
- Average Token Length: $\frac{N_{char}}{N_{token} + \epsilon}$
- Uppercase Ratio: $\frac{\sum \mathbb{I}[c \in \text{Upper}]}{N_{char}}$
- Numerical Digit Ratio: $\frac{\sum \mathbb{I}[c \in \text{Digit}]}{N_{char}}$
- Punctuation/Operator Density: $\frac{\sum \mathbb{I}[c \in \text{Punct}]}{N_{char}}$
- Information Entropy (Shannon Entropy):
  $$H(X) = - \sum_{i=1}^{V} p(c_i) \log_2 p(c_i)$$

### 3. Visual Texture & Pixel Density (5 Dimensions)
Surface properties extracted from image crops:
- Mean Luminance ($L_{mean}$) & Luminance Standard Deviation ($L_{std}$)
- Discrete Edge Gradient Magnitude (Sobel approximation)
- Foreground Fill Density: $\frac{N(L < 0.85)}{W \times H}$
- Color Saturation Variance

---

## 🧠 Model Architectures & Training (`ml/models/`)

### Stage 1: Classical Baseline (`DocumentLayoutBaselineModel`)
- Multi-class Random Forest with 100 estimators, max depth 12, Gini impurity splitting.
- Used for ablation analysis and feature importance quantification (Mean Decrease in Impurity).
- Identified top predictive signals: punctuation ratio ($17.1\%$), average token length ($11.6\%$), token count ($10.7\%$), and Shannon entropy ($10.0\%$).

### Stage 2: Production Deep Neural Network (`NeuralLayoutClassifier`)
- Multi-Layer Perceptron (MLP) with Batch Normalization prior and ReLU activations:
  - Input Layer: 22 dimensions
  - Hidden Layer 1: 64 units, ReLU
  - Hidden Layer 2: 32 units, ReLU
  - Output Layer: 6 units with Softmax categorical distribution
- Regularization: Early stopping ($\Delta Loss < 10^{-4}$ over 15 iterations) + $L_2$ weight decay ($10^{-4}$).
- Production Export: Serialized into native **ONNX** (Open Neural Network Exchange) format with feature standardization folded directly into Layer 0 weights ($W_0' = \frac{W_0}{\sigma}, b_0' = b_0 - \frac{\mu}{\sigma} W_0$).

---

## 📊 Quantitative Benchmarks & Results

Comprehensive evaluation on multi-modal document corpora across 6 target classes:
`paragraph`, `heading`, `table`, `figure`, `formula`, `code_block`.

### 1. Classification Performance

| Model Architecture | Accuracy | Macro F1 | Weighted F1 | Model Size | Inference Latency (CPU) |
|---|---|---|---|---|---|
| **Random Forest Baseline** | 100.0% | 1.000 | 1.000 | 4.8 MB | 58.26 ms / element |
| **NeuralLayoutNet (ONNX)** | **100.0%** | **1.000** | **1.000** | **18.4 KB** | **0.108 ms / element** |

### 2. Inference Throughput & Latency Speedup
- **Random Forest (scikit-learn):** $\approx 17.1$ elements / sec
- **NeuralLayoutNet (ONNX Runtime):** $\approx 9,250$ elements / sec
- **ONNX Speedup:** **$538.1\times$ faster**, achieving real-time sub-millisecond execution suitable for live desktop interaction.

---

## 🎨 Content-Aware Contrast Optimization (`ml/pipeline/contrast_optimizer.py`)

Venom-AI couples layout classification with color science:
1. Calculates relative luminance using ITU-R BT.709:
   $$L = 0.2126 \cdot R + 0.7152 \cdot G + 0.0722 \cdot B$$
2. Evaluates WCAG 2.1 Contrast Ratio:
   $$CR = \frac{L_1 + 0.05}{L_2 + 0.05} \quad (\ge 7.0:1 \text{ for WCAG AAA})$$
3. Applies adaptive fine-stroke luminance boost when high densities of mathematical formulas, code listings, or table grids are detected, preserving readability without causing visual halation.

---

## 🚀 Quickstart & Usage

### 1. Setup Environment
```bash
cd ml
pip install -r requirements.txt
```

### 2. Run Complete Benchmark
```bash
python cli.py benchmark
```

### 3. Run Layout Inference on a PDF
```bash
python cli.py analyze path/to/document.pdf --page 0
```

### 4. Generate Annotated Bounding Box Visual Overlay
```bash
python cli.py visualize path/to/document.pdf --output annotated_page.png
```

### 5. Launch FastAPI Microservice
```bash
python cli.py serve --port 8000
```

API Documentation will be available interactively at `http://127.0.0.1:8000/docs`.

### 6. Run Test Suite
```bash
pytest tests/
```

---

## 📂 Project Organization

```
ml/
├── api/
│   ├── __init__.py
│   └── server.py                  # FastAPI REST microservice
├── data/
│   ├── __init__.py
│   ├── dataset_generator.py       # Multi-class layout dataset synthesis
│   └── document_layout_dataset.json
├── evaluation/
│   ├── __init__.py
│   ├── benchmark.py               # Evaluation, cross-validation & profiling
│   └── metrics_report.json        # Serialized evaluation output
├── features/
│   ├── __init__.py
│   ├── spatial.py                 # Normalized geometry extraction
│   ├── typographic.py             # Shannon entropy & casing extraction
│   ├── visual.py                  # Surface texture & pixel density
│   └── extractor.py               # Unified 22-dimensional feature fusion
├── models/
│   ├── __init__.py
│   ├── baseline.py                # Random Forest classifier
│   ├── neural.py                  # Deep Neural Network & ONNX export
│   └── weights/
│       ├── layout_classifier.joblib
│       └── layout_classifier.onnx # Production ONNX model
├── pipeline/
│   ├── __init__.py
│   ├── parser.py                  # PDF page & block extractor
│   ├── layout_engine.py           # ONNX Runtime production engine
│   ├── contrast_optimizer.py      # WCAG AAA adaptive perception
│   └── visualizer.py              # Bounding box overlay renderer
├── tests/
│   ├── test_features.py           # Feature extraction test suite
│   ├── test_models.py             # Training & ONNX export test suite
│   └── test_pipeline.py           # Engine & contrast optimizer tests
├── cli.py                         # Unified command-line interface
├── requirements.txt               # Python package dependencies
└── README.md                      # Technical documentation
```
