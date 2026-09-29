# 📊 Venom PDF — Project Status

> **Last Updated:** 2026-09-29  
> **Current Phase:** Phase 4 Complete ✅ → Moving to Phase 5 (OS Integration & CLI)  
> **Overall Progress:** █████████░ 88%

---

## 🏁 Current Sprint: Batch Processing Engine & UI Integration

| Task | Status | Notes |
|------|--------|-------|
| Rayon Parallel Batch Engine (`batch_invert`) | ✅ Done | Data-parallel multi-core file processor |
| Folder Scanner (`scan_folder_for_pdfs`) | ✅ Done | Recursive directory walker detecting all `.pdf` documents |
| Real-time Event Streaming | ✅ Done | Detailed `batch-progress` events with file name, id, progress, error |
| BatchQueue Component | ✅ Done | Queue statistics bar, action toolbar, individual progress bars |
| "Queue All Open" Workflow | ✅ Done | Instantly stages all Explorer documents for batch processing |
| "Scan Folder" Workflow | ✅ Done | Native folder picker staging whole folders of PDFs into queue |
| Per-File Error Isolation | ✅ Done | Failed files display clear error banners without halting batch |
| Dual-Runtime Support | ✅ Done | Full Tauri command execution + smooth web simulation fallback |
| Frontend Production Build | ✅ Done | `pnpm build` passes with zero errors/warnings in < 5s |

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

### Phase 4: Batch Processing ██████████ 100%
- [x] Rayon-based parallel processor (`batch_invert`)
- [x] Folder scanner (`scan_folder_for_pdfs`) & picker dialog
- [x] Progress event emission (`batch-progress` from Rust → Frontend)
- [x] `BatchQueue` component with progress bars & statistics
- [x] "Queue All Open" & "Scan Folder" UI workflows
- [x] Per-file error handling & status tracking

### Phase 5: OS Integration ░░░░░░░░░░ 0%
- [ ] Windows context menu registration
- [ ] CLI argument parser (`--invert`, `--batch`, `--theme`)
- [ ] Headless CLI mode
- [ ] Installer configurations (`.msi`, `.dmg`, `.AppImage`)

### Phase 6: Testing & Polish █████░░░░░ 50%
- [x] Rust unit test suites in `color_mapper`, `content_stream`, `image_detector`, `page_filter`, `theme`, `batch`
- [x] Rust integration test suite in `tests/integration_test.rs`
- [x] Vite production bundle verification
- [ ] Visual regression test suite
- [ ] Cross-platform performance benchmarks

---

## 📝 Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-09-29 | **Folder Scanner (`scan_folder_for_pdfs`)** | Adds native directory traversal to instantly discover all PDF files in a chosen folder |
| 2026-09-29 | **Granular Event Emission** | Emits start (25%), progress, and completion (100%) events with file names and error messages for maximum UI responsiveness |
| 2026-09-29 | **Queue Staging Model** | Users can combine individual files, whole folders, and open documents into a single unified queue before firing the batch |
