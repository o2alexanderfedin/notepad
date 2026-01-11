# Specification: Dual-Platform Notepad with Automatic Syntax Highlighting

## Overview

This task involves building a text editor application that runs both as a browser-based web app and as an Electron desktop application. The notepad will feature automatic syntax highlighting for various programming languages and file formats, with detection based on file extensions and content analysis. The application will leverage the File System Access API in browsers and Electron's native file system capabilities, requiring a unified abstraction layer to maintain code consistency across both platforms.

## Workflow Type

**Type**: feature

**Rationale**: This is a new feature implementation building a complete application from scratch. It requires designing architecture, implementing core functionality, and ensuring dual-platform compatibility without modifying existing code.

## Task Scope

### Services Involved
- **notepad-app** (primary) - The main application containing shared UI, editor logic, and platform-specific file system handlers

### This Task Will:
- [ ] Create a text editor interface with syntax highlighting capabilities
- [ ] Implement File System Access API integration for browser-based file operations (open, save)
- [ ] Build Electron wrapper with IPC bridge for native file system access
- [ ] Develop automatic language detection for syntax highlighting
- [ ] Create file system abstraction layer to unify browser and Electron APIs
- [ ] Support multiple programming languages and file formats with Highlight.js
- [ ] Implement secure IPC communication in Electron using contextBridge

### Out of Scope:
- Multi-file tabs or session management
- Advanced code editor features (autocomplete, linting, debugging)
- Cloud storage integration
- Real-time collaboration
- Mobile platform support (iOS/Android)
- Plugin/extension system
- Git integration

## Service Context

### Notepad Application (New)

**Tech Stack:**
- Language: JavaScript/TypeScript
- Framework: Vanilla JS / Electron (main + renderer processes)
- Key directories:
  - `/src` - Shared application code
  - `/src/browser` - Browser-specific implementations
  - `/src/electron` - Electron main process, preload, and renderers
  - `/public` - Static assets (HTML, CSS)

**Entry Point:**
- Browser: `src/browser/index.html`
- Electron: `src/electron/main.js`

**How to Run:**
```bash
# Browser version (development)
npm run dev:browser

# Electron version
npm run dev:electron

# Build for production
npm run build:browser
npm run build:electron
```

**Port:**
- Browser dev server: 3000 (or Vite default)

## Files to Modify

| File | Service | What to Change |
|------|---------|----------------|
| *New project - no existing files* | notepad-app | All files will be created from scratch |

## Files to Create

| File | Purpose |
|------|---------|
| `package.json` | Project dependencies (electron, highlight.js, vite) |
| `src/shared/editor.js` | Core editor logic and syntax highlighting |
| `src/shared/file-system-abstraction.js` | Unified file system API interface |
| `src/browser/file-system-handler.js` | File System Access API implementation |
| `src/browser/index.html` | Browser UI entry point |
| `src/browser/app.js` | Browser application initialization |
| `src/electron/main.js` | Electron main process |
| `src/electron/preload.js` | Secure IPC bridge via contextBridge |
| `src/electron/file-system-handler.js` | Node.js fs + dialog implementation |
| `src/electron/renderer.js` | Electron renderer process logic |
| `src/electron/index.html` | Electron UI (can be shared with browser) |
| `public/styles.css` | Application styling + Highlight.js theme |

## Files to Reference

*No existing files - greenfield project. Patterns below derived from research phase findings.*

## Patterns to Follow

### Pattern 1: Highlight.js Automatic Detection

**Key Implementation:**

```javascript
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css'; // or any theme

function highlightCode(code, language = null) {
  if (language) {
    return hljs.highlight(code, { language }).value;
  }
  // Automatic detection
  return hljs.highlightAuto(code).value;
}

// Apply to DOM element
const codeElement = document.querySelector('pre code');
codeElement.textContent = fileContent;
hljs.highlightElement(codeElement);
```

**Key Points:**
- Use `hljs.highlightAuto()` for automatic language detection
- For known file types, pass explicit language for better accuracy
- Apply to `<pre><code>` structure for proper formatting
- Import specific languages to reduce bundle size if needed

### Pattern 2: Electron Secure IPC Bridge

**Main Process (`main.js`):**

```javascript
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs').promises;
const path = require('path');

ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'All Files', extensions: ['*'] }]
  });

  if (result.canceled) return null;

  const filePath = result.filePaths[0];
  const content = await fs.readFile(filePath, 'utf8');
  return { path: filePath, content };
});

ipcMain.handle('save-file', async (event, { path: filePath, content }) => {
  if (!filePath) {
    const result = await dialog.showSaveDialog({});
    if (result.canceled) return null;
    filePath = result.filePath;
  }

  await fs.writeFile(filePath, content, 'utf8');
  return filePath;
});
```

