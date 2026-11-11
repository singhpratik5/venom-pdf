"""
FastAPI Microservice for Venom-AI Document Intelligence.
Serves layout analysis, element segmentation, and perceptual contrast optimization.
"""

from typing import List, Dict, Any, Optional
import os
import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ..pipeline import DocumentLayoutEngine, ContrastOptimizer, DocumentParser
from ..data import LAYOUT_CLASSES

app = FastAPI(
    title="Venom-AI Document Layout Intelligence API",
    description="Microservice providing real-time multimodal layout classification and accessibility contrast optimization.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Engine Singletons
engine = DocumentLayoutEngine()
contrast_opt = ContrastOptimizer()
parser = DocumentParser()


class BoundingBoxElement(BaseModel):
    id: Optional[str] = "elem_0"
    bbox: List[float] = Field(..., description="[x0, y0, x1, y1] coordinates")
    text: Optional[str] = Field("", description="Text string inside region")


class LayoutAnalysisRequest(BaseModel):
    page_width: float = 595.0
    page_height: float = 842.0
    elements: List[BoundingBoxElement]


class ContrastOptimizationRequest(BaseModel):
    background_rgb: List[int] = Field([30, 30, 30], description="RGB background [R, G, B]")
    foreground_rgb: List[int] = Field([212, 212, 212], description="RGB foreground [R, G, B]")
    layout_summary: Optional[Dict[str, int]] = None


@app.get("/health")
def health():
    """Service health and model readiness probe."""
    return {
        "status": "healthy",
        "engine_ready": engine.is_ready(),
        "model_format": "ONNX Runtime v1.17+",
        "supported_classes": LAYOUT_CLASSES,
        "feature_dimension": engine.feature_extractor.feature_dim,
    }


@app.post("/analyze/elements")
def analyze_elements(req: LayoutAnalysisRequest):
    """
    Classifies a batch of document page bounding boxes using ONNX Runtime.
    """
    raw_elements = [el.model_dump() for el in req.elements]
    result = engine.analyze_elements(raw_elements, req.page_width, req.page_height)
    return result


@app.post("/optimize/contrast")
def optimize_contrast(req: ContrastOptimizationRequest):
    """
    Calculates WCAG AAA contrast compliance and applies content-aware adaptive boost.
    """
    bg = tuple(req.background_rgb)
    fg = tuple(req.foreground_rgb)
    summary = req.layout_summary or {}
    res = contrast_opt.optimize_theme_for_layout(bg, fg, summary)
    return res


def start_server(host: str = "127.0.0.1", port: int = 8000):
    """Launch FastAPI with Uvicorn worker."""
    uvicorn.run(app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    start_server()
