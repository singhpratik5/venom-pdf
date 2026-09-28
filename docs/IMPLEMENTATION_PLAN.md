# 🐍 Venom PDF — Implementation Plan

> **Version:** 1.0  
> **Last Updated:** 2026-09-28  
> **Architecture:** Tauri 2.0 (Rust backend + React/TypeScript frontend)

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        VENOM PDF APP                            │
├──────────────────────────┬──────────────────────────────────────┤
│     FRONTEND (WebView)   │          BACKEND (Rust)              │
│                          │                                      │
│  React + TypeScript      │  Tauri Commands (IPC)                │
│  Tailwind CSS            │  ┌──────────────────────────┐       │
│  pdf.js (preview)        │  │  PDF Inversion Engine    │       │
│                          │  │  ├─ ContentStreamParser  │       │
│  Components:             │  │  ├─ ColorSpaceMapper     │       │
│  ├─ FileExplorer         │  │  ├─ ImageDetector        │       │
│  ├─ ThemePicker          │  │  ├─ ThemeApplicator      │       │
│  ├─ ControlPanel         │  │  └─ BatchProcessor       │       │
│  ├─ PDFPreview           │  └──────────────────────────┘       │
│  ├─ BatchQueue           │                                      │
│  └─ PageRangeSelector    │  Crates:                             │
│                          │  ├─ lopdf (PDF manipulation)         │
│                          │  ├─ pdf_oxide (text extraction)      │
│                          │  ├─ image (raster processing)        │
│                          │  ├─ rayon (parallelism)              │
│                          │  └─ serde (serialization)            │
└──────────────────────────┴──────────────────────────────────────┘
```

---

## 🔧 Phase 1: Project Scaffolding (Week 1)

### 1.1 Initialize Tauri 2.0 Project
```bash
pnpm create tauri-app venom-pdf --template react-ts
cd venom-pdf
pnpm install
```

### 1.2 Directory Structure
```
venom-pdf/
├── src/                          # Frontend (React + TypeScript)
│   ├── components/
│   │   ├── FileExplorer.tsx      # Sidebar file browser
│   │   ├── ThemePicker.tsx       # Theme preset cards
│   │   ├── ControlPanel.tsx      # Image handling, colors, ranges
│   │   ├── PDFPreview.tsx        # pdf.js based live preview
│   │   ├── BatchQueue.tsx        # Batch processing queue
│   │   ├── PageRangeSelector.tsx # Page selection UI
│   │   └── TopToolbar.tsx        # Open, Save, Batch, Settings
│   ├── hooks/
│   │   ├── usePdfEngine.ts       # IPC bridge to Rust commands
│   │   ├── useTheme.ts           # Theme state management
│   │   └── useBatchProcessor.ts  # Batch job tracking
│   ├── stores/
│   │   └── appStore.ts           # Zustand global state
│   ├── styles/
│   │   └── globals.css           # Tailwind + custom properties
│   ├── types/
│   │   └── index.ts              # Shared TypeScript interfaces
│   ├── App.tsx
│   └── main.tsx
│
├── src-tauri/                    # Backend (Rust)
│   ├── src/
│   │   ├── main.rs               # Tauri app entry point
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── invert.rs         # Core inversion command
│   │   │   ├── batch.rs          # Batch processing command
│   │   │   ├── preview.rs        # Preview generation command
│   │   │   └── file_ops.rs       # File dialog, save operations
│   │   ├── engine/
│   │   │   ├── mod.rs
│   │   │   ├── content_stream.rs # PDF content stream parser
│   │   │   ├── color_mapper.rs   # Color space mapping logic
│   │   │   ├── image_detector.rs # Raster image detection
│   │   │   ├── theme.rs          # Theme definitions & applicator
│   │   │   └── page_filter.rs    # Page range parsing & filtering
│   │   ├── utils/
│   │   │   ├── mod.rs
│   │   │   └── error.rs          # Custom error types
│   │   └── lib.rs
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── icons/
│
├── assets/
│   ├── logo.jpg
│   └── ui-mockup.jpg
├── docs/
│   ├── IMPLEMENTATION_PLAN.md
│   ├── CONTRIBUTING.md
│   └── ARCHITECTURE.md
├── README.md
├── LICENSE
├── .gitignore
├── package.json
└── tsconfig.json
```

### 1.3 Rust Dependencies (`Cargo.toml`)
```toml
[dependencies]
tauri = { version = "2", features = ["dialog", "shell", "fs"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
lopdf = "0.42"         # Low-level PDF manipulation
image = "0.25"         # Raster image processing
rayon = "1.10"         # Parallel batch processing
thiserror = "2"        # Error handling
tokio = { version = "1", features = ["full"] }
```

---

## 🧠 Phase 2: Core Inversion Engine (Weeks 2–3)

This is the heart of Venom PDF — the Rust engine that manipulates PDF content streams.

### 2.1 Content Stream Parser (`content_stream.rs`)

PDF pages contain content streams with drawing operators. The key color-setting operators we need to intercept:

| Operator | Meaning | Action |
|----------|---------|--------|
| `g` / `G` | Set grayscale fill/stroke | Invert: `1.0 - value` |
| `rg` / `RG` | Set RGB fill/stroke | Map through theme color function |
| `k` / `K` | Set CMYK fill/stroke | Convert → RGB → theme map → CMYK |
| `cs` / `CS` | Set color space | Track current color space context |
| `sc` / `SC` | Set color (in current space) | Apply theme mapping |
| `re` + `f` | Rectangle fill (backgrounds) | Detect page-fill rectangles → apply BG color |

```rust
/// Core algorithm pseudocode
fn invert_content_stream(stream: &[u8], theme: &Theme, image_mode: ImageMode) -> Vec<u8> {
    let tokens = tokenize_pdf_stream(stream);
    let mut output = Vec::new();

    for token in tokens {
        match token {
            // Detect background rectangles (full-page fills)
            Token::Operator("re") if is_full_page_rect(&context) => {
                // Replace fill color with theme background
                output.push(theme.background.to_pdf_color_op());
            }
            
            // Invert text colors
            Token::Operator("rg") | Token::Operator("RG") => {
                let (r, g, b) = extract_rgb(&context);
                let mapped = theme.map_color(r, g, b);
                output.push(mapped.to_pdf_color_op());
            }
            
            // Handle inline images based on user preference
            Token::Operator("BI") => {
                match image_mode {
                    ImageMode::Preserve => output.push(token), // pass through
                    ImageMode::Dim => output.push(dim_image(&token, 0.7)),
                    ImageMode::FullInvert => output.push(invert_image(&token)),
                }
            }
            
            _ => output.push(token),
        }
    }
    
    output
}
```

### 2.2 Color Space Mapper (`color_mapper.rs`)

Intelligent color mapping that goes beyond simple RGB negation:

```rust
pub struct Theme {
    pub name: String,
    pub background: Color,     // e.g., #1e1e1e
    pub text: Color,           // e.g., #d4d4d4
    pub accent: Color,         // Preserved accent color
    pub link: Color,           // Link color in dark mode
}

impl Theme {
    /// Smart color mapping: not just 255-x negation
    pub fn map_color(&self, r: f32, g: f32, b: f32) -> Color {
        let luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        
        if luminance > 0.9 {
            // Near-white → map to theme background
            self.background
        } else if luminance < 0.1 {
            // Near-black → map to theme text color
            self.text
        } else {
            // Mid-tone colors → preserve hue, adjust brightness
            let (h, s, l) = rgb_to_hsl(r, g, b);
            let target_l = 1.0 - l; // Invert lightness only
            hsl_to_rgb(h, s * 0.85, target_l) // Slightly desaturate
        }
    }
}
```

### 2.3 Image Detector (`image_detector.rs`)

Detect embedded raster images using PDF XObject references:

```rust
/// Detect if a PDF object is a raster image
fn is_raster_image(xobject: &Object) -> bool {
    match xobject {
        Object::Stream(stream) => {
            let subtype = stream.dict.get(b"Subtype");
            matches!(subtype, Ok(Object::Name(ref name)) if name == b"Image")
        }
        _ => false,
    }
}

/// Apply dimming to raster image bytes
fn dim_image(image_data: &[u8], factor: f32) -> Vec<u8> {
    image_data.iter().map(|&byte| {
        (byte as f32 * factor).min(255.0) as u8
    }).collect()
}
```

---

## 🎨 Phase 3: Theme System & Frontend (Weeks 3–4)

### 3.1 Theme Presets (TypeScript)

```typescript
interface VenomTheme {
  id: string;
  name: string;
  background: string;
  text: string;
  accent: string;
  preview: string; // CSS gradient for theme card
}

const THEMES: VenomTheme[] = [
  {
    id: 'charcoal',
    name: 'Charcoal',
    background: '#1e1e1e',
    text: '#d4d4d4',
    accent: '#569cd6',
    preview: 'linear-gradient(135deg, #1e1e1e, #2d2d2d)',
  },
  {
    id: 'oled',
    name: 'OLED Black',
    background: '#000000',
    text: '#ffffff',
    accent: '#39ff14',
    preview: 'linear-gradient(135deg, #000000, #111111)',
  },
  // ... sepia, solarized, nord, custom
];
```

### 3.2 Frontend Components

| Component | Responsibility |
|-----------|---------------|
| `TopToolbar` | Open File, Save, Batch Process, Settings buttons |
| `FileExplorer` | Left sidebar — list of loaded PDFs with thumbnails |
| `ThemePicker` | Left sidebar — clickable theme preset cards |
| `PDFPreview` | Center — pdf.js rendered preview with current theme applied |
| `ControlPanel` | Right sidebar — image mode toggle, color pickers |
| `PageRangeSelector` | Right sidebar — page range input + "All"/"Selected" toggle |
| `BatchQueue` | Right sidebar — batch processing list with progress bars |

### 3.3 IPC Bridge (Frontend ↔ Rust)

```typescript
// usePdfEngine.ts
import { invoke } from '@tauri-apps/api/core';

export async function invertPdf(params: InvertParams): Promise<string> {
  return invoke('invert_pdf', {
    inputPath: params.inputPath,
    outputPath: params.outputPath,
    theme: params.theme,
    imageMode: params.imageMode,
    pageRange: params.pageRange,
  });
}

export async function batchInvert(params: BatchParams): Promise<void> {
  return invoke('batch_invert', {
    inputDir: params.inputDir,
    outputDir: params.outputDir,
    theme: params.theme,
    imageMode: params.imageMode,
  });
}
```

---

## ⚡ Phase 4: Batch Processing (Week 5)

### 4.1 Multi-threaded Batch Processor (`batch.rs`)

```rust
use rayon::prelude::*;

#[tauri::command]
async fn batch_invert(
    input_paths: Vec<String>,
    output_dir: String,
    theme: Theme,
    image_mode: ImageMode,
    window: tauri::Window,
) -> Result<(), VenomError> {
    let total = input_paths.len();
    
    input_paths.par_iter().enumerate().for_each(|(i, path)| {
        let result = invert_single_pdf(path, &output_dir, &theme, &image_mode);
        
        // Emit progress event to frontend
        window.emit("batch-progress", BatchProgress {
            current: i + 1,
            total,
            file: path.clone(),
            status: result.is_ok(),
        }).ok();
    });
    
    Ok(())
}
```

### 4.2 Progress Tracking (Frontend)

```typescript
// Listen for batch progress events from Rust
listen('batch-progress', (event: BatchProgress) => {
  updateBatchQueue(event.payload);
});
```

---

## 🖱️ Phase 5: OS Integration (Week 6)

### 5.1 Windows Context Menu Registration

Add during `.msi` installer build via WiX:

```xml
<!-- Register right-click context menu for .pdf files -->
<RegistryValue Root="HKCU"
  Key="Software\Classes\SystemFileAssociations\.pdf\shell\VenomPDF"
  Value="Invert with Venom PDF" Type="string" />
<RegistryValue Root="HKCU"
  Key="Software\Classes\SystemFileAssociations\.pdf\shell\VenomPDF\command"
  Value="&quot;[INSTALLDIR]VenomPDF.exe&quot; --invert &quot;%1&quot;" Type="string" />
```

### 5.2 CLI Mode

Support headless CLI for power users and automation:

```bash
# Single file
venom-pdf --invert document.pdf --theme charcoal --output dark_document.pdf

# Batch
venom-pdf --batch ./papers/ --theme oled --image-mode preserve --output ./dark_papers/

# Custom colors
venom-pdf --invert doc.pdf --bg "#1a1a2e" --text "#eaeaea" --output dark_doc.pdf
```

---

## 🧪 Phase 6: Testing & Polish (Weeks 7–8)

### 6.1 Test Matrix

| Test Category | What to Test |
|---------------|-------------|
| **Unit Tests (Rust)** | Color mapping, content stream parsing, page filtering |
| **Integration Tests** | Full PDF inversion pipeline with sample files |
| **Edge Cases** | Encrypted PDFs, scanned-only PDFs, mixed vector/raster |
| **Visual Regression** | Compare output PDFs against golden reference files |
| **Performance** | Benchmark: 10-page, 100-page, 500-page, 1000-page PDFs |
| **Cross-platform** | Windows 10/11, macOS 13+, Ubuntu 22.04+ |

### 6.2 Sample Test PDFs

Create/collect test corpus:
- `simple_text.pdf` — plain black-on-white text
- `colored_text.pdf` — syntax-highlighted code
- `with_images.pdf` — embedded photos + charts
- `scanned_pages.pdf` — full raster scanned document
- `mixed_content.pdf` — vector text + raster images + charts
- `large_textbook.pdf` — 500+ pages stress test

### 6.3 Performance Targets

| Metric | Target |
|--------|--------|
| 10-page PDF inversion | < 500ms |
| 100-page PDF inversion | < 3s |
| 500-page textbook | < 15s |
| Memory usage (peak) | < 200 MB |
| Installer size | < 15 MB |
| Startup time (cold) | < 1s |

---

## 📅 Timeline Summary

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Phase 1** — Scaffolding | Week 1 | Tauri project, directory structure, deps |
| **Phase 2** — Core Engine | Weeks 2–3 | Content stream parser, color mapper, image detector |
| **Phase 3** — UI & Themes | Weeks 3–4 | React frontend, theme picker, preview, controls |
| **Phase 4** — Batch Processing | Week 5 | Multi-threaded batch with progress events |
| **Phase 5** — OS Integration | Week 6 | Context menu, CLI mode, installer |
| **Phase 6** — Testing & Polish | Weeks 7–8 | Test suite, edge cases, performance optimization |
| **🚀 v1.0 Release** | Week 8 | Production installer + GitHub release |

---

## 🧩 Future Features (Post v1.0)

- **OCR Integration** — Detect scanned PDFs and offer OCR → dark text conversion
- **PDF Annotations** — Preserve/restyle highlights, underlines, sticky notes
- **Scheduled Conversion** — Watch folder + auto-convert new PDFs
- **Plugin System** — Community-contributed themes and color profiles
- **Mobile Companion** — iOS/Android app (Tauri 2.0 mobile targets)
- **PDF Merge + Split** — Combine/split while applying dark mode
