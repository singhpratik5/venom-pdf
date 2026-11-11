"""
Venom-AI Command Line Interface.
Provides unified commands for layout inference, model evaluation, benchmarking, and API serving.
"""

import sys
import os
import argparse
import json

# Ensure parent path in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.evaluation.benchmark import run_full_benchmark
from ml.pipeline import DocumentLayoutEngine, DocumentParser, LayoutVisualizer, ContrastOptimizer
from ml.api import start_server


def main():
    parser = argparse.ArgumentParser(
        prog="venom-ai",
        description="Venom-AI: Multimodal Document Layout Intelligence and Perception CLI",
    )
    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # Command: benchmark
    p_bench = subparsers.add_parser("benchmark", help="Train models and execute performance benchmark")
    p_bench.add_argument("--report", type=str, default=None, help="Output path for JSON report")

    # Command: analyze
    p_analyze = subparsers.add_parser("analyze", help="Classify layout regions from a PDF file")
    p_analyze.add_argument("pdf_path", type=str, help="Path to input PDF document")
    p_analyze.add_argument("--page", type=int, default=0, help="Page index (0-indexed)")
    p_analyze.add_argument("--json", action="store_true", help="Output raw JSON results")

    # Command: visualize
    p_vis = subparsers.add_parser("visualize", help="Render annotated layout bounding boxes onto an image")
    p_vis.add_argument("pdf_path", type=str, help="Path to input PDF document")
    p_vis.add_argument("--output", type=str, default="layout_overlay.png", help="Output PNG path")
    p_vis.add_argument("--page", type=int, default=0, help="Page index (0-indexed)")

    # Command: serve
    p_serve = subparsers.add_parser("serve", help="Launch FastAPI microservice")
    p_serve.add_argument("--host", type=str, default="127.0.0.1", help="Host address")
    p_serve.add_argument("--port", type=int, default=8000, help="Listening port")

    args = parser.parse_args()

    if args.command == "benchmark":
        run_full_benchmark(output_report_path=args.report)

    elif args.command == "analyze":
        doc_parser = DocumentParser()
        engine = DocumentLayoutEngine()
        parsed = doc_parser.parse_pdf(args.pdf_path, args.page)
        res = engine.analyze_elements(parsed["elements"], parsed["page_width"], parsed["page_height"])

        if args.json:
            print(json.dumps(res, indent=2))
        else:
            print(f"\n--- Layout Analysis: {args.pdf_path} (Page {args.page + 1}) ---")
            print(f"Elements detected: {res['element_count']}")
            print("Category breakdown:")
            for label, count in res["summary"].items():
                print(f"  {label.ljust(12)}: {count}")

    elif args.command == "visualize":
        doc_parser = DocumentParser()
        engine = DocumentLayoutEngine()
        visualizer = LayoutVisualizer()

        parsed = doc_parser.parse_pdf(args.pdf_path, args.page)
        res = engine.analyze_elements(parsed["elements"], parsed["page_width"], parsed["page_height"])
        out_path = visualizer.save_annotated_page(
            res["elements"],
            args.output,
            int(parsed["page_width"]),
            int(parsed["page_height"]),
        )
        print(f"Annotated layout visualization saved to: {out_path}")

    elif args.command == "serve":
        print(f"Starting Venom-AI API on {args.host}:{args.port}...")
        start_server(host=args.host, port=args.port)

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
