# Specification: Convert Codebase to TypeScript and React + Redux

## Overview

This specification outlines the migration of the existing vanilla JavaScript notepad application to TypeScript with React for UI components and Redux Toolkit for state management. The application currently uses vanilla DOM manipulation and global state objects. The migration will introduce type safety, component-based architecture, and centralized state management while maintaining the dual-platform support (Browser + Electron) and all existing functionality including syntax highlighting via highlight.js.

## Workflow Type

**Type**: migration

**Rationale**: This is a comprehensive framework migration task that involves converting from vanilla JavaScript to TypeScript + React + Redux while maintaining existing functionality. It requires systematic refactoring of the entire codebase architecture, build configuration updates, and dependency migrations.

## Task Scope

### Services Involved
- **main** (primary) - Single-service notepad application requiring full migration

### This Task Will:
- [ ] Set up TypeScript configuration for browser and Electron environments
- [ ] Install and configure React 18+ and React DOM dependencies
- [ ] Install and configure Redux Toolkit and React-Redux for state management
- [ ] Configure Vite with React plugin for JSX transformation
- [ ] Convert all JavaScript modules to TypeScript (.ts/.tsx)
- [ ] Convert vanilla DOM manipulation to React functional components
- [ ] Migrate application state to Redux store with typed slices
- [ ] Create typed Redux hooks (useAppDispatch, useAppSelector)
- [ ] Update Electron main and preload scripts for TypeScript compatibility
- [ ] Ensure highlight.js integration works with React components
- [ ] Maintain dual-platform support (Browser + Electron)
- [ ] Preserve all existing features (file operations, syntax highlighting, keyboard shortcuts)

### Out of Scope:
- Changing application functionality or adding new features
- Modifying the Electron packaging configuration (electron-builder.yml)
- Changing the UI/UX design or layout
- Replacing highlight.js with a different syntax highlighting library
- Adding unit or integration tests (testing infrastructure can be added in future tasks)

## Service Context

### main

**Tech Stack (Current):**
- Language: JavaScript (ES Modules)
- Framework: None (vanilla DOM manipulation)
- State Management: Plain JavaScript objects
- Build Tool: Vite 5.0
- Runtime: Browser + Electron 28.0
- Key Library: highlight.js 11.9.0

**Tech Stack (Target):**
- Language: TypeScript 5.0+
- Framework: React 18+
- State Management: Redux Toolkit 2.0+ with React-Redux 8.0+
- Build Tool: Vite 5.0 with @vitejs/plugin-react
- Runtime: Browser + Electron 28.0
- Key Library: highlight.js 11.9.0

**Key Directories:**
- `src/browser/` - Browser-specific entry point and file system handler
- `src/electron/` - Electron main process, preload, and renderer
- `src/shared/` - Shared editor logic and file system abstraction
- `public/` - Static assets (styles.css)

**Entry Points:**
- Browser: `src/browser/index.html` → `src/browser/app.js`
- Electron Renderer: `src/electron/index.html` → `src/electron/renderer.js`
- Electron Main: `src/electron/main.js`

**How to Run:**
```bash
# Browser development
npm run dev:browser

# Electron desktop app
npm run dev:electron
```

**Port:** 5173 (browser development server)

## Files to Modify

| File | Service | What to Change |
|------|---------|---------------|
| `package.json` | main | Add TypeScript, React, Redux dependencies; update scripts to handle .ts/.tsx |
| `vite.config.js` | main | Rename to `vite.config.ts`; add @vitejs/plugin-react; configure JSX transform |
| `tsconfig.json` | main | Create base TypeScript configuration with React JSX support |
| `tsconfig.app.json` | main | Create app-specific config extending base (for src/ code) |
| `tsconfig.node.json` | main | Create Node-specific config (for Vite config and Electron main) |
| `src/browser/index.html` | main | Update to use React root and reference .tsx entry point |
| `src/browser/app.js` | main | Convert to `App.tsx` React component with hooks |
| `src/browser/file-system-handler.js` | main | Convert to TypeScript with proper typing |
| `src/electron/index.html` | main | Update to use React root and reference .tsx entry point |
| `src/electron/renderer.js` | main | Convert to `Renderer.tsx` React component |
| `src/electron/main.js` | main | Convert to TypeScript with Electron type definitions |
| `src/electron/preload.js` | main | Convert to TypeScript with proper contextBridge typing |
| `src/electron/file-system-handler.js` | main | Convert to TypeScript with proper typing |
| `src/shared/editor.js` | main | Convert to TypeScript; export typed highlight.js utilities |
| `src/shared/file-system-abstraction.js` | main | Convert to TypeScript with interface definitions |
| New: `src/store/index.ts` | main | Create Redux store configuration with typed exports |
| New: `src/store/slices/editorSlice.ts` | main | Create Redux slice for editor state (content, fileName, isModified) |
| New: `src/store/slices/uiSlice.ts` | main | Create Redux slice for UI state (loading, preview visibility, status) |
| New: `src/store/hooks.ts` | main | Create typed Redux hooks (useAppDispatch, useAppSelector) |
| New: `src/components/Editor.tsx` | main | Extract editor textarea component |
| New: `src/components/Toolbar.tsx` | main | Extract toolbar with file operation buttons |
| New: `src/components/StatusBar.tsx` | main | Extract status bar component |
| New: `src/components/PreviewPanel.tsx` | main | Extract syntax highlighting preview component |
| New: `src/types/electron.d.ts` | main | Define types for Electron IPC API exposed via preload |
| New: `src/types/highlight.d.ts` | main | Define types for highlight.js integration (if needed) |

