# 🏗️ Venom PDF — Architecture Document

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER                                      │
│         (Desktop GUI / CLI / Windows Context Menu)                  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │     TAURI RUNTIME     │
                    │   (IPC Event Bridge)  │
                    └───────┬───────┬───────┘
                            │       │
              ┌─────────────▼─┐   ┌─▼─────────────┐
              │   FRONTEND    │   │    BACKEND     │
              │  (WebView)    │   │    (Rust)      │
              │               │   │                │
              │ React + TS    │   │ ┌────────────┐ │
              │ Tailwind CSS  │   │ │  Commands  │ │
              │ pdf.js        │   │ │  (IPC)     │ │
              │ Zustand       │   │ └──────┬─────┘ │
              │               │   │        │       │
              └───────────────┘   │ ┌──────▼─────┐ │
                                  │ │   Engine   │ │
                                  │ │            │ │
                                  │ │ ┌────────┐ │ │
                                  │ │ │Content │ │ │
                                  │ │ │Stream  │ │ │
                                  │ │ │Parser  │ │ │
                                  │ │ └────────┘ │ │
                                  │ │ ┌────────┐ │ │
                                  │ │ │ Color  │ │ │
                                  │ │ │ Mapper │ │ │
                                  │ │ └────────┘ │ │
                                  │ │ ┌────────┐ │ │
                                  │ │ │ Image  │ │ │
                                  │ │ │Detector│ │ │
                                  │ │ └────────┘ │ │
                                  │ │ ┌────────┐ │ │
                                  │ │ │ Theme  │ │ │
                                  │ │ │Applier │ │ │
                                  │ │ └────────┘ │ │
                                  │ │ ┌────────┐ │ │
                                  │ │ │ Batch  │ │ │
                                  │ │ │Proc.   │ │ │
                                  │ │ └────────┘ │ │
                                  │ └────────────┘ │
                                  └────────────────┘
```

## Data Flow

```
Input PDF                    Output PDF
   │                              ▲
   ▼                              │
┌──────────┐    ┌──────────┐   ┌──────────┐
│  Parse   │───▶│ Process  │──▶│ Rebuild  │
│  lopdf   │    │  Engine  │   │  lopdf   │
└──────────┘    └──────────┘   └──────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │  Text &  │ │  Images  │ │  Meta &  │
   │  Vector  │ │  (XObj)  │ │Bookmarks │
   │  Streams │ │          │ │          │
   └──────────┘ └──────────┘ └──────────┘
   Invert colors  Preserve/   Pass through
   via theme map  Dim/Invert  unchanged
```

## Key Design Principles

1. **Never Rasterize** — All operations on vector content streams. Text quality is sacred.
2. **Separation of Concerns** — Rust owns PDF logic. Frontend owns display. IPC bridges them.
3. **User Control** — Every heuristic has a manual override. Smart defaults, full configurability.
4. **Offline First** — Zero network calls. Ever.
5. **Fail Gracefully** — If a page can't be inverted, skip it and report. Never crash on corrupt input.

## Module Responsibilities

| Module | File | Responsibility |
|--------|------|----------------|
| Content Stream Parser | `engine/content_stream.rs` | Tokenize PDF content streams into operators & operands |
| Color Mapper | `engine/color_mapper.rs` | Luminance-based color transformation with theme support |
| Image Detector | `engine/image_detector.rs` | Identify XObject images, classify as photo/diagram/icon |
| Theme Applicator | `engine/theme.rs` | Define themes, apply color mappings per theme profile |
| Page Filter | `engine/page_filter.rs` | Parse page range strings, filter pages for processing |
| Batch Processor | `commands/batch.rs` | Multi-threaded file processing with progress events |
| Invert Command | `commands/invert.rs` | Single-file inversion Tauri command |
| Preview Command | `commands/preview.rs` | Generate preview thumbnails for the UI |
