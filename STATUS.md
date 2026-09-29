# 📊 Venom PDF — Project Status

> **Last Updated:** 2026-09-29  
> **Current Phase:** Phase 3 Complete ✅ → Moving to Phase 4 (Batch Processing Polish) & Phase 5  
> **Overall Progress:** ████████░░ 75%

---

## 🏁 Current Sprint: Theme System & PDF.js Preview UI Integration

| Task | Status | Notes |
|------|--------|-------|
| PDF.js Integration (`pdfjs-dist`) | ✅ Done | Native worker setup, ESM-compatible Vite pipeline |
| Live Canvas Preview | ✅ Done | High DPI responsive rendering with auto-cancel on page flips |
| Real-time Dark Theme Simulation | ✅ Done | GPU-accelerated SVG `<feColorMatrix>` calculating linear color mapping |
| Drag & Drop Document Loader | ✅ Done | Drag `.pdf` files directly onto viewport or explorer |
| Built-in Demo Generator | ✅ Done | Instant multi-page sample PDF byte generator for quick testing |
| Curated Theme Presets | ✅ Done | Venom Dark, OLED Black, Dracula, Nord, Sepia, Solarized, Custom |
| Preview Mode Switch | ✅ Done | One-click toggle between Inverted Theme and Original Document |
| Viewer Controls | ✅ Done | Page jump, keyboard shortcuts, zoom (50%-250%), reset |
| Frontend Production Build | ✅ Done | `pnpm build` passing cleanly with zero warnings/errors |

---

## 📈 Phase Progress

### Phase 0: Planning & Research ██████████ 100%
- [x] Market analysis & competitor flaws identified
- [x] Differentiation strategy
- [x] Architecture design & implementation plan

### Phase 1: Project Scaffolding ██████████ 100%
- [x] Tauri 2.0 + React + TypeScript + Tailwind
- [x] `Cargo.toml` configured with `venom_pdf_lib` crate
- [x] Project directory structure

### Phase 2: Core Inversion Engine ██████████ 100%
- [x] Content stream tokenizer & operator processor (`lopdf`)
- [x] Color operator detection (`rg`, `RG`, `g`, `G`, `k`, `K`, `sc`, `scn`)
- [x] Background rectangle detection & dark canvas auto-injection
- [x] Luminance-based color mapping (Rec. 601)
- [x] HSL-preserving mid-tone handler
- [x] Image XObject detection & image modes (Preserve, Dim, FullInvert)
- [x] Page range parser with range bounds validation
- [x] Unit test suites for all engine modules
- [x] End-to-end integration tests for multi-page PDF inversion

### Phase 3: Theme System & Frontend ██████████ 100%
- [x] Theme data model (TypeScript + Rust)
- [x] 6 built-in theme presets + custom color picker
- [x] `ThemePicker` component with real-time palette cards
- [x] `ControlPanel` component with page range & image mode toggles
- [x] Live PDF Preview with `pdf.js` canvas rendering
- [x] Real-time GPU color matrix theme simulation
- [x] `FileExplorer` sidebar with file metadata & quick-close
- [x] Drag & drop file loading + built-in demo document
- [x] IPC bridge (`usePdfEngine` hook wired to Tauri `invoke`)

### Phase 4: Batch Processing ████████░░ 80%
- [x] Rayon-based parallel processor (`batch_invert`)
- [x] Progress event emission (`batch-progress` from Rust → Frontend)
- [x] `BatchQueue` component with progress bars
- [ ] Folder drag-and-drop recursive loader
- [x] Per-file error handling

### Phase 5: OS Integration ░░░░░░░░░░ 0%
- [ ] Windows context menu registration
- [ ] CLI argument parser (`--invert`, `--batch`, `--theme`)
- [ ] Headless CLI mode
- [ ] Installer configurations (`.msi`, `.dmg`, `.AppImage`)

### Phase 6: Testing & Polish ████░░░░░░ 45%
- [x] Rust unit test suites in `color_mapper`, `content_stream`, `image_detector`, `page_filter`, `theme`
- [x] Rust integration test suite in `tests/integration_test.rs`
- [x] Vite production bundle verification
- [ ] Visual regression test suite
- [ ] Cross-platform performance benchmarks

---

## 📝 Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-09-29 | **Real-time Color Matrix Filter** | Instead of re-converting the whole PDF in Rust on every theme switch, the UI dynamically computes an SVG `<feColorMatrix>` to simulate the dark mode instantly with 0ms latency |
| 2026-09-29 | **Built-in Demo Generator** | Allows users and testers to experience Venom PDF immediately without needing an external test PDF |
| 2026-09-29 | **Dual File Reading Strategy** | Supports desktop filesystem via Tauri `plugin-fs` as well as in-memory ArrayBuffers for web drag & drop |
