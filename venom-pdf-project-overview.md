# 🐍 Venom PDF — Project Overview & Market Research

<p align="center">
  <img src="C:/Users/PRATIK SINGH/.gemini/antigravity/brain/99000c62-1cf5-45db-b497-b831fed9c948/logo.jpg" alt="Venom PDF Logo" width="160" />
</p>

---

## 🎯 Project Summary

**Venom PDF** is a native desktop application (`.exe`) built with **Tauri 2.0 + Rust** that intelligently converts PDF documents to dark mode — without destroying text quality, searchability, or image integrity.

**Repo Name:** `venom-pdf`

---

## 🔍 Market Research: The Competition & Their Failures

### Competitor Landscape (2026)

| Tool | Type | Status | Fatal Flaw |
|------|------|--------|------------|
| **PDF Dark** (pdfdark.org) | Browser converter | Active | Browser memory limits crash on large files |
| **NightPDF** | Electron desktop reader | ⚠️ **Archived** (abandoned Aug 2024) | Only a viewer — can't export inverted files |
| **PDF Enhancer** | Python/Tkinter desktop | Active but niche | Python dependency, 50 MB+ exe, slow on 500+ pages |
| **PDFDarkModeConverter** | Streamlit web app | Active but basic | Server-dependent, naïve RGB negation |
| **Adobe Acrobat** | Desktop reader | Active | View-only dark mode — no export, tied to machine |
| **SumatraPDF** | Desktop reader | Active | Keyboard shortcut (`i` key) — view-only, no save |
| **Online converters** (PDF2Go, ConvertIO) | Web tools | Active | **Rasterize** pages → blurry text, file bloat, privacy risk |

### Key Shortcomings We're Solving

