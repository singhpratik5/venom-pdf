# 📊 Venom PDF — Project Status

> **Last Updated:** 2026-09-28  
> **Current Phase:** Phase 0 — Planning & Research  
> **Overall Progress:** ██░░░░░░░░ 10%

---

## 🏁 Current Sprint: Foundation

| Task | Status | Notes |
|------|--------|-------|
| Market research & competitor analysis | ✅ Done | Identified 5 key shortcomings in existing tools |
| Product vision & differentiation strategy | ✅ Done | Smart vector preservation + selective image handling |
| Tech stack decision | ✅ Done | Tauri 2.0 + Rust + React/TypeScript |
| Project naming & branding | ✅ Done | **Venom PDF** (`venom-pdf`) |
| Logo concept | ✅ Done | Snake fang + PDF icon, green/purple gradient |
| UI mockup | ✅ Done | VS Code-style dark UI with 3-panel layout |
| README with visual design | ✅ Done | Badges, feature tables, roadmap |
| Implementation plan | ✅ Done | 6 phases, 8-week timeline |
| Directory & file structure design | ✅ Done | Full tree planned |
| Agent configuration files | ✅ Done | `.github/agents.yml` |
| Initialize Tauri project | ⬜ Not Started | — |
| Rust PDF engine prototype | ⬜ Not Started | — |
| Frontend React scaffolding | ⬜ Not Started | — |

---

## 📈 Phase Progress

### Phase 0: Planning & Research ██████████ 100%
- [x] Market analysis
- [x] Competitor shortcomings identified
- [x] Differentiation strategy
- [x] Tech stack selection
- [x] Architecture design
- [x] Implementation plan

### Phase 1: Project Scaffolding ░░░░░░░░░░ 0%
- [ ] Initialize Tauri 2.0 + React + TypeScript
- [ ] Configure `Cargo.toml` with dependencies
- [ ] Set up ESLint, Prettier, Tailwind CSS
- [ ] Create directory structure
- [ ] Configure build pipeline
- [ ] Set up GitHub Actions CI

### Phase 2: Core Inversion Engine ░░░░░░░░░░ 0%
- [ ] Content stream tokenizer
- [ ] Color operator detection (`rg`, `RG`, `g`, `G`, `k`, `K`)
- [ ] Background rectangle detection
- [ ] Luminance-based color mapping
- [ ] HSL-preserving mid-tone handler
- [ ] Image XObject detection
- [ ] Image dimming filter
- [ ] Unit tests for color mapper

### Phase 3: Theme System & Frontend ░░░░░░░░░░ 0%
- [ ] Theme data model (TypeScript + Rust)
- [ ] 5 built-in theme presets
- [ ] Custom color picker UI
- [ ] `ThemePicker` component
- [ ] `ControlPanel` component
- [ ] `PDFPreview` with pdf.js
- [ ] `FileExplorer` sidebar
- [ ] `PageRangeSelector` component
- [ ] IPC bridge (`usePdfEngine` hook)

### Phase 4: Batch Processing ░░░░░░░░░░ 0%
- [ ] Rayon-based parallel processor
- [ ] Progress event emission (Rust → Frontend)
- [ ] `BatchQueue` component with progress bars
- [ ] Folder drag-and-drop support
- [ ] Error handling per-file

### Phase 5: OS Integration ░░░░░░░░░░ 0%
- [ ] Windows context menu registration
- [ ] CLI argument parser (`--invert`, `--batch`, `--theme`)
- [ ] Headless CLI mode
- [ ] `.msi` installer configuration
- [ ] macOS `.dmg` configuration
- [ ] Linux `.AppImage` + `.deb` configuration

### Phase 6: Testing & Polish ░░░░░░░░░░ 0%
- [ ] Test PDF corpus (6+ sample files)
- [ ] Rust unit test suite
- [ ] Integration tests (full pipeline)
- [ ] Visual regression tests
- [ ] Performance benchmarks
- [ ] Cross-platform smoke tests
- [ ] README screenshots with real output

---

## 🎯 Key Metrics (Targets)

| Metric | Target | Current |
|--------|--------|---------|
| Installer size | < 15 MB | — |
| 10-page PDF speed | < 500ms | — |
| 100-page PDF speed | < 3s | — |
| 500-page PDF speed | < 15s | — |
| Peak memory | < 200 MB | — |
| Cold startup | < 1s | — |

---

## 🐛 Known Issues / Blockers

| Issue | Severity | Status |
|-------|----------|--------|
| None yet | — | Project in planning phase |

---

## 📝 Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-09-28 | Name: **Venom PDF** | Memorable, edgy, no conflicts. Repo: `venom-pdf` |
| 2026-09-28 | Stack: **Tauri 2.0 + Rust** | Small binary, native perf, cross-platform, no Electron bloat |
| 2026-09-28 | PDF crate: **lopdf** | Pure Rust, no C deps, mature, low-level content stream access |
| 2026-09-28 | Frontend: **React + TypeScript** | Largest ecosystem, best Tauri support, Zustand for state |
| 2026-09-28 | **Desktop-first** (not web) | Memory limits in browser for large PDFs, privacy, batch support |
| 2026-09-28 | **Smart inversion** (not naïve) | Luminance-based mapping preserves mid-tones, avoids photo negatives |

---

## 📅 Upcoming Milestones

| Milestone | Target Date | Description |
|-----------|------------|-------------|
| **Alpha Build** | Week 3 | Core engine works, can invert a simple PDF via CLI |
| **Beta Build** | Week 5 | Full UI, theme picker, batch processing |
| **RC1** | Week 7 | OS integration, installer, all tests passing |
| **v1.0 Release** | Week 8 | Production-ready with GitHub Releases |
