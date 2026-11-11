# Venom-AI: Technical Architecture & Deep Dive Guide

This document provides an engineering deep dive into the **Venom-AI Document Layout Intelligence & Multimodal Perception Subsystem**.

---

## 1. System Overview & Problem Formulation

Traditional document converters and reader extensions operate under naive heuristics:
- **Rasterization:** Converts vector streams into flat images, destroying text searchability and bloating file size from 2 MB to 50+ MB.
- **Direct RGB Inversion:** Inverts entire color palettes blindly, rendering mathematical formulas and diagrams as unreadable photonegatives.

Venom-AI formulates document understanding as a **Multimodal Layout Region Classification** task, identifying page components across 6 target classes:
1. `paragraph`: Standard body text blocks
2. `heading`: Section titles, chapter headers, subtitles
3. `table`: Tabular structures and data grids
4. `figure`: Diagrams, illustrations, raster photographs
5. `formula`: Mathematical equations and scientific expressions
6. `code_block`: Monospaced programming syntax

---

## 2. Multimodal Feature Engineering (22 Dimensions)

Every candidate region bounding box $b = (x_0, y_0, x_1, y_1)$ on a document page of size $(W, H)$ is mapped into a normalized continuous vector $\mathbf{x} \in \mathbb{R}^{22}$:

### A. Spatial Geometry (10 Dimensions)
- **Scale-Invariant Bounds:** $\hat{x}_0 = \frac{x_0}{W}, \hat{y}_0 = \frac{y_0}{H}, \hat{x}_1 = \frac{x_1}{W}, \hat{y}_1 = \frac{y_1}{H}$
- **Dimensions & Area:** $\hat{w} = \hat{x}_1 - \hat{x}_0$, $\hat{h} = \hat{y}_1 - \hat{y}_0$, $A = \hat{w} \cdot \hat{h}$
- **Aspect Ratio:** $\log(1 + \frac{\hat{w}}{\hat{h} + \epsilon})$
- **Centroids:** $\bar{x} = \frac{\hat{x}_0 + \hat{x}_1}{2}$, $\bar{y} = \frac{\hat{y}_0 + \hat{y}_1}{2}$

### B. Typographic Linguistics & Statistics (7 Dimensions)
- **Token Density:** Log-scaled character and word token counts
- **Average Token Length:** $L_{avg} = \frac{N_{char}}{N_{token} + \epsilon}$
- **Casing & Symbol Ratios:** Uppercase character ratio, digit ratio, and punctuation density
- **Shannon Information Entropy ($H$):**
  $$H(X) = - \sum_{i=1}^{V} p(c_i) \log_2 p(c_i)$$

### C. Visual Surface Textures (5 Dimensions)
- **Luminance Descriptors:** Mean luminance ($L_{mean}$) and luminance standard deviation ($L_{std}$)
- **Edge Gradient Magnitude:** Horizontal and vertical discrete edge variations (Sobel approximation)
- **Fill Ratio & Saturation:** Proportion of foreground pixels ($L < 0.85$) and chromatic saturation

---

## 3. Dual-Stage Model Architecture

### Stage 1: Classical Baseline (Random Forest)
- **Configuration:** 100 decision trees, Gini impurity splitting, max depth 12.
- **Top Predictive Features (Mean Decrease in Impurity):**
  - `punctuation_ratio`: 17.1%
  - `avg_token_len`: 11.6%
  - `token_count`: 10.7%
  - `entropy`: 10.0%
  - `char_count`: 9.5%
  - `norm_height`: 8.3%
  - `digit_ratio`: 7.4%
  - `norm_area`: 7.0%

### Stage 2: Production Deep Neural Network (ONNX Runtime)
- **Architecture:** 3-layer Feedforward Network:
  - Input: 22 dimensions
  - Layer 1: 64 units, ReLU activation
  - Layer 2: 32 units, ReLU activation
  - Output: 6 units, Softmax distribution
- **Weight Folding Optimization:**
  Feature standardization $(\frac{X - \mu}{\sigma})$ is pre-folded into Layer 0 weights ($W_0' = \frac{W_0}{\sigma}$, $b_0' = b_0 - \frac{\mu}{\sigma} W_0$).
- **Throughput & Speedup:**
  - Random Forest (scikit-learn): 58.26 ms / element
  - Neural Network (ONNX Runtime): **0.108 ms / element**
  - **Latency Improvement:** **538.1x faster**

---

## 4. Content-Aware Contrast Science

Venom-AI dynamically calculates document readability:
1. **Relative Luminance (ITU-R BT.709):**
   $$L = 0.2126 \cdot R + 0.7152 \cdot G + 0.0722 \cdot B$$
2. **WCAG 2.1 Contrast Ratio:**
   $$CR = \frac{L_{lighter} + 0.05}{L_{darker} + 0.05} \quad (\ge 7.0:1 \text{ for WCAG AAA})$$
3. **Adaptive Stroke Compensation:**
   When high concentrations of formulas or code blocks are detected, the system applies an adaptive fine-stroke luminance boost ($+8\%$ to $+15\%$) to avoid astigmatic halation and loss of delicate strokes.

---

## 5. Serving & CLI Usage

### Python CLI
```bash
# Benchmark training, cross-validation & ONNX profiling
python ml/cli.py benchmark

# Analyze document layout
python ml/cli.py analyze document.pdf --page 0

# Generate visual annotated overlay image
python ml/cli.py visualize document.pdf --output overlay.png

# Launch FastAPI microservice
python ml/cli.py serve --port 8000
```

### FastAPI Microservice
- **Health Check:** `GET /health`
- **Batch Layout Classification:** `POST /analyze/elements`
- **Perceptual Contrast Optimization:** `POST /optimize/contrast`
- **Interactive Documentation:** Available at `http://127.0.0.1:8000/docs`
