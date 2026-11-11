"""
Document Layout Visualizer.
Renders predicted bounding boxes, class labels, and confidence scores onto document pages.
"""

import os
from typing import List, Dict, Any, Optional
from PIL import Image, ImageDraw, ImageFont


class LayoutVisualizer:
    """
    Renders visual bounding box overlays with class-coded colors and confidence tags.
    """

    @staticmethod
    def hex_to_rgb(hex_code: str) -> tuple:
        hex_code = hex_code.lstrip("#")
        return tuple(int(hex_code[i:i+2], 16) for i in (0, 2, 4))

    def render_overlay(
        self,
        elements: List[Dict[str, Any]],
        page_width: int = 595,
        page_height: int = 842,
        base_image: Optional[Image.Image] = None,
        scale: float = 1.5,
    ) -> Image.Image:
        """
        Draws bounding boxes and labels onto the page.
        """
        w = int(page_width * scale)
        h = int(page_height * scale)

        if base_image is not None:
            img = base_image.resize((w, h), Image.Resampling.LANCZOS).convert("RGBA")
        else:
            # Clean white canvas
            img = Image.new("RGBA", (w, h), (255, 255, 255, 255))

        overlay = Image.new("RGBA", (w, h), (255, 255, 255, 0))
        draw = ImageDraw.Draw(overlay)

        for el in elements:
            bbox = el.get("bbox", [0, 0, 100, 50])
            label = el.get("label", "paragraph")
            conf = el.get("confidence", 1.0)
            hex_color = el.get("color", "#4ade80")
            rgb = self.hex_to_rgb(hex_color)

            # Scale coordinates
            x0 = int(bbox[0] * scale)
            y0 = int(bbox[1] * scale)
            x1 = int(bbox[2] * scale)
            y1 = int(bbox[3] * scale)

            # Semi-transparent rectangle fill
            fill_color = (rgb[0], rgb[1], rgb[2], 35)
            border_color = (rgb[0], rgb[1], rgb[2], 220)

            draw.rectangle([x0, y0, x1, y1], fill=fill_color, outline=border_color, width=2)

            # Label badge
            badge_text = f"{label} ({int(conf * 100)}%)"
            badge_h = 16
            badge_w = len(badge_text) * 7 + 8
            badge_y = max(0, y0 - badge_h)

            draw.rectangle([x0, badge_y, x0 + badge_w, badge_y + badge_h], fill=border_color)
            draw.text((x0 + 4, badge_y + 2), badge_text, fill=(255, 255, 255, 255))

        # Composite overlay
        out = Image.alpha_composite(img, overlay).convert("RGB")
        return out

    def save_annotated_page(
        self,
        elements: List[Dict[str, Any]],
        output_path: str,
        page_width: int = 595,
        page_height: int = 842,
    ) -> str:
        """Renders and saves annotated image to file."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        img = self.render_overlay(elements, page_width, page_height)
        img.save(output_path)
        return output_path
