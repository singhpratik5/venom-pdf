"""
Baseline Interpretable Machine Learning Models for Document Layout Analysis.
Trains Random Forest and Gradient Boosted Decision Trees with feature importance analysis.
"""

import os
import joblib
from typing import Dict, Any, Tuple, Optional
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import classification_report, accuracy_score, f1_score
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler

try:
    from ..data import LAYOUT_CLASSES
except (ImportError, ValueError):
    from ml.data import LAYOUT_CLASSES


class DocumentLayoutBaselineModel:
    """
    Interpretable baseline classifier leveraging ensemble decision trees
    over multimodal spatial, typographic, and visual features.
    """

    def __init__(self, n_estimators: int = 100, random_state: int = 42):
        self.random_state = random_state
        self.scaler = StandardScaler()
        self.model = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=12,
            min_samples_split=4,
            random_state=random_state,
            n_jobs=-1,
        )
        self.is_trained = False
        self.feature_names = []

    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        feature_names: Optional[list] = None,
    ) -> Dict[str, Any]:
        """
        Train the baseline classifier with 5-fold cross-validation.
        """
        if feature_names:
            self.feature_names = feature_names

        # Feature standardization
        X_scaled = self.scaler.fit_transform(X_train)

        # 5-fold cross validation
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=self.random_state)
        cv_scores = cross_val_score(self.model, X_scaled, y_train, cv=cv, scoring="f1_macro")

        # Fit model on entire train split
        self.model.fit(X_scaled, y_train)
        self.is_trained = True

        train_preds = self.model.predict(X_scaled)
        train_f1 = f1_score(y_train, train_preds, average="macro")

        # Feature importances
        importances = self.model.feature_importances_
        feature_ranking = []
        if self.feature_names and len(self.feature_names) == len(importances):
            indices = np.argsort(importances)[::-1]
            for idx in indices:
                feature_ranking.append({
                    "feature": self.feature_names[idx],
                    "importance": float(importances[idx]),
                })

        return {
            "cv_f1_mean": float(np.mean(cv_scores)),
            "cv_f1_std": float(np.std(cv_scores)),
            "train_f1_macro": float(train_f1),
            "top_features": feature_ranking[:8],
        }

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict class indices for input features."""
        if not self.is_trained:
            raise RuntimeError("Model must be trained before inference.")
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Predict class posterior probabilities."""
        if not self.is_trained:
            raise RuntimeError("Model must be trained before inference.")
        X_scaled = self.scaler.transform(X)
        return self.model.predict_proba(X_scaled)

    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, Any]:
        """Evaluate performance on test split."""
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

    def save(self, filepath: str):
        """Serialize model and scaler to disk."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump({
            "scaler": self.scaler,
            "model": self.model,
            "feature_names": self.feature_names,
            "is_trained": self.is_trained,
        }, filepath)

    def load(self, filepath: str):
        """Deserialize model from disk."""
        data = joblib.load(filepath)
        self.scaler = data["scaler"]
        self.model = data["model"]
        self.feature_names = data.get("feature_names", [])
        self.is_trained = data.get("is_trained", True)