**Preload Script (`preload.js`):**

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (path, content) => ipcRenderer.invoke('save-file', { path, content })
});
```

**Renderer (`renderer.js`):**

```javascript
// Access via window.electronAPI
async function openFile() {
  const result = await window.electronAPI.openFile();
  if (result) {
    editor.setValue(result.content);
    currentFilePath = result.path;
  }
}
```

**Key Points:**
- Always use `contextBridge.exposeInMainWorld()` - never expose ipcRenderer directly
- Enable `contextIsolation: true` in BrowserWindow webPreferences
- Use `ipcMain.handle()` + `ipcRenderer.invoke()` for async request/response
- File operations must happen in main process (security boundary)

### Pattern 3: File System Access API (Browser)

```javascript
async function openFileInBrowser() {
  try {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [{
        description: 'Text Files',
        accept: { 'text/*': ['.txt', '.js', '.py', '.md'] }
      }],
      multiple: false
    });

    const file = await fileHandle.getFile();
    const content = await file.text();

    return { handle: fileHandle, content, name: file.name };
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('User cancelled file picker');
    }
    return null;
  }
}

async function saveFileInBrowser(fileHandle, content) {
  let handle = fileHandle;

  if (!handle) {
    // Save as new file
    handle = await window.showSaveFilePicker({
      suggestedName: 'untitled.txt',
      types: [{
        description: 'Text Files',
        accept: { 'text/plain': ['.txt'] }
      }]
    });
  }

  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();

  return handle;
}
```

**Key Points:**
- Must be triggered by user gesture (button click)
- Only works in Chromium browsers (Chrome 86+, Edge 86+)
- Requires HTTPS in production (localhost OK for development)
- Handles can be stored in IndexedDB for re-access
- Provide fallback UI for unsupported browsers

### Pattern 4: File System Abstraction Layer

```javascript
// file-system-abstraction.js
class FileSystemAdapter {
  async openFile() {
    throw new Error('Must implement openFile()');
  }

  async saveFile(handle, content) {
    throw new Error('Must implement saveFile()');
  }
}

// Browser implementation
class BrowserFileSystem extends FileSystemAdapter {
  async openFile() {
    const [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    return {
      handle: fileHandle,
      content: await file.text(),
      name: file.name
    };
  }

  async saveFile(handle, content) {
    // Implementation using FileSystemHandle API
  }
}

// Electron implementation
class ElectronFileSystem extends FileSystemAdapter {
  async openFile() {
    return await window.electronAPI.openFile();
  }

