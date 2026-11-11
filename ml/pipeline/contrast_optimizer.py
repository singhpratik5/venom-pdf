"""
Content-Aware Contrast Optimizer and Perceptual Color Intelligence.
Calculates WCAG AAA contrast metrics and dynamically adapts luminance curves
based on classified document element distributions (formulas, tables, fine text).
"""

from typing import Dict, Any, Tuple, List
import math


class ContrastOptimizer:
    """
    Perceptual color science engine for document accessibility and legibility.
    Implements ITU-R BT.709 relative luminance and WCAG 2.1 contrast formulas.
    """

    @staticmethod
    def relative_luminance(rgb: Tuple[int, int, int]) -> float:
        """
        Calculates relative luminance according to W3C WCAG specification.
        """
        def channel_lum(c: int) -> float:
            v = c / 255.0
            return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4

        r, g, b = rgb
        return 0.2126 * channel_lum(r) + 0.7152 * channel_lum(g) + 0.0722 * channel_lum(b)

    @classmethod
    def contrast_ratio(cls, rgb1: Tuple[int, int, int], rgb2: Tuple[int, int, int]) -> float:
        """
        Calculates contrast ratio between two RGB colors (1:1 to 21:1).
        Formula: (L1 + 0.05) / (L2 + 0.05)
        """
        l1 = cls.relative_luminance(rgb1)
        l2 = cls.relative_luminance(rgb2)
        lighter = max(l1, l2)
        darker = min(l1, l2)
        return (lighter + 0.05) / (darker + 0.05)

    def optimize_theme_for_layout(
        self,
        bg_rgb: Tuple[int, int, int],
        fg_rgb: Tuple[int, int, int],
        layout_summary: Dict[str, int],
    ) -> Dict[str, Any]:
        """
        Adaptively optimizes theme colors based on document layout complexity.
        Documents with high formula or code density require heightened stroke contrast
        to prevent astigmatic blur or line loss.
        """
        initial_cr = self.contrast_ratio(bg_rgb, fg_rgb)
        formula_count = layout_summary.get("formula", 0)
        table_count = layout_summary.get("table", 0)
        code_count = layout_summary.get("code_block", 0)

        # Content-aware difficulty coefficient
        high_frequency_elements = formula_count + table_count + code_count
        adaptive_boost = 1.0

        if high_frequency_elements > 5:
            # Boost foreground brightness slightly for fine strokes
            adaptive_boost = 1.08
        elif high_frequency_elements > 15:
            adaptive_boost = 1.15

        # Adjusted foreground
        adj_fg = tuple(min(255, int(c * adaptive_boost)) for c in fg_rgb)
        optimized_cr = self.contrast_ratio(bg_rgb, adj_fg)

        wcag_aa_pass = optimized_cr >= 4.5
        wcag_aaa_pass = optimized_cr >= 7.0

        return {
            "initial_contrast_ratio": round(initial_cr, 2),
            "optimized_contrast_ratio": round(optimized_cr, 2),
            "wcag_aa_compliant": wcag_aa_pass,
            "wcag_aaa_compliant": wcag_aaa_pass,
            "fine_stroke_adaptive_boost": round(adaptive_boost, 2),
            "adjusted_foreground_rgb": adj_fg,
            "adjusted_foreground_hex": f"#{adj_fg[0]:02x}{adj_fg[1]:02x}{adj_fg[2]:02x}",
        }
