# 📊 Venom PDF — Project Status

> **Last Updated:** 2026-09-29  
> **Current Phase:** Phase 5 Complete ✅ → Ready for Phase 6 (Testing & Final Polish)  
> **Overall Progress:** ██████████ 96%

---

## 🏁 Completed Sprint: OS Integration & CLI Mode (Phase 5)

| Task | Status | Notes |
|------|--------|-------|
| Headless CLI Parser (`cli.rs`) | ✅ Done | Zero-dependency command line parser supporting `--invert`, `--batch`, `--theme`, `--image-mode`, `--pages`, `--output`, `--list-themes` |
| Headless Engine Execution | ✅ Done | Non-GUI direct file processing via `invert_pdf_sync` with exit codes 0/1 |
| Windows Console Attachment | ✅ Done | `AttachConsole(ATTACH_PARENT_PROCESS)` enables native terminal stdout/stderr output in PowerShell & CMD |
| Windows Explorer Context Menu | ✅ Done | Per-user `HKCU` registry integration (`SystemFileAssociations\.pdf` & `Directory\shell\VenomPDFBatch`) requiring zero admin rights |
| Tauri OS Commands | ✅ Done | `check_context_menu_status`, `enable_context_menu`, `disable_context_menu` |
| Frontend Shell & CLI Modal | ✅ Done | `OsIntegrationModal.tsx` with live context menu status toggle & 1-click copy CLI cheatsheet |
| Bundler & File Associations | ✅ Done | `tauri.conf.json` configured with `.pdf` file associations, WiX, and NSIS configurations |
| Registry Scripts | ✅ Done | Standalone `.reg` scripts in `assets/registry/` for manual & enterprise deployment |
| CLI Unit Test Suite | ✅ Done | Complete test matrix for flag parsing, defaults, positional files, and error handling |

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

### Phase 5: OS Integration & CLI Mode ██████████ 100%
- [x] Windows File Explorer context menu registration (`ContextMenuManager`)
- [x] Headless CLI parser (`--invert`, `--batch`, `--theme`, `--image-mode`, `--pages`, `--output`)
- [x] Console output attachment on Windows (`AttachConsole`)
- [x] UI Context Menu management & CLI Cheatsheet modal (`OsIntegrationModal`)
- [x] Standalone registry deployment scripts (`assets/registry/*.reg`)
- [x] Installer & file association configuration in `tauri.conf.json`
- [x] CLI parser unit test matrix

### Phase 6: Testing & Final Polish ███████░░░ 70%
- [x] Rust unit test suites in `color_mapper`, `content_stream`, `image_detector`, `page_filter`, `theme`, `batch`, `cli`, `context_menu`
- [x] Rust integration test suite in `tests/integration_test.rs`
- [x] Frontend TypeScript type-checking & production bundle (`pnpm build`)
- [ ] Visual regression test suite
- [ ] Cross-platform performance benchmarks

---

## 📝 Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-09-29 | **Zero-Dependency CLI Parser** | Handcrafted argument parser avoids heavy CLI dependency overhead and keeps compile times minimal |
| 2026-09-29 | **Dual-Subsystem Windows Routing** | Automatically routes between Headless CLI execution (`run_cli`) and GUI runtime (`run`) based on launch arguments |
| 2026-09-29 | **HKCU Context Menu Registration** | Writing to `HKEY_CURRENT_USER\Software\Classes\SystemFileAssociations\.pdf` eliminates UAC / Administrator prompts |
| 2026-09-29 | **Windows Terminal Console Attachment** | `AttachConsole(ATTACH_PARENT_PROCESS)` enables Windows GUI binary to print directly to PowerShell / CMD |
| 2026-09-29 | **Folder Scanner (`scan_folder_for_pdfs`)** | Adds native directory traversal to instantly discover all PDF files in a chosen folder |
| 2026-09-29 | **Granular Event Emission** | Emits start (25%), progress, and completion (100%) events with file names and error messages for maximum UI responsiveness |
