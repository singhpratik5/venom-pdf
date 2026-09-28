# Contributing to Venom PDF 🐍

Thanks for your interest in contributing! Here's how to get started.

## Prerequisites

- **Rust** 1.75+ ([install](https://rustup.rs/))
- **Node.js** 20+ ([install](https://nodejs.org/))
- **pnpm** (`npm install -g pnpm`)
- **Tauri CLI** (`cargo install tauri-cli`)

## Development Setup

```bash
git clone https://github.com/yourusername/venom-pdf.git
cd venom-pdf
pnpm install
pnpm tauri dev    # Starts dev mode with hot reload
```

## Project Structure

| Directory | What Lives Here |
|-----------|----------------|
| `src/` | React frontend (TypeScript + Tailwind) |
| `src-tauri/src/engine/` | Core PDF inversion engine (Rust) |
| `src-tauri/src/commands/` | Tauri IPC command handlers (Rust) |
| `docs/` | Documentation |
| `assets/` | Logo, mockups, screenshots |

## Pull Request Guidelines

1. **One feature per PR** — keep changes focused
2. **Write tests** — especially for engine changes
3. **Run the full suite** before submitting:
   ```bash
   cargo test --manifest-path src-tauri/Cargo.toml
   pnpm lint
   ```
4. **Follow existing code style** — Rustfmt for Rust, Prettier for TypeScript

## Reporting Bugs

Open an issue with:
- Steps to reproduce
- Expected vs. actual behavior
- Sample PDF (if possible)
- OS and Venom PDF version

## Feature Requests

Open an issue with the `enhancement` label describing your use case.

---

Thank you for making PDFs easier on everyone's eyes! 🐍
