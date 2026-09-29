# 🚀 Venom PDF — GitHub Actions & Release Guide

This guide walks you through the automated **Continuous Integration (CI)**, **Multi-Platform Native Binary Builds**, and **GitHub Releases** for Venom PDF.

---

## 🏗️ Architecture of the Build Pipeline

Because native desktop applications require platform-specific C/C++ toolchains (MSVC `link.exe` on Windows, Clang / Xcode on macOS, and GCC / WebKitGTK on Linux), Venom PDF uses **GitHub Actions** cloud runners to compile production installer packages for all three major operating systems automatically.

```
                   Push to 'main'
                         │
                         ▼
             ┌───────────────────────┐
             │    .github/ci.yml     │
             │  • Frontend Verify    │
             │  • TypeScript Build   │
             │  • Rust Unit Tests    │
             │  • Linux & Win Check  │
             └───────────────────────┘

                   Push tag 'v0.1.0'
                         │
                         ▼
             ┌────────────────────────────────────────────────────────┐
             │                 .github/release.yml                    │
             │            (tauri-apps/tauri-action)                   │
             ├───────────────────┬──────────────────┬─────────────────┤
             │  windows-latest   │   ubuntu-22.04   │  macos-latest   │
             │   • MSVC Build    │   • WebKit2GTK   │   • Apple Clang │
             │   • .msi installer│   • .deb package │   • .dmg bundle │
             │   • .exe installer│   • .AppImage    │   • .app bundle │
             └───────────────────┴──────────────────┴─────────────────┘
                                         │
                                         ▼
                            GitHub Release Published
                   (All binaries attached for instant download)
```

---

## 📋 Pre-Flight Checklist Before Release

Before tagging a new release:

1. **Ensure version numbers match across configuration files:**
   - [`package.json`](../package.json): `"version": "0.1.0"`
   - [`src-tauri/Cargo.toml`](../src-tauri/Cargo.toml): `version = "0.1.0"`
   - [`src-tauri/tauri.conf.json`](../src-tauri/tauri.conf.json): `"version": "0.1.0"`

2. **Verify engine integrity locally:**
   ```bash
   pnpm verify
   pnpm build
   ```

---

## 🏷️ How to Trigger a Multi-Platform Release

To trigger GitHub Actions to build and publish a release with downloadable installer binaries:

### Step 1: Create a Git Release Tag
Create a semantic version tag (starting with `v`, e.g., `v0.1.0`):

```bash
# Ensure your local working tree is clean and on branch 'main'
git checkout main
git pull origin main

# Create the annotated version tag
git tag v0.1.0

# Push the tag to GitHub remote
git push origin v0.1.0
```

### Step 2: Monitor the Cloud Build
1. Open your repository on GitHub: [https://github.com/singhpratik5/venom-pdf](https://github.com/singhpratik5/venom-pdf)
2. Click on the **"Actions"** tab.
3. You will see the **"Release Multi-Platform Binaries"** workflow running with three parallel jobs:
   - `Build & Release (windows-latest)`: Compiles native Windows binary and bundles `.msi` and `.exe` installers.
   - `Build & Release (ubuntu-22.04)`: Compiles Linux binary and packages `.deb` and `.AppImage`.
   - `Build & Release (macos-latest)`: Compiles macOS universal binary and packages `.dmg`.

### Step 3: Access Downloadable Installers
Once the runners complete (~5–10 minutes):
1. Navigate to **Releases** on your GitHub repository:  
   `https://github.com/singhpratik5/venom-pdf/releases`
2. You will find **Venom PDF v0.1.0** published with release notes and the compiled assets ready for download:
   - `Venom PDF_0.1.0_x64_en-US.msi` (Windows Installer)
   - `Venom PDF_0.1.0_x64-setup.exe` (Windows Standalone Setup)
   - `Venom PDF_0.1.0_amd64.AppImage` (Universal Linux)
   - `Venom PDF_0.1.0_amd64.deb` (Debian/Ubuntu)
   - `Venom PDF_0.1.0_x64.dmg` (macOS)

---

## ⚙️ GitHub Repository Permissions Setup

For GitHub Actions to publish releases automatically, ensure workflow write permissions are enabled:

1. In your GitHub repository, click **Settings** &rarr; **Actions** &rarr; **General**.
2. Scroll down to **"Workflow permissions"**.
3. Select **"Read and write permissions"**.
4. Check **"Allow GitHub Actions to create and approve pull requests"**.
5. Click **Save**.

*(Note: The workflow file `.github/workflows/release.yml` already includes `permissions: { contents: write }`, so this standard GitHub setting enables seamless publishing).*

---

## 💻 Manual Trigger via GitHub UI

If you want to trigger a build without pushing a tag:
1. Go to **Actions** &rarr; select **"Release Multi-Platform Binaries"** from the left sidebar.
2. Click the **"Run workflow"** dropdown button on the right.
3. Select branch `main` and click **"Run workflow"**.

---

## 🛠️ Local Native Windows Compilation (Optional)

If you wish to compile native Windows `.exe` and `.msi` installers locally on your development machine in the future:
1. Download and run the **Visual Studio Build Tools** installer from Microsoft:  
   [https://visualstudio.microsoft.com/visual-cpp-build-tools/](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
2. In the installer, check **"Desktop development with C++"** (which installs MSVC `link.exe`, the C++ compiler, and the Windows SDK).
3. Once installed, run:
   ```bash
   pnpm tauri build
   ```
   Tauri will place the generated `.msi` and `.exe` into `src-tauri/target/release/bundle/`.
