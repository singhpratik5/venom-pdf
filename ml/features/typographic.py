"""
Typographic and Statistical Language Feature Extractor.
Extracts token density, character casing, digit prevalence, and information entropy.
"""

from typing import List
import math
import string
import numpy as np


class TypographicFeatureExtractor:
    """
    Extracts statistical, lexical, and casing attributes from text content.
    """

    FEATURE_NAMES = [
        "char_count",
        "token_count",
        "avg_token_len",
        "uppercase_ratio",
        "digit_ratio",
        "punctuation_ratio",
        "entropy",
    ]

    def extract(self, text: str) -> np.ndarray:
        """
        Extract typographic statistical features.

        Args:
            text: Raw string content of the region.

        Returns:
            np.ndarray of shape (7,) with typographic features.
        """
        if not text:
            return np.zeros(len(self.FEATURE_NAMES), dtype=np.float32)

        char_len = len(text)
        tokens = text.split()
        token_count = len(tokens)
        avg_token_len = char_len / (token_count + 1e-5)

        uppercase_count = sum(1 for c in text if c.isupper())
        digit_count = sum(1 for c in text if c.isdigit())
        punct_count = sum(1 for c in text if c in string.punctuation)

        uppercase_ratio = uppercase_count / (char_len + 1e-5)
        digit_ratio = digit_count / (char_len + 1e-5)
        punct_ratio = punct_count / (char_len + 1e-5)

        # Shannon Entropy H(X) = - sum(p * log2(p))
        char_counts = {}
        for c in text:
            char_counts[c] = char_counts.get(c, 0) + 1

        entropy = 0.0
        for count in char_counts.values():
            p = count / char_len
            if p > 0:
                entropy -= p * math.log2(p)

        return np.array([
            min(1.0, math.log1p(char_len) / 10.0),
            min(1.0, math.log1p(token_count) / 7.0),
            min(1.0, avg_token_len / 25.0),
            uppercase_ratio,
            digit_ratio,
            punct_ratio,
            min(1.0, entropy / 8.0),
        ], dtype=np.float32)
