# Specification: macOS Installation Package Creation

## Overview

This task involves creating a production-ready macOS installation package for the Notepad Electron application. The application is a TypeScript/React-based Electron app built with Vite. We will configure electron-builder to generate distributable .dmg and .pkg installers, including proper code signing and notarization for macOS Gatekeeper compliance.

## Workflow Type

**Type**: feature

**Rationale**: This is a new capability being added to the project - the ability to distribute the Electron application as a native macOS installer. It involves creating new configuration files, build scripts, and packaging infrastructure that doesn't currently exist.

## Task Scope

### Services Involved
- **main** (primary) - The Electron application that will be packaged for distribution

### This Task Will:
- [x] Create electron-builder configuration for macOS packaging
- [x] Configure DMG and PKG installer targets
- [x] Set up code signing configuration (using environment variables)
- [x] Configure notarization settings for macOS Gatekeeper
- [x] Create entitlements file for hardened runtime
- [x] Add npm scripts for building macOS installers
- [x] Document the build process and requirements

### Out of Scope:
- Obtaining Apple Developer certificates (developer must provide)
- Creating .icns icon file (will document how to create)
- Windows or Linux packaging
- Auto-update functionality
- Mac App Store submission

## Service Context

### main

**Tech Stack:**
- Language: TypeScript
- Framework: React
- Build Tool: Vite
- State Management: Redux
- Package Manager: npm
- Runtime: Electron v28.0.0

**Key directories:**
- `src/` - Source code

**Dependencies:**
- electron-builder v24.9.0 (already installed)
- electron v28.0.0 (already installed)
- React, Redux, highlight.js

**How to Run:**
```bash
npm install
npm run dev
```

**Port:** 3000 (development server)

## Files to Modify

| File | Service | What to Change |
|------|---------|---------------|
| `package.json` | main | Add build scripts and electron-builder configuration section |
| `.gitignore` | main | Add dist/ and build artifact patterns |

## Files to Create

| File | Purpose |
|------|---------|
| `electron-builder.yml` | Main packaging configuration (alternative to package.json config) |
| `build/entitlements.mac.plist` | macOS entitlements for hardened runtime |
| `build/icon.icns` | macOS application icon (converted from existing icon) |
| `.env.example` | Template for code signing environment variables |
| `docs/BUILDING.md` | Documentation for building and distributing the app |

## Patterns to Follow

### electron-builder Configuration Pattern

Standard electron-builder configuration structure:

```yaml
# electron-builder.yml
appId: com.company.notepad
productName: Notepad
directories:
  buildResources: build
  output: dist

mac:
  category: public.app-category.productivity
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
  icon: build/icon.icns
  target:
    - target: dmg
      arch: [x64, arm64]
    - target: pkg
      arch: [x64, arm64]

dmg:
  title: "${productName} ${version}"
  icon: build/icon.icns
  window:
    width: 540
    height: 380

pkg:
  installLocation: /Applications
```

**Key Points:**
- `hardenedRuntime: true` is required for notarization
- Universal binary via `arch: [x64, arm64]`
- Environment variables for signing (not hardcoded)

### Entitlements File Pattern

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.disable-library-validation</key>
  <true/>
</dict>
</plist>
```

**Key Points:**
- Required for Electron apps with V8 JavaScript engine
- Allows JIT compilation and dynamic code execution

## Requirements

### Functional Requirements

1. **DMG Installer Creation**
   - Description: Generate a drag-and-drop .dmg installer for macOS
   - Acceptance: Running `npm run build:mac` creates a .dmg file in dist/ that can be opened and contains a draggable app icon

2. **PKG Installer Creation**
   - Description: Generate a standard .pkg installer for automated deployment
   - Acceptance: Running `npm run build:mac` creates a .pkg file that installs the app to /Applications

3. **Universal Binary Support**
   - Description: Support both Intel (x64) and Apple Silicon (arm64) architectures
   - Acceptance: Built installers work on both Intel and M1/M2/M3 Macs without Rosetta

4. **Code Signing Configuration**
   - Description: Set up code signing for macOS Gatekeeper compliance
   - Acceptance: When environment variables are provided, app is properly signed with Developer ID

5. **Notarization Configuration**
   - Description: Configure automatic notarization for macOS 10.15+
   - Acceptance: When credentials are provided, app is notarized and stapled automatically

### Edge Cases

1. **Missing Code Signing Credentials** - Build should complete but warn that app won't run on other machines without disabling Gatekeeper
2. **Missing Icon File** - electron-builder should use default Electron icon as fallback
3. **Build on Non-macOS** - Document that macOS builds require macOS or Docker/CI (GitHub Actions)

## Implementation Notes

### DO
- Use `electron-builder.yml` for cleaner separation of build config
- Keep code signing credentials in environment variables (never commit)
- Create universal binaries (`arch: [x64, arm64]`) for broader compatibility
- Set `gatekeeperAssess: false` to avoid local assessment issues
- Add comprehensive build documentation for future developers

### DON'T
- Hardcode Apple Developer credentials in config files
- Use deep signing (`--deep`) for the entire app (security risk)
- Commit the `dist/` directory or build artifacts
- Use `.png` or `.ico` for macOS icon (must be `.icns`)
- Sign for Mac App Store (MAS) unless specifically targeting App Store

## Development Environment

### Required Tools
- Node.js and npm (already in use)
- macOS (for building macOS installers locally)
- Apple Developer Account (for code signing and notarization)

### Build Commands

```bash
# Install dependencies (if not already done)
npm install

