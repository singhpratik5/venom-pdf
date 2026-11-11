"""
Neural Document Layout Classifier and ONNX Serialization Pipeline.
Trains a Deep Multi-Layer Perceptron (MLP) with Adam and Cross-Entropy loss,
and serializes the computation graph into native ONNX format for microsecond CPU inference.
"""

import os
from typing import Dict, Any, Optional, Tuple
import numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, f1_score, classification_report
import onnx
from onnx import helper, TensorProto
import onnxruntime as ort

try:
    from ..data import LAYOUT_CLASSES
except (ImportError, ValueError):
    from ml.data import LAYOUT_CLASSES


class NeuralLayoutClassifier:
    """
    Deep Feedforward Neural Classifier with Batch Normalization prior,
    ReLU hidden activations, and Softmax categorical outputs.
    """

    def __init__(
        self,
        hidden_layer_sizes: Tuple[int, ...] = (64, 32),
        learning_rate_init: float = 0.003,
        max_iter: int = 300,
        random_state: int = 42,
    ):
        self.scaler = StandardScaler()
        self.model = MLPClassifier(
            hidden_layer_sizes=hidden_layer_sizes,
            activation="relu",
            solver="adam",
            alpha=0.0001,
            learning_rate_init=learning_rate_init,
            max_iter=max_iter,
            early_stopping=True,
            n_iter_no_change=15,
            random_state=random_state,
        )
        self.is_trained = False
        self.feature_names = []

    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        feature_names: Optional[list] = None,
    ) -> Dict[str, Any]:
        """Train neural network using backpropagation and Adam optimizer."""
        if feature_names:
            self.feature_names = feature_names

        X_scaled = self.scaler.fit_transform(X_train)
        self.model.fit(X_scaled, y_train)
        self.is_trained = True

        train_preds = self.model.predict(X_scaled)
        train_f1 = f1_score(y_train, train_preds, average="macro")

        return {
            "n_iter": int(self.model.n_iter_),
            "loss": float(self.model.loss_),
            "best_validation_score": float(self.model.best_validation_score_ or 0.0),
            "train_f1_macro": float(train_f1),
        }

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Forward pass inference returning discrete class labels."""
        if not self.is_trained:
            raise RuntimeError("Model is not trained.")
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Forward pass returning class probabilities (Softmax)."""
        if not self.is_trained:
            raise RuntimeError("Model is not trained.")
        X_scaled = self.scaler.transform(X)
        return self.model.predict_proba(X_scaled)

    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, Any]:
        """Evaluate neural classifier on test set."""
        preds = self.predict(X_test)
        report = classification_report(
            y_test,
            preds,
            target_names=LAYOUT_CLASSES,
            output_dict=True,
            zero_division=0,
        )
        return {
            "accuracy": float(accuracy_score(y_test, preds)),
            "macro_f1": float(f1_score(y_test, preds, average="macro")),
            "weighted_f1": float(f1_score(y_test, preds, average="weighted")),
            "detailed_report": report,
        }

    def export_onnx(self, output_path: str) -> str:
        """
        Exports the trained MLP network weights (incorporating the StandardScaler)
        into an optimized, standalone ONNX computation graph.
        """
        if not self.is_trained:
            raise RuntimeError("Cannot export an untrained model to ONNX.")

        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Scale transform: X_scaled = (X - mean) / scale
        # We can fold this into the first dense layer:
        # W_eff = W1 / scale[:, None]
        # b_eff = b1 - sum(mean * W1 / scale)
        coefs = self.model.coefs_
        intercepts = self.model.intercepts_

        scale = self.scaler.scale_.astype(np.float32)
        mean = self.scaler.mean_.astype(np.float32)

        W0 = coefs[0].astype(np.float32)
        b0 = intercepts[0].astype(np.float32)

        # Fold standardization directly into Layer 0 weights & biases
        W0_eff = W0 / (scale[:, None] + 1e-8)
        b0_eff = b0 - np.dot(mean / (scale + 1e-8), W0)

        W1 = coefs[1].astype(np.float32)
        b1 = intercepts[1].astype(np.float32)

        W2 = coefs[2].astype(np.float32)
        b2 = intercepts[2].astype(np.float32)

        # Define ONNX Initializers (Tensors)
        t_W0 = helper.make_tensor("W0", TensorProto.FLOAT, W0_eff.shape, W0_eff.flatten())
        t_b0 = helper.make_tensor("b0", TensorProto.FLOAT, b0_eff.shape, b0_eff.flatten())
        t_W1 = helper.make_tensor("W1", TensorProto.FLOAT, W1.shape, W1.flatten())
        t_b1 = helper.make_tensor("b1", TensorProto.FLOAT, b1.shape, b1.flatten())
        t_W2 = helper.make_tensor("W2", TensorProto.FLOAT, W2.shape, W2.flatten())
        t_b2 = helper.make_tensor("b2", TensorProto.FLOAT, b2.shape, b2.flatten())

        # Computational nodes
        nodes = [
            # Layer 0: X @ W0 + b0 -> ReLU
            helper.make_node("MatMul", ["input", "W0"], ["matmul_0"]),
            helper.make_node("Add", ["matmul_0", "b0"], ["dense_0"]),
            helper.make_node("Relu", ["dense_0"], ["relu_0"]),

            # Layer 1: relu_0 @ W1 + b1 -> ReLU
            helper.make_node("MatMul", ["relu_0", "W1"], ["matmul_1"]),
            helper.make_node("Add", ["matmul_1", "b1"], ["dense_1"]),
            helper.make_node("Relu", ["dense_1"], ["relu_1"]),

            # Layer 2 (Output): relu_1 @ W2 + b2 -> Softmax
            helper.make_node("MatMul", ["relu_1", "W2"], ["matmul_2"]),
            helper.make_node("Add", ["matmul_2", "b2"], ["logits"]),
            helper.make_node("Softmax", ["logits"], ["probabilities"], axis=-1),
        ]

        input_dim = int(W0.shape[0])
        num_classes = len(LAYOUT_CLASSES)

        inputs = [helper.make_tensor_value_info("input", TensorProto.FLOAT, [None, input_dim])]
        outputs = [helper.make_tensor_value_info("probabilities", TensorProto.FLOAT, [None, num_classes])]

        graph = helper.make_graph(
            nodes=nodes,
            name="DocumentLayoutNet",
            inputs=inputs,
            outputs=outputs,
            initializer=[t_W0, t_b0, t_W1, t_b1, t_W2, t_b2],
        )

        model_def = helper.make_model(graph, producer_name="Venom-AI", ir_version=10)
        model_def.opset_import[0].version = 17

        onnx.checker.check_model(model_def)
        onnx.save(model_def, output_path)

        return output_path
