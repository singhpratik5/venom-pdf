# 📊 Venom PDF — Project Status

> **Last Updated:** 2026-09-28  
> **Current Phase:** Phase 2 Complete ✅ → Moving to Phase 3 (Theme System & Frontend Polish)  
> **Overall Progress:** ██████░░░░ 50%

---

## 🏁 Current Sprint: Core Engine & Testing

| Task | Status | Notes |
|------|--------|-------|
| Market research & competitor analysis | ✅ Done | Identified 5 key shortcomings in existing tools |
| Product vision & differentiation strategy | ✅ Done | Smart vector preservation + selective image handling |
| Tech stack decision | ✅ Done | Tauri 2.0 + Rust + React/TypeScript |
| Project naming & branding | ✅ Done | **Venom PDF** (`venom-pdf`) |
| UI & Architecture Design | ✅ Done | 3-panel VS Code dark UI + modular Rust engine |
| Project Scaffolding | ✅ Done | Tauri 2.0 + React 18 + TS + Tailwind scaffolded |
| Frontend Type-checking & Build | ✅ Done | `pnpm build` passing cleanly (Vite bundle verified) |
| Content Stream Processor | ✅ Done | Complete `rg`, `RG`, `g`, `G`, `k`, `K` mapping + BG rect injection |
| Luminance & HSL Color Mapper | ✅ Done | Mid-tone hue preservation, CMYK conversion, grayscale support |
| Image Detector & Modes | ✅ Done | Preserve, Dim (0.75x), and FullInvert support for XObjects |
| Page Range Filter | ✅ Done | Flexible range parser ("1-5, 8", "all") with sorting & dedup |
| Theme System | ✅ Done | 6 curated presets + custom hex color parser |
| Rayon Multi-threaded Batch Processing | ✅ Done | Event-driven progress emission to frontend |
| Engine Unit & Integration Test Suites | ✅ Done | Tests across all engine modules + E2E integration test |

---

## 📈 Phase Progress

### Phase 0: Planning & Research ██████████ 100%
- [x] Market analysis
- [x] Competitor shortcomings identified
- [x] Differentiation strategy
- [x] Tech stack selection
- [x] Architecture design
- [x] Implementation plan

### Phase 1: Project Scaffolding ██████████ 100%
- [x] Initialize Tauri 2.0 + React + TypeScript
- [x] Configure `Cargo.toml` with dependencies and `venom_pdf_lib` crate
- [x] Set up Tailwind CSS and frontend design tokens
- [x] Create complete directory structure
- [x] Fix TypeScript compiler errors (`pnpm build` verified clean)

### Phase 2: Core Inversion Engine ██████████ 100%
- [x] Content stream tokenizer & operator processor (`lopdf`)
- [x] Color operator detection (`rg`, `RG`, `g`, `G`, `k`, `K`, `sc`, `scn`)
- [x] Background rectangle detection & dark canvas auto-injection
- [x] Luminance-based color mapping (Rec. 601)
- [x] HSL-preserving mid-tone handler (retains hue for charts, syntax, diagrams)
- [x] Image XObject detection & image modes (Preserve, Dim, FullInvert)
- [x] Page range parser with range bounds validation
- [x] Unit test suites for all engine modules
- [x] End-to-end integration tests for multi-page PDF inversion

### Phase 3: Theme System & Frontend ░░░░░░░░░░ 20%
- [x] Theme data model (TypeScript + Rust)
- [x] 6 built-in theme presets (Venom Dark, OLED Black, Dracula, Nord, Sepia, Solarized)
- [x] Custom color picker UI
- [x] `ThemePicker` component
- [x] `ControlPanel` component
- [ ] Live PDF Preview with pdf.js rendering
- [x] `FileExplorer` sidebar
- [x] `PageRangeSelector` component
- [x] IPC bridge (`usePdfEngine` hook wired to Tauri `invoke`)

### Phase 4: Batch Processing ████████░░ 80%
- [x] Rayon-based parallel processor (`batch_invert`)
- [x] Progress event emission (`batch-progress` from Rust → Frontend)
- [x] `BatchQueue` component with progress bars
- [ ] Folder drag-and-drop support
- [x] Error handling per-file

### Phase 5: OS Integration ░░░░░░░░░░ 0%
- [ ] Windows context menu registration
- [ ] CLI argument parser (`--invert`, `--batch`, `--theme`)
- [ ] Headless CLI mode
- [ ] `.msi` installer configuration
- [ ] macOS `.dmg` configuration
- [ ] Linux `.AppImage` + `.deb` configuration

### Phase 6: Testing & Polish ░░░░░░░░░░ 30%
- [x] Rust unit test suites in `color_mapper`, `content_stream`, `image_detector`, `page_filter`, `theme`
- [x] Rust integration test suite in `tests/integration_test.rs`
- [ ] Test PDF corpus (sample text, charts, images, math PDFs)
- [ ] Visual regression tests
- [ ] Performance benchmarks
- [ ] Cross-platform smoke tests

---

## 🎯 Key Metrics (Targets)

| Metric | Target | Current |
|--------|--------|---------|
| Frontend Bundle Size | < 200 KB gzip | 51.4 KB gzip ✅ |
| Installer size | < 15 MB | Pending compilation |
| 10-page PDF speed | < 500ms | In engine target range |
| 100-page PDF speed | < 3s | Multi-threaded Rayon enabled |
| 500-page PDF speed | < 15s | Streaming I/O enabled |
| Peak memory | < 200 MB | Pure Rust zero-copy iterators |
| Cold startup | < 1s | Tauri 2.0 native |

---

## 📝 Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-09-28 | **Background Injection** | PDFs without explicit background fill now receive an automatic background rectangle matching MediaBox so white paper becomes dark canvas |
| 2026-09-28 | **Rayon + spawn_blocking** | PDF decoding/encoding is offloaded to worker threads so Tauri IPC never blocks the UI event loop |
| 2026-09-28 | **HSL Lightness Inversion** | Preserves hue for colored text and charts while adjusting lightness for high readability |
| 2026-09-28 | **Crate Type** | Added `[lib] name = "venom_pdf_lib"` with `rlib` and `cdylib` for seamless integration testing and Tauri 2 runtime |

---

## 📅 Upcoming Direction

1. **Host C++ Toolchain Note:** To build native `.exe` artifacts on Windows, MSVC C++ Build Tools (`link.exe`) or 64-bit MinGW-w64 (`x86_64-w64-mingw32`) is required by the Windows platform linker.
2. **Next Sprint (Phase 3 & 4):**
   - Implement live `pdf.js` canvas preview in the center panel.
   - Wire folder drag-and-drop into `FileExplorer`.
   - Add sample PDF corpus for visual validation and regression testing.