## Files to Reference

These files show patterns to follow:

| File | Pattern to Copy |
|------|----------------|
| `src/browser/app.js` | State management structure to convert to Redux slices; event handlers to convert to React hooks |
| `src/electron/renderer.js` | Electron-specific patterns to maintain in React version |
| `src/shared/editor.js` | Pure utility functions that can be directly typed without React conversion |
| `vite.config.js` | Existing Vite configuration to preserve while adding React plugin |

## Patterns to Follow

### TypeScript Configuration Pattern

**Base tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vite/client"]
  }
}
```

**Key Points:**
- Use `"jsx": "react-jsx"` to avoid importing React in every file
- `isolatedModules: true` required for Vite
- Enable strict mode for maximum type safety
- Include "vite/client" types for import.meta.env

### Redux Store Setup Pattern

**Store Configuration (src/store/index.ts):**
```typescript
import { configureStore } from '@reduxjs/toolkit';
import editorReducer from './slices/editorSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    editor: editorReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**Typed Hooks (src/store/hooks.ts):**
```typescript
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

**Key Points:**
- Export RootState and AppDispatch types from store
- Create typed hooks to use throughout the application
- Use Redux Toolkit's `createSlice` for all state (includes Immer for immutability)

### React Component Pattern

**Functional Component with Hooks:**
```typescript
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setContent, setModified } from '../store/slices/editorSlice';

interface EditorProps {
  className?: string;
}

export function Editor({ className }: EditorProps) {
  const dispatch = useAppDispatch();
  const content = useAppSelector((state) => state.editor.content);
  const isModified = useAppSelector((state) => state.editor.isModified);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(setContent(e.target.value));
    if (!isModified) {
      dispatch(setModified(true));
    }
  };

  return (
    <textarea
      className={className}
      value={content}
      onChange={handleInput}
      placeholder="Start typing or open a file..."
    />
  );
}
```

**Key Points:**
- Use functional components with hooks (no class components)
- Explicitly type event handlers (React.ChangeEvent, React.MouseEvent, etc.)
- Use typed Redux hooks from store/hooks.ts
- Avoid React.FC for props types if not needed (explicit typing preferred)

### Electron Preload TypeScript Pattern

**Type-safe IPC Bridge (src/electron/preload.ts):**
```typescript
import { contextBridge, ipcRenderer } from 'electron/preload';

export interface ElectronAPI {
  openFile: () => Promise<{ content: string; path: string } | null>;
  saveFile: (path: string | null, content: string) => Promise<string | null>;
}