  async saveFile(path, content) {
    return await window.electronAPI.saveFile(path, content);
  }
}

// Factory
export function createFileSystem() {
  if (window.electronAPI) {
    return new ElectronFileSystem();
  }
  return new BrowserFileSystem();
}
```

**Key Points:**
- Single interface for both platforms
- Runtime detection of environment
- Consistent return types across implementations
- Enables shared editor logic

## Requirements

### Functional Requirements

1. **File Opening**
   - Description: User can open text files from their local file system
   - Acceptance:
     - Browser: File picker dialog appears on button click (Chromium only)
     - Electron: Native OS file dialog appears
     - Selected file content loads into editor

2. **File Saving**
   - Description: User can save edited content back to file or as new file
   - Acceptance:
     - Browser: Save picker allows choosing location (or uses existing FileHandle)
     - Electron: Native save dialog or overwrites current file
     - File content persists correctly on disk

3. **Automatic Syntax Highlighting**
   - Description: Code is automatically highlighted based on language detection
   - Acceptance:
     - JavaScript, Python, HTML, CSS, Markdown are detected and highlighted
     - Highlighting updates as user types (with debouncing)
     - At least 10 common languages supported
     - Fallback to plain text if language unknown

4. **Dual Platform Support**
   - Description: Application works identically in browser and Electron
   - Acceptance:
     - Same UI and behavior in both environments
     - File operations work correctly in both
     - No platform-specific bugs or crashes

### Edge Cases

1. **Unsupported Browser** - Display error message for non-Chromium browsers, suggest Electron version or download
2. **Large Files** - Files over 1MB should show loading indicator, consider streaming for files over 10MB
3. **Permission Denied** - Handle file system permission errors gracefully with user-friendly messages
4. **Corrupted Files** - Catch encoding errors and display readable error message
5. **User Cancels Picker** - Detect AbortError and handle silently (don't show error)
6. **Unsaved Changes** - Warn user before closing if content modified (future enhancement, not required for MVP)

## Implementation Notes

### DO
- Use Highlight.js for syntax highlighting (auto-detection via `hljs.highlightAuto()`)
- Implement Electron with `contextIsolation: true` and secure IPC via contextBridge
- Create file system abstraction layer for code reuse
- Use async/await for all file operations
- Test in both Chrome (browser mode) and Electron before committing
- Import only needed Highlight.js languages to reduce bundle size
- Use debouncing for live syntax highlighting (e.g., 300ms delay)
- Provide visual feedback during file operations (loading states)

### DON'T
- Don't expose ipcRenderer directly to renderer process
- Don't use synchronous file operations (fs.readFileSync) in Electron main process
- Don't implement custom language detection - use Highlight.js built-in
- Don't support Firefox/Safari File System Access API (not available) - show fallback message
- Don't use `--no-verify` or force flags with git commands
- Don't implement complex features before core functionality works

## Development Environment

### Initial Setup

```bash
# Initialize project
npm init -y

# Install runtime dependencies
npm install highlight.js

# Install dev dependencies
npm install -D electron vite electron-builder

# Create directory structure
mkdir -p src/{shared,browser,electron} public
```

### Start Services

```bash
# Browser development (with Vite)
npm run dev:browser

# Electron development
npm run dev:electron
```

### Service URLs
- Browser app: http://localhost:5173 (Vite default)
- Electron: Native desktop window

### Required Environment Variables
*None required for MVP*

### Package.json Scripts

```json
{
  "scripts": {
    "dev:browser": "vite",
    "dev:electron": "electron .",
    "build:browser": "vite build",
    "build:electron": "electron-builder"
  },
  "main": "src/electron/main.js"
}
```

## Success Criteria

The task is complete when:

1. [ ] User can open a text file in both browser (Chrome/Edge) and Electron
2. [ ] User can edit file content in a text area/editor component
3. [ ] User can save changes back to file system in both platforms
4. [ ] Syntax highlighting automatically applies for JavaScript, Python, HTML, CSS, Markdown
5. [ ] Language detection works without manual selection
6. [ ] Electron app launches successfully with no console errors
7. [ ] Browser app shows appropriate fallback message in Firefox/Safari
8. [ ] File operations handle errors gracefully (permissions, cancellation, invalid files)
9. [ ] No security warnings in Electron (contextIsolation enabled, no direct ipcRenderer exposure)
10. [ ] Application UI is functional and responsive
11. [ ] Code follows abstraction pattern for file system operations
12. [ ] Both platforms use shared editor logic (no duplication)

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests

| Test | File | What to Verify |
|------|------|----------------|
| File System Abstraction | `tests/file-system-abstraction.test.js` | Factory returns correct adapter based on environment |
| Syntax Highlighting | `tests/editor.test.js` | Highlight.js applies correctly to code blocks |
| Language Detection | `tests/editor.test.js` | Auto-detection identifies common languages correctly |

### Integration Tests

| Test | Services | What to Verify |
|------|----------|----------------|
| Browser File Open | Browser | FileSystemHandle API returns file content |
| Browser File Save | Browser | Content persists to FileSystemHandle |
| Electron IPC Bridge | Electron | Main ↔ Renderer communication via contextBridge |
| Electron File Operations | Electron | Native dialogs open/save files correctly |

### End-to-End Tests

| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| Open and Edit Flow | 1. Click "Open File" 2. Select test.js 3. Edit content 4. Click "Save" | File content updates on disk |
| Syntax Highlighting Flow | 1. Open Python file 2. Observe highlighting 3. Edit code | Python syntax highlighted correctly, updates on change |
| New File Flow | 1. Type content 2. Click "Save As" 3. Choose location | New file created with correct content |

### Browser Verification (Browser Mode)

| Page/Component | URL | Checks |
|----------------|-----|--------|
| Editor UI | `http://localhost:5173` | ✓ Text area/editor visible<br>✓ "Open File" button functional<br>✓ "Save File" button functional<br>✓ Syntax highlighting visible |
| File Picker | Click "Open" | ✓ Browser file picker appears (Chrome/Edge only)<br>✓ File loads after selection |
| Unsupported Browser | Open in Firefox | ✓ Error message displayed<br>✓ Suggestion to use Chrome/Electron |

### Electron Verification

| Check | Action | Expected |
|-------|--------|----------|
| App Launch | `npm run dev:electron` | ✓ Window opens<br>✓ No console errors<br>✓ UI matches browser version |
| Native Dialogs | Click "Open File" | ✓ OS-native file picker appears (not web picker) |
| IPC Security | Inspect renderer process | ✓ `window.electronAPI` exists<br>✓ `window.require` undefined<br>✓ `window.ipcRenderer` undefined |
| File Operations | Open, edit, save file | ✓ File reads/writes correctly<br>✓ No permission errors |

### Code Quality Verification

| Check | Command | Expected |
|-------|---------|----------|
| No Security Warnings | Launch Electron app | ✓ No "contextIsolation" warnings in console |
| Highlight.js Integration | Inspect DOM | ✓ `<pre><code class="hljs">` elements present<br>✓ Language-specific classes applied |
| File System Abstraction | Code review | ✓ No duplicate file logic between browser/Electron<br>✓ Single interface used by editor |

### QA Sign-off Requirements

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Browser verification complete (Chrome/Edge - file operations work, Firefox - shows fallback)
- [ ] Electron verification complete (app launches, native dialogs work, IPC secure)
- [ ] No regressions in existing functionality (N/A - greenfield project)
- [ ] Code follows abstraction pattern (file system adapter implemented)
- [ ] No security vulnerabilities (Electron contextIsolation enabled, IPC properly bridged)
- [ ] Syntax highlighting works for at least 10 common languages
- [ ] Error handling tested (cancelled pickers, invalid files, permissions)
- [ ] Performance acceptable (files up to 1MB load in <2 seconds)