# Build macOS installers (DMG and PKG)
npm run build:mac

# Build without code signing (for testing)
npm run build:mac -- --publish never
```

### Required Environment Variables

For code signing and notarization (optional for local testing, required for distribution):

```bash
# Code Signing
CSC_LINK=path/to/certificate.p12         # Path to Developer ID certificate
CSC_KEY_PASSWORD=certificate_password     # Certificate password

# Notarization
APPLE_ID=your@apple-id.email             # Apple ID email
APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx    # App-specific password (not regular password)
APPLE_TEAM_ID=XXXXXXXXXX                 # 10-character Team ID
```

### Icon Preparation

Convert existing icon to .icns format:

```bash
# Using iconutil (macOS built-in)
mkdir icon.iconset
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset -o build/icon.icns
```

## Success Criteria

The task is complete when:

1. [x] `electron-builder.yml` configuration file exists and is valid
2. [x] `build/entitlements.mac.plist` exists with proper entitlements
3. [x] `npm run build:mac` successfully creates DMG and PKG installers in `dist/`
4. [x] Build documentation exists explaining the process
5. [x] `.env.example` provides template for code signing variables
6. [x] `.gitignore` excludes build artifacts
7. [x] Built .dmg can be opened and app dragged to Applications folder
8. [x] Built .pkg can install app to /Applications
9. [x] No console errors during build process
10. [x] Documentation includes icon conversion instructions

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests
| Test | File | What to Verify |
|------|------|----------------|
| N/A | N/A | No unit tests for build configuration |

### Integration Tests
| Test | Services | What to Verify |
|------|----------|----------------|
| Build Process Test | main | Run `npm run build:mac` completes without errors |
| Config Validation | main | electron-builder validates configuration file |

### End-to-End Tests
| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| DMG Installation | 1. Build DMG 2. Open .dmg 3. Drag to Applications | App appears in /Applications and launches |
| PKG Installation | 1. Build PKG 2. Run installer 3. Launch from Applications | App installs and launches successfully |
| Universal Binary | 1. Build installer 2. Test on Intel Mac 3. Test on M1/M2 Mac | App runs natively on both architectures |

### Build Verification
| Check | Command | Expected |
|-------|---------|----------|
| Build succeeds | `npm run build:mac` | Exit code 0, dist/ contains .dmg and .pkg |
| Config is valid | `npx electron-builder --help` | No config errors |
| Artifacts created | `ls dist/` | DMG and PKG files exist |
| Universal binary | `lipo -archs dist/mac/*.app/Contents/MacOS/Notepad` | Shows "x86_64 arm64" |

### Manual Testing (macOS)
| Test | Steps | Expected Outcome |
|------|------|------------------|
| DMG opens | Double-click .dmg file | Disk image mounts with app icon and Applications shortcut |
| App drags to Applications | Drag icon to Applications | Copy completes successfully |
| App launches from Applications | Open from Applications folder | App launches without Gatekeeper warnings (if signed) |
| PKG installs | Double-click .pkg file | Installer launches and completes |
| Uninstaller works | Delete from Applications | App removed cleanly |

### File Verification
| File | Check | Expected |
|------|-------|----------|
| `electron-builder.yml` | Exists and valid YAML | Valid configuration |
| `build/entitlements.mac.plist` | Exists and valid XML | Valid plist format |
| `build/icon.icns` | Exists (or documented) | .icns format icon present or creation documented |
| `.env.example` | Contains signing vars | Template for CSC_*, APPLE_* variables |
| `docs/BUILDING.md` | Exists | Build instructions present |
| `.gitignore` | Contains dist/ | Build artifacts ignored |

### QA Sign-off Requirements
- [x] `npm run build:mac` completes successfully
- [x] DMG and PKG files are created in `dist/`
- [x] Configuration files are valid (YAML, XML)
- [x] Documentation is complete and accurate
- [x] `.gitignore` properly excludes build artifacts
- [x] Environment variable template exists
- [x] Manual installation test passes (DMG or PKG)
- [x] No regressions in existing development workflow
- [x] Code follows TypeScript/React project conventions
- [x] No sensitive credentials committed to repository

### Known Limitations
- Code signing and notarization require Apple Developer account ($99/year)
- Building on non-macOS requires Docker or CI/CD (GitHub Actions)
- Icon conversion requires macOS tooling or external service
- First-time notarization can take 5-15 minutes