const electronAPI: ElectronAPI = {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (path, content) => ipcRenderer.invoke('dialog:saveFile', path, content),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
```

**Window Type Declaration (src/types/electron.d.ts):**
```typescript
import { ElectronAPI } from '../electron/preload';

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
```

**Key Points:**
- Define explicit interface for IPC API
- Use contextBridge for security (contextIsolation: true)
- Extend Window interface for TypeScript recognition

### Vite React Configuration Pattern

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/browser',
  publicDir: resolve(__dirname, 'public'),
  server: {
    port: 5173,
    open: true,
    strictPort: true,
  },
  build: {
    outDir: resolve(__dirname, 'dist/browser'),
    emptyOutDir: true,
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@store': resolve(__dirname, 'src/store'),
      '@components': resolve(__dirname, 'src/components'),
    },
  },
});
```

**Key Points:**
- Add `@vitejs/plugin-react` to plugins array
- Maintain existing paths and configurations
- Add path aliases for cleaner imports

### React 18 Entry Point Pattern

**Browser Entry Point (src/browser/App.tsx):**
```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '../store';
import { Editor } from '../components/Editor';
import { Toolbar } from '../components/Toolbar';
import { StatusBar } from '../components/StatusBar';
import { PreviewPanel } from '../components/PreviewPanel';

function App() {
  return (
    <div id="app">
      <Toolbar />
      <div className="main-content">
        <Editor />
        <PreviewPanel />
      </div>
      <StatusBar />
    </div>
  );
}

// React 18 initialization
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
```

**Electron Renderer Entry Point (src/electron/Renderer.tsx):**
```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '../store';
import { Editor } from '../components/Editor';
import { Toolbar } from '../components/Toolbar';
import { StatusBar } from '../components/StatusBar';
import { PreviewPanel } from '../components/PreviewPanel';

function RendererApp() {
  return (
    <div id="app">
      <Toolbar />
      <div className="main-content">
        <Editor />
        <PreviewPanel />
      </div>
      <StatusBar />
    </div>
  );
}

// React 18 initialization
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <Provider store={store}>
      <RendererApp />
    </Provider>
  </StrictMode>
);
```

**Key Points:**
- **CRITICAL**: Use `createRoot` from `react-dom/client` (React 18+ requirement)
- Do NOT use deprecated `ReactDOM.render()` from React 17
- Wrap app with Redux `Provider` at the root level
- Pass `store` to Provider to make Redux state available
- `StrictMode` wrapper helps identify potential problems in development
- Check for root element existence before initializing to avoid runtime errors

## Requirements

### Functional Requirements

1. **TypeScript Migration**
   - Description: Convert all JavaScript files to TypeScript with proper type annotations
   - Acceptance: All .js files converted to .ts/.tsx; no TypeScript errors in compilation

2. **React Component Architecture**
   - Description: Replace vanilla DOM manipulation with React functional components
   - Acceptance: Application UI renders via React; DOM elements managed by React; no direct DOM manipulation

3. **Redux State Management**
   - Description: Migrate application state to Redux Toolkit with typed slices
   - Acceptance: All state (editor content, file info, UI state) managed in Redux store; components use typed hooks

4. **Maintain Existing Functionality**
   - Description: All current features must work identically after migration
   - Acceptance: File operations (open, save, save as), syntax highlighting, keyboard shortcuts, preview toggle all function correctly

5. **Dual-Platform Support**
   - Description: Both browser and Electron versions must work
   - Acceptance: `npm run dev:browser` and `npm run dev:electron` both launch successfully; file operations work in both environments

6. **Type Safety**
   - Description: Leverage TypeScript for compile-time error detection
   - Acceptance: All event handlers, Redux actions, and component props are properly typed; strict mode enabled

### Edge Cases

1. **Electron API Availability** - Handle cases where Electron API is not available (fallback gracefully)
2. **Browser API Support** - Maintain File System Access API feature detection for browser version
3. **File Handle State** - File handles (FileSystemFileHandle in browser, file paths in Electron) should NOT be stored in Redux state as they are non-serializable. Instead, store only serializable metadata (fileName, content) in Redux. Keep file handle references in component refs (using `useRef`) or manage them through the file system abstraction layer outside Redux.
4. **Highlight.js Integration** - Ensure highlight.js works with React's virtual DOM updates (use `useEffect` to trigger highlighting when content changes)
5. **Hot Module Replacement** - Verify Vite HMR works with React Fast Refresh

## Implementation Notes

### DO
- Use functional components with hooks exclusively (no class components)
- Follow Redux Toolkit best practices (use `createSlice`, `createAsyncThunk` if needed)
- Leverage TypeScript's type inference where possible
- Use the existing `createEditorHighlightManager` pattern from editor.js
- Maintain the file system abstraction pattern for platform-agnostic code
- Keep the modular structure (browser/, electron/, shared/ directories)
- Use proper semantic HTML maintained in JSX
- Configure separate tsconfig files for app code vs. build tools
- Export type definitions for reusable interfaces

### DON'T
- Use `any` type except where absolutely necessary (e.g., some Electron APIs)
- Create class components (only functional components)
- Use Redux without Redux Toolkit (no manual action creators)
- Remove or modify the existing highlight.js language registration
- Change the file system abstraction pattern
- Modify the Electron security settings (contextIsolation, nodeIntegration)
- Mix state management approaches (all state should be in Redux or local component state)

## Development Environment

### Start Services

```bash
# Install new dependencies first
npm install react react-dom @reduxjs/toolkit react-redux
npm install --save-dev typescript @types/react @types/react-dom @types/node @vitejs/plugin-react

# Note: Electron already includes TypeScript type definitions
# Do NOT install @types/electron - it's unnecessary and may cause conflicts

# Browser development mode
npm run dev:browser

# Electron desktop mode
npm run dev:electron
```

### Service URLs
- Browser App: http://localhost:5173

### Required Environment Variables
None - application uses local file system only

### Build Configuration Files
- `tsconfig.json` - Base TypeScript configuration
- `tsconfig.app.json` - Application code configuration (src/)
- `tsconfig.node.json` - Node.js code configuration (vite.config.ts, electron main)
- `vite.config.ts` - Vite build configuration with React plugin

## Success Criteria

The task is complete when:

1. [ ] All JavaScript files converted to TypeScript (.ts or .tsx)
2. [ ] TypeScript compiles without errors in strict mode
3. [ ] Application renders using React components (no vanilla DOM manipulation)
4. [ ] All application state managed in Redux store with typed slices
5. [ ] Browser version launches and works (`npm run dev:browser`)
6. [ ] Electron version launches and works (`npm run dev:electron`)
7. [ ] File operations work (open, save, save as) in both platforms
8. [ ] Syntax highlighting works via highlight.js in React components
9. [ ] Keyboard shortcuts (Ctrl/Cmd+O, Ctrl/Cmd+S) still function
10. [ ] Preview panel toggle works
11. [ ] Cursor position tracking works
12. [ ] Modified indicator (*) displays correctly
13. [ ] No console errors in browser or Electron dev tools
14. [ ] Hot Module Replacement works with React Fast Refresh

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests
Since the original codebase has no tests, unit testing is out of scope for this migration. Tests can be added in a future task.

| Test | File | What to Verify |
|------|------|----------------|
| N/A | N/A | No existing tests to maintain |

### Integration Tests
No automated integration tests exist. Verification is manual.

| Test | Services | What to Verify |
|------|----------|----------------|
| File System Integration | Browser/Electron | Both file system handlers work with React components |
| Redux State Flow | main | Actions dispatch correctly and components re-render |
| Highlight.js Integration | main | Syntax highlighting applies to preview panel content |

### End-to-End Tests
Manual verification required for all user flows.

| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| Open File (Browser) | 1. Launch browser app 2. Click "Open File" 3. Select a .js file | File content loads into editor; syntax highlighting appears in preview |
| Open File (Electron) | 1. Launch Electron app 2. Click "Open File" 3. Select a .ts file | File content loads; filename displays in toolbar; TypeScript highlighting works |
| Save Existing File | 1. Open file 2. Modify content 3. Press Ctrl/Cmd+S | Modified indicator (*) appears; Save succeeds; indicator disappears |
| Save New File | 1. Type content 2. Press Ctrl/Cmd+Shift+S | Save dialog appears; File saves; filename updates in toolbar |
| Keyboard Shortcuts | 1. Press Ctrl/Cmd+O 2. Press Ctrl/Cmd+S | File operations trigger via keyboard |
| Toggle Preview | 1. Click "Preview" button 2. Type code 3. View preview | Preview panel appears; Syntax highlighting updates (debounced) |

### Browser Verification

| Page/Component | URL | Checks |
|----------------|-----|--------|
| Main App (Browser) | `http://localhost:5173` | ✓ App loads without errors ✓ React DevTools shows component tree ✓ File operations work ✓ No console errors |
| Main App (Electron) | Electron window | ✓ Window opens ✓ React DevTools available ✓ File system dialogs native ✓ IPC communication works |

### Database Verification
Not applicable - application does not use a database.

### TypeScript Verification

| Check | Command | Expected |
|-------|---------|----------|
| Type Check | `npx tsc --noEmit` | No type errors |
| Build (Browser) | `npm run build:browser` | Successful build; dist/browser contains compiled output |
| Build (Electron) | `npm run build:electron` | Successful build; packaged app works |

### Redux DevTools Verification

| Check | Tool | Expected |
|-------|------|----------|
| Redux State Inspection | Redux DevTools browser extension | State tree visible; editor and ui slices present; actions dispatch on user interactions |
| Time Travel Debugging | Redux DevTools | Can replay actions; state updates correctly |

### QA Sign-off Requirements
- [ ] All unit tests pass (N/A - no tests exist)
- [ ] All integration tests pass (manual verification)
- [ ] All E2E tests pass (manual verification)
- [ ] Browser verification complete (both Browser and Electron)
- [ ] Database state verified (N/A)
- [ ] TypeScript compiles without errors
- [ ] Redux DevTools shows proper state management
- [ ] No regressions in existing functionality
- [ ] Code follows established patterns (React hooks, Redux Toolkit, TypeScript strict mode)
- [ ] No security vulnerabilities introduced (Electron contextIsolation maintained)
- [ ] Both platforms tested (Browser + Electron)
- [ ] File operations work across platforms
- [ ] Syntax highlighting still functions correctly
- [ ] No console errors or warnings
- [ ] HMR/Fast Refresh works in development mode
