"""
Comprehensive Benchmarking and Evaluation Suite for Document Layout Intelligence.
Evaluates accuracy, macro F1, per-class performance, confusion matrices, and latency profiles.
"""

import time
import json
import os
import sys
from typing import Dict, Any
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from ml.data import load_or_generate_dataset, LAYOUT_CLASSES
from ml.features import MultimodalFeatureExtractor
from ml.models import DocumentLayoutBaselineModel, NeuralLayoutClassifier


def run_full_benchmark(
    dataset_path: str = None,
    export_weights: bool = True,
    output_report_path: str = None,
) -> Dict[str, Any]:
    """
    Executes full training, cross-validation, test set evaluation, and latency benchmarking.
    """
    print("=" * 65)
    print("  VENOM-AI: Document Layout Analysis Evaluation & Benchmark")
    print("=" * 65)

    # 1. Dataset Loading
    raw_data = load_or_generate_dataset(dataset_path)
    print(f"\n[1/5] Loaded dataset with {len(raw_data)} samples across {len(LAYOUT_CLASSES)} classes.")

    # 2. Multimodal Feature Extraction
    print("[2/5] Extracting multimodal spatial, typographic, and visual features...")
    extractor = MultimodalFeatureExtractor()
    pw, ph = 595.0, 842.0

    X_list, y_list = [], []
    for item in raw_data:
        vec = extractor.extract_element(
            item["bbox"],
            item["text"],
            item.get("page_width", pw),
            item.get("page_height", ph),
        )
        X_list.append(vec)
        y_list.append(item["class_id"])

    X = np.stack(X_list, axis=0)
    y = np.array(y_list, dtype=np.int64)

    # Stratified Train/Test Split (80% Train, 20% Test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"  - Train Split: {X_train.shape[0]} elements | Test Split: {X_test.shape[0]} elements")
    print(f"  - Multimodal Feature Dimension: {X.shape[1]}")

    # 3. Model 1: Baseline Random Forest Classifier
    print("\n[3/5] Training Baseline Interpretable Random Forest Classifier...")
    baseline_model = DocumentLayoutBaselineModel(n_estimators=100, random_state=42)
    baseline_train_info = baseline_model.train(X_train, y_train, extractor.feature_names)
    baseline_eval = baseline_model.evaluate(X_test, y_test)
    print(f"  - Baseline CV Macro F1: {baseline_train_info['cv_f1_mean']:.4f} (+/- {baseline_train_info['cv_f1_std']:.4f})")
    print(f"  - Baseline Test Accuracy: {baseline_eval['accuracy']:.4f}")
    print(f"  - Baseline Test Macro F1: {baseline_eval['macro_f1']:.4f}")

    # 4. Model 2: Neural Layout MLP & ONNX Export
    print("\n[4/5] Training Deep Neural Layout Classifier & ONNX Graph Serialization...")
    neural_model = NeuralLayoutClassifier(hidden_layer_sizes=(64, 32), random_state=42)
    neural_train_info = neural_model.train(X_train, y_train, extractor.feature_names)
    neural_eval = neural_model.evaluate(X_test, y_test)
    print(f"  - Neural Training Epochs: {neural_train_info['n_iter']}")
    print(f"  - Neural Test Accuracy: {neural_eval['accuracy']:.4f}")
    print(f"  - Neural Test Macro F1: {neural_eval['macro_f1']:.4f}")

    # Export Weights if requested
    weights_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models", "weights")
    if export_weights:
        os.makedirs(weights_dir, exist_ok=True)
        rf_path = os.path.join(weights_dir, "layout_classifier.joblib")
        onnx_path = os.path.join(weights_dir, "layout_classifier.onnx")

        baseline_model.save(rf_path)
        neural_model.export_onnx(onnx_path)
        print(f"  - Saved baseline model: {os.path.basename(rf_path)}")
        print(f"  - Exported production ONNX graph: {os.path.basename(onnx_path)}")

    # 5. Latency Profiling (Inference Microsecond Benchmark)
    print("\n[5/5] Profiling Inference Latency Across Frameworks (200 iterations)...", flush=True)
    sample_elem = X_test[0:1]

    # Baseline scikit-learn latency
    t0 = time.perf_counter()
    for _ in range(200):
        _ = baseline_model.predict(sample_elem)
    rf_latency_ms = ((time.perf_counter() - t0) / 200) * 1000.0

    # ONNX Runtime latency
    import onnxruntime as ort
    ort_session = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
    in_name = ort_session.get_inputs()[0].name
    out_name = ort_session.get_outputs()[0].name

    t0 = time.perf_counter()
    for _ in range(200):
        _ = ort_session.run([out_name], {in_name: sample_elem})
    onnx_latency_ms = ((time.perf_counter() - t0) / 200) * 1000.0

    print(f"  - Random Forest Latency: {rf_latency_ms:.3f} ms / element")
    print(f"  - ONNX Runtime Latency:  {onnx_latency_ms:.3f} ms / element")
    print(f"  - Speedup with ONNX:     {rf_latency_ms / max(onnx_latency_ms, 1e-4):.1f}x")

    # Confusion Matrix
    test_preds = neural_model.predict(X_test)
    cm = confusion_matrix(y_test, test_preds).tolist()

    report = {
        "dataset": {
            "total_samples": len(raw_data),
            "classes": LAYOUT_CLASSES,
            "feature_dim": int(X.shape[1]),
        },
        "baseline_model": {
            "type": "RandomForestClassifier",
            "cross_val_macro_f1": baseline_train_info["cv_f1_mean"],
            "test_accuracy": baseline_eval["accuracy"],
            "test_macro_f1": baseline_eval["macro_f1"],
            "latency_ms_per_element": round(rf_latency_ms, 4),
            "top_features": baseline_train_info["top_features"],
        },
        "production_neural_model": {
            "type": "NeuralLayoutNet (ONNX)",
            "test_accuracy": neural_eval["accuracy"],
            "test_macro_f1": neural_eval["macro_f1"],
            "test_weighted_f1": neural_eval["weighted_f1"],
            "latency_ms_per_element": round(onnx_latency_ms, 4),
            "confusion_matrix": cm,
            "per_class_metrics": neural_eval["detailed_report"],
        },
    }

    if output_report_path is None:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        output_report_path = os.path.join(current_dir, "metrics_report.json")

    with open(output_report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"\n✓ Benchmark completed successfully! Report saved to {output_report_path}")
    return report


if __name__ == "__main__":
    run_full_benchmark()
