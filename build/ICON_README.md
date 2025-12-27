# macOS Application Icon

This directory should contain `icon.icns` - the macOS application icon for Notepad.

## Current Status

**Icon not yet created.** The build will use Electron's default icon until a custom icon is provided.

## Creating the Icon

### Requirements

- **Source image:** A high-resolution PNG file (at least 1024x1024 pixels, ideally 2048x2048)
- **macOS:** The `iconutil` and `sips` commands are built-in to macOS
- **Image should be:** Square, with transparent background, clear at small sizes

### Step-by-Step Instructions

1. **Prepare your source icon**

   Save your icon as `icon.png` in the project root (at least 1024x1024 pixels).

2. **Create the iconset directory**

   ```bash
   mkdir icon.iconset
   ```

3. **Generate all required sizes**

   macOS icons require multiple resolutions for different contexts (Dock, Finder, etc.):

   ```bash
   # Standard resolution icons
   sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
   sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
   sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
   sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
   sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png

   # Retina (@2x) resolution icons
   sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
   sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
   sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
   sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
   sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
   ```

4. **Convert to .icns format**

   ```bash
   iconutil -c icns icon.iconset -o build/icon.icns
   ```

5. **Clean up temporary files**

   ```bash
   rm -rf icon.iconset
   ```

### One-Liner Script

For convenience, here's a complete script (run from project root):

```bash
#!/bin/bash
# Create macOS .icns from icon.png

# Check source exists
if [ ! -f "icon.png" ]; then
    echo "Error: icon.png not found in project root"
    exit 1
fi

# Create iconset directory
mkdir -p icon.iconset

# Generate all sizes
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

echo "Created build/icon.icns"
```

## Alternative Methods

### Using ImageMagick (if installed)

```bash
# Install ImageMagick if needed: brew install imagemagick
convert icon.png -resize 1024x1024 -define icon:auto-resize=1024,512,256,128,64,32,16 build/icon.icns
```

### Online Converters

- [CloudConvert](https://cloudconvert.com/png-to-icns) - Upload PNG, download ICNS
- [iConvert Icons](https://iconverticons.com/online/) - Free online converter

### Using Asset Catalog (Xcode)

If you have Xcode installed:
1. Create a new Asset Catalog
2. Add an AppIcon set
3. Drag your icon to all the size slots
4. Export as .icns

## Icon Requirements

| Size (px) | Filename | Purpose |
|-----------|----------|---------|
| 16x16 | icon_16x16.png | Menu bar, Spotlight |
| 16x16@2x (32x32) | icon_16x16@2x.png | Menu bar (Retina) |
| 32x32 | icon_32x32.png | Finder list view |
| 32x32@2x (64x64) | icon_32x32@2x.png | Finder list view (Retina) |
| 128x128 | icon_128x128.png | Finder icon view |
| 128x128@2x (256x256) | icon_128x128@2x.png | Finder icon view (Retina) |
| 256x256 | icon_256x256.png | Finder preview |
| 256x256@2x (512x512) | icon_256x256@2x.png | Finder preview (Retina) |
| 512x512 | icon_512x512.png | App Store, About |
| 512x512@2x (1024x1024) | icon_512x512@2x.png | App Store (Retina) |

## Verification

After creating the icon, verify it works:

```bash
# Check file exists and has content
ls -la build/icon.icns

# View icon info (macOS)
file build/icon.icns

# Quick preview (macOS)
qlmanage -p build/icon.icns
```

## Fallback Behavior

If `build/icon.icns` is not present:
- **electron-builder** will use Electron's default icon
- The build will complete successfully
- Users will see the generic Electron icon on the app

Once you add `icon.icns` to this directory, rebuild the app to use it.
