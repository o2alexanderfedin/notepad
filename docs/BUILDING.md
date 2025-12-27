# Building Notepad for macOS

This guide covers building the Notepad Electron application for macOS distribution, including creating DMG and PKG installers with code signing and notarization.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [Icon Preparation](#icon-preparation)
- [Build Commands](#build-commands)
- [Code Signing](#code-signing)
- [Notarization](#notarization)
- [Universal Binaries](#universal-binaries)
- [Build Outputs](#build-outputs)
- [Troubleshooting](#troubleshooting)
- [CI/CD Integration](#cicd-integration)

---

## Prerequisites

### Required

- **Node.js** v18.0.0 or higher
- **npm** v8.0.0 or higher
- **macOS** for building macOS installers (Monterey 12.0+ recommended)
- **Xcode Command Line Tools**: Install with `xcode-select --install`

### For Distribution (Code Signing & Notarization)

- **Apple Developer Account** ($99/year) - [developer.apple.com](https://developer.apple.com)
- **Developer ID Application Certificate** - For signing the app
- **App-Specific Password** - For notarization

## Quick Start

For **local development testing** (unsigned build):

```bash
# Install dependencies
npm install

# Build macOS installers (DMG and PKG)
CSC_IDENTITY_AUTO_DISCOVERY=false npm run build:mac
```

For **production distribution** (signed and notarized):

```bash
# 1. Set up environment variables (see Environment Setup below)
# 2. Build with signing and notarization
npm run build:mac
```

## Environment Setup

### Creating Your Environment File

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Fill in your credentials (see sections below for how to obtain each value)

3. **Never commit `.env` to git!** It's already in `.gitignore`.

### Environment Variables Reference

| Variable | Purpose | Required For |
|----------|---------|--------------|
| `CSC_LINK` | Path to .p12 certificate file | Code Signing |
| `CSC_KEY_PASSWORD` | Password for the certificate | Code Signing |
| `APPLE_ID` | Your Apple ID email | Notarization |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password | Notarization |
| `APPLE_TEAM_ID` | 10-character Team ID | Notarization |
| `CSC_IDENTITY_AUTO_DISCOVERY` | Set to `false` to skip signing | Unsigned Builds |

### Loading Environment Variables

Using **dotenv** (recommended):

```bash
# Install dotenv-cli globally
npm install -g dotenv-cli

# Build with .env file
dotenv npm run build:mac
```

Or manually export before building:

```bash
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your-password
export APPLE_ID=you@example.com
export APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
export APPLE_TEAM_ID=XXXXXXXXXX
npm run build:mac
```

## Icon Preparation

The build requires a macOS `.icns` icon file at `build/icon.icns`.

### Quick Icon Creation

If you have a high-resolution PNG (1024x1024 or larger):

```bash
# Create iconset directory
mkdir icon.iconset

# Generate all required sizes
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

# Convert to icns
iconutil -c icns icon.iconset -o build/icon.icns

# Cleanup
rm -rf icon.iconset
```

See `build/ICON_README.md` for detailed instructions and alternative methods.

## Build Commands

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build:mac` | Build macOS DMG and PKG installers |
| `npm run build:mac -- --publish never` | Build without publishing |

### Building Without Code Signing

For local testing without an Apple Developer account:

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run build:mac -- --publish never
```

**Note:** Unsigned apps will show a Gatekeeper warning and require users to right-click > Open, or disable Gatekeeper.

### Building for a Specific Architecture

```bash
# Intel only
npm run build:mac -- --mac --x64

# Apple Silicon only
npm run build:mac -- --mac --arm64

# Universal (both architectures)
npm run build:mac -- --mac --universal
```

## Code Signing

Code signing is required for distributing your app without Gatekeeper warnings.

### Obtaining a Developer ID Certificate

1. Log in to [Apple Developer](https://developer.apple.com/account)
2. Go to **Certificates, Identifiers & Profiles**
3. Create a new **Developer ID Application** certificate
4. Download and install the certificate in Keychain Access
5. Export as a `.p12` file with a password

### Configuring Code Signing

Set these environment variables:

```bash
# Path to your exported .p12 certificate
CSC_LINK=/path/to/Developer_ID_Application.p12

# Password used when exporting the certificate
CSC_KEY_PASSWORD=your-certificate-password
```

### Verifying Code Signature

After building, verify the signature:

```bash
# Check signature
codesign -dv --verbose=4 dist/mac/Notepad.app

# Verify signature is valid
codesign --verify --deep --strict dist/mac/Notepad.app

# Check for hardened runtime
codesign --display --entitlements :- dist/mac/Notepad.app
```

## Notarization

Notarization is required for macOS 10.15+ (Catalina and later) to run without Gatekeeper warnings.

### Setting Up Notarization

1. **Create an App-Specific Password:**
   - Go to [appleid.apple.com](https://appleid.apple.com)
   - Navigate to **Security** > **App-Specific Passwords**
   - Generate a new password for "Notepad Build"

2. **Find Your Team ID:**
   - Go to [developer.apple.com/account](https://developer.apple.com/account)
   - Click **Membership** in the sidebar
   - Your **Team ID** is a 10-character alphanumeric string

3. **Set Environment Variables:**

   ```bash
   APPLE_ID=your.apple.id@example.com
   APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
   APPLE_TEAM_ID=XXXXXXXXXX
   ```

### Notarization Timeline

- First-time notarization: 5-15 minutes
- Subsequent builds: Usually 2-5 minutes
- The build process waits for notarization to complete automatically

### Verifying Notarization

```bash
# Check if app is notarized
spctl --assess --type execute --verbose dist/mac/Notepad.app

# Check notarization status
xcrun stapler validate dist/Notepad-*.dmg
```

## Universal Binaries

The default configuration builds **universal binaries** that run natively on both Intel (x64) and Apple Silicon (arm64) Macs.

### How It Works

- electron-builder builds separate binaries for each architecture
- Both are combined into a single universal binary
- macOS automatically loads the correct architecture

### Verifying Universal Binary

```bash
# Check supported architectures
lipo -archs "dist/mac/Notepad.app/Contents/MacOS/Notepad"
# Should output: x86_64 arm64

# More detailed info
file "dist/mac/Notepad.app/Contents/MacOS/Notepad"
```

## Build Outputs

After a successful build, find your installers in the `dist/` directory:

```
dist/
├── mac/                           # Unpackaged .app
│   └── Notepad.app
├── Notepad-{version}.dmg          # DMG installer (drag-and-drop)
├── Notepad-{version}.pkg          # PKG installer (double-click to install)
├── Notepad-{version}-arm64.dmg    # Apple Silicon DMG
├── Notepad-{version}-arm64.pkg    # Apple Silicon PKG
├── Notepad-{version}-x64.dmg      # Intel DMG
├── Notepad-{version}-x64.pkg      # Intel PKG
└── builder-effective-config.yaml  # Resolved configuration
```

### DMG vs PKG

| Format | Best For | Installation |
|--------|----------|--------------|
| DMG | End users, manual installation | Drag to Applications |
| PKG | IT deployment, automated installation | Double-click or `installer -pkg` |

## Troubleshooting

### Common Issues

#### "No sigining identity found"

**Cause:** Certificate not in Keychain or `CSC_LINK` not set.

**Fix:**
```bash
# For unsigned builds
CSC_IDENTITY_AUTO_DISCOVERY=false npm run build:mac
```

#### "The application cannot be opened" (Gatekeeper)

**Cause:** App is not signed or notarized.

**Fix for users:**
```bash
# Remove quarantine attribute
xattr -dr com.apple.quarantine /Applications/Notepad.app
```

**Fix for developers:** Enable code signing and notarization.

#### "Icon not found" warning

**Cause:** `build/icon.icns` doesn't exist.

**Fix:** Create the icon file following the [Icon Preparation](#icon-preparation) section.

#### Build hangs during notarization

**Cause:** Apple's notarization service can be slow.

**Fix:** Wait up to 15 minutes. If it times out, check Apple's [System Status](https://developer.apple.com/system-status/).

#### "The specified item could not be found in the keychain"

**Cause:** Certificate password is incorrect.

**Fix:** Verify `CSC_KEY_PASSWORD` matches the password used when exporting the .p12 file.

### Debug Mode

For detailed build logs:

```bash
DEBUG=electron-builder npm run build:mac
```

### Cleaning Build Artifacts

```bash
# Remove dist folder
rm -rf dist/

# Clean npm cache (if dependencies seem corrupted)
npm cache clean --force
rm -rf node_modules
npm install
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build macOS

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: macos-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build macOS app
        env:
          CSC_LINK: ${{ secrets.CSC_LINK }}
          CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        run: npm run build:mac

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: macos-installers
          path: |
            dist/*.dmg
            dist/*.pkg
```

### GitHub Secrets Setup

Store these secrets in your repository settings:

| Secret | Value |
|--------|-------|
| `CSC_LINK` | Base64-encoded .p12 file: `base64 -i cert.p12 \| pbcopy` |
| `CSC_KEY_PASSWORD` | Certificate password |
| `APPLE_ID` | Your Apple ID email |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password |
| `APPLE_TEAM_ID` | Your 10-character Team ID |

---

## Additional Resources

- [electron-builder Documentation](https://www.electron.build/)
- [Apple Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [Notarizing macOS Software](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Hardened Runtime](https://developer.apple.com/documentation/security/hardened_runtime)

---

## Configuration Reference

The build configuration is in `electron-builder.yml`. Key settings:

```yaml
# Application identity
appId: com.notepad.app
productName: Notepad

# macOS settings
mac:
  category: public.app-category.productivity
  hardenedRuntime: true  # Required for notarization
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  target:
    - target: dmg
      arch: [x64, arm64]
    - target: pkg
      arch: [x64, arm64]
```

See the full configuration in `electron-builder.yml`.
