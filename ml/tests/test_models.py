"""
Unit tests for model training, ONNX serialization, and runtime inference.
"""

import os
import tempfile
import pytest
import numpy as np

from ml.models import DocumentLayoutBaselineModel, NeuralLayoutClassifier
from ml.data import load_or_generate_dataset
from ml.features import MultimodalFeatureExtractor


@pytest.fixture(scope="module")
def sample_data():
    raw_data = load_or_generate_dataset(samples_per_class=20)
    extractor = MultimodalFeatureExtractor()
    X = []
    y = []
    for item in raw_data:
        vec = extractor.extract_element(item["bbox"], item["text"], 595.0, 842.0)
        X.append(vec)
        y.append(item["class_id"])
    return np.array(X), np.array(y)


def test_baseline_model_train_predict(sample_data):
    X, y = sample_data
    model = DocumentLayoutBaselineModel(n_estimators=10, random_state=42)
    info = model.train(X, y)
    assert "cv_f1_mean" in info
    assert info["train_f1_macro"] > 0.8

    preds = model.predict(X[:5])
    assert preds.shape == (5,)

    probs = model.predict_proba(X[:5])
    assert probs.shape == (5, 6)
    assert np.allclose(probs.sum(axis=1), 1.0)


def test_neural_model_and_onnx_export(sample_data):
    X, y = sample_data
    model = NeuralLayoutClassifier(hidden_layer_sizes=(16, 8), max_iter=50, random_state=42)
    info = model.train(X, y)
    assert info["n_iter"] > 0

    with tempfile.TemporaryDirectory() as tmp_dir:
        onnx_file = os.path.join(tmp_dir, "test_model.onnx")
        model.export_onnx(onnx_file)
        assert os.path.exists(onnx_file)
        assert os.path.getsize(onnx_file) > 100

        # Verify ONNX Runtime loading
        import onnxruntime as ort
        session = ort.InferenceSession(onnx_file, providers=["CPUExecutionProvider"])
        in_name = session.get_inputs()[0].name
        out_name = session.get_outputs()[0].name

        res = session.run([out_name], {in_name: X[:2]})[0]
        assert res.shape == (2, 6)
        assert np.allclose(res.sum(axis=1), 1.0, atol=1e-4)