```
┌─────────────────────────────────────────────────────────────┐
│              5 CRITICAL MARKET GAPS                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. RASTERIZATION TRAP                                      │
│     Online tools flatten vectors → blurry, unsearchable     │
│     2 MB PDF → 60 MB bloated image file                     │
│                                                             │
│  2. NAÏVE RGB NEGATION                                      │
│     Simple 255-R,255-G,255-B breaks photos, charts,         │
│     code highlighting — everything looks like a negative    │
│                                                             │
│  3. VIEW-ONLY LOCK-IN                                       │
│     Acrobat/Sumatra dark mode can't be exported             │
│     Share file → recipient sees original white PDF          │
│                                                             │
│  4. PRIVACY VIOLATION                                       │
│     Confidential research/legal/medical docs uploaded       │
│     to unknown servers for processing                       │
│                                                             │
│  5. EYE STRAIN (HALATION)                                   │
│     Pure #000/#FFF causes glow/blur for astigmatism         │
│     No curated reading-comfort themes exist                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Why NightPDF's Death Creates an Opportunity

NightPDF was the most popular open-source PDF dark mode tool on GitHub. It was **officially archived in August 2024** — the maintainer abandoned it. This leaves a **wide-open gap** for a modern, maintained alternative. Venom PDF directly fills this vacuum with a better architecture (Tauri instead of Electron bloat).

---

## ⚡ What Makes Venom PDF Stand Out

| Differentiator | How We Do It | No One Else Does This |
|----------------|-------------|----------------------|
| **Smart Vector Preservation** | Operate on PDF content streams directly via `lopdf` | Only PDFDark attempts this, but it's browser-only |
| **Selective Image Handling** | Detect XObjects, offer Preserve/Dim/Full Invert toggle | Every competitor does all-or-nothing |
| **Curated Dark Themes** | 5 presets (Charcoal, OLED, Sepia, Solarized, Nord) + custom | Competitors only offer "invert" or "don't" |
| **100% Offline Desktop** | Tauri .exe, zero network traffic | Web tools require upload, Electron bloated |
| **Batch Processing** | Rayon multi-threaded, entire folder at once | Only PDF Enhancer (Python, slow) attempts this |
| **Windows Context Menu** | Right-click PDF → "Invert with Venom PDF" | No competitor has this |
| **Tiny Installer** | ~15 MB (Tauri) vs. 200 MB (Electron) | NightPDF was 200 MB+, PDF Enhancer 50 MB+ |

---

## 🏗️ Tech Stack Decision

| Component | Chosen | Runner-up | Why |
|-----------|--------|-----------|-----|
| **Runtime** | Tauri 2.0 | Electron | 15 MB vs 200 MB, native Rust perf, cross-platform + mobile |
| **Backend** | Rust | Python (PyMuPDF) | Memory-safe, 10x faster, multi-threaded, tiny binary |
| **PDF Crate** | `lopdf` 0.42+ | `pdfrs` | Low-level content stream access, pure Rust, no C deps |
| **Text Extraction** | `pdf_oxide` | — | Fastest Rust crate for text/layout extraction |
| **Frontend** | React + TypeScript | Svelte | Largest ecosystem, best Tauri docs, Zustand for state |
| **CSS** | Tailwind CSS | — | Utility-first, rapid UI prototyping |
| **PDF Preview** | pdf.js | — | Industry standard, battle-tested |
| **Parallelism** | Rayon | — | Data-parallel batch processing |

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| [README.md](file:///d:/venom-pdf/README.md) | Visual README with logo, mockup, features, roadmap |
| [docs/IMPLEMENTATION_PLAN.md](file:///d:/venom-pdf/docs/IMPLEMENTATION_PLAN.md) | 6-phase technical implementation plan with code samples |
| [STATUS.md](file:///d:/venom-pdf/STATUS.md) | Live project status tracker with sprint progress |
| [docs/ARCHITECTURE.md](file:///d:/venom-pdf/docs/ARCHITECTURE.md) | System architecture diagrams & module map |
| [docs/CONTRIBUTING.md](file:///d:/venom-pdf/docs/CONTRIBUTING.md) | Contributor setup guide & PR guidelines |
| [.github/agents.yml](file:///d:/venom-pdf/.github/agents.yml) | Agent config (5 roles, 3 workflows) |
| [LICENSE](file:///d:/venom-pdf/LICENSE) | MIT License |
| [.gitignore](file:///d:/venom-pdf/.gitignore) | Tauri + React + Rust gitignore |
| [assets/logo.jpg](file:///d:/venom-pdf/assets/logo.jpg) | Logo concept (snake fang + PDF icon) |
| [assets/ui-mockup.jpg](file:///d:/venom-pdf/assets/ui-mockup.jpg) | UI mockup (VS Code-style 3-panel dark layout) |

---

## 📅 8-Week Roadmap

```
Week 1  ████████░░░░░░░░░░░░░░░░  Scaffolding (Tauri + React + Rust)
Week 2  ░░░░░░░░████████░░░░░░░░  Core Engine: content stream parser
Week 3  ░░░░░░░░░░░░░░░░████████  Core Engine: color mapper + themes
Week 4  ░░░░░░░░░░░░░░░░░░░░████  Frontend: UI components
Week 5  ░░░░░░░░░░░░░░░░░░░░░░░░  Batch processing + progress
Week 6  ░░░░░░░░░░░░░░░░░░░░░░░░  OS integration + context menu
Week 7  ░░░░░░░░░░░░░░░░░░░░░░░░  Testing & polish
Week 8  ░░░░░░░░░░░░░░░░░░░░░░░░  v1.0 Release 🚀
```

---

## 🚀 Next Steps

1. **Initialize Tauri 2.0 project** — `pnpm create tauri-app`
2. **Set up Cargo.toml** with `lopdf`, `rayon`, `image` dependencies
3. **Build the content stream parser** — the hardest and most critical piece
4. **Prototype a single-file inversion** via CLI before building the UI

> **Ready to start building?** Say the word and I'll scaffold the full Tauri project with the Rust backend.
