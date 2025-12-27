/**
 * Electron Renderer App Component
 * Main entry point for the Electron version of the notepad application.
 * Wraps the application in Redux Provider and handles initialization,
 * file operations, keyboard shortcuts, and editor state management.
 * Uses the electronAPI exposed by the preload script via contextBridge.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { openFile, fileSaved } from '../store/slices/editorSlice';
import { setStatus, showLoading, hideLoading, togglePreview } from '../store/slices/uiSlice';
import { Editor } from '../components/Editor';
import { StatusBar } from '../components/StatusBar';
import { createFileSystem } from '../shared/file-system-abstraction';
import type { FileSystem, FileOpenResult } from '../shared/file-system-abstraction';
import { createEditorHighlightManager } from '../shared/editor';
import type { EditorHighlightManager } from '../shared/editor';

// Import Electron file system handler (auto-registers with adapter registry)
import './file-system-handler';
import { isElectronAPIAvailable } from './file-system-handler';

/**
 * Props for the ElectronAppContent component
 */
interface ElectronAppContentProps {
  /** Reference to the highlighted code element */
  highlightedCodeRef: React.RefObject<HTMLElement>;
  /** Reference to the language indicator element */
  languageIndicatorRef: React.RefObject<HTMLSpanElement>;
}

/**
 * Extracts the file name from a full file path.
 * @param filePath - The full file path
 * @returns The file name
 */
function getFileNameFromPath(filePath: string | null | undefined): string {
  if (!filePath) return 'Untitled';
  // Handle both Unix and Windows path separators
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1] || 'Untitled';
}

/**
 * Main application content component for Electron.
 * Separated from Provider wrapper to allow Redux hooks usage.
 */
function ElectronAppContent({ highlightedCodeRef, languageIndicatorRef }: ElectronAppContentProps) {
  const dispatch = useAppDispatch();

  // Redux state selectors
  const fileName = useAppSelector((state) => state.editor.fileName);
  const isModified = useAppSelector((state) => state.editor.isModified);
  const content = useAppSelector((state) => state.editor.content);
  const loading = useAppSelector((state) => state.ui.loading);
  const loadingMessage = useAppSelector((state) => state.ui.loadingMessage);
  const previewVisible = useAppSelector((state) => state.ui.previewVisible);

  // Local state for cursor position
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorColumn, setCursorColumn] = useState(1);

  // Refs for file system and highlighting
  const fileSystemRef = useRef<FileSystem | null>(null);
  const currentHandleRef = useRef<string | null>(null);
  const highlightManagerRef = useRef<EditorHighlightManager | null>(null);
  const isInitializedRef = useRef(false);

  // Check if Electron API is available
  const [isElectronSupported, setIsElectronSupported] = useState(true);

  /**
   * Updates document title based on file name and modified state.
   */
  useEffect(() => {
    document.title = `${isModified ? '* ' : ''}${fileName} - Notepad`;
  }, [fileName, isModified]);

  /**
   * Handles the Open File action.
   */
  const handleOpenFile = useCallback(async () => {
    if (!fileSystemRef.current) return;

    try {
      dispatch(showLoading('Opening file...'));
      dispatch(setStatus('Opening file...'));

      const result: FileOpenResult | null = await fileSystemRef.current.openFile();

      if (result) {
        // In Electron, handle is the file path (string)
        currentHandleRef.current = result.handle as string || null;
        const resultName = result.name || getFileNameFromPath(result.path);
        dispatch(openFile({ content: result.content, fileName: resultName }));
        dispatch(setStatus(`Opened: ${resultName}`));

        // Trigger immediate syntax highlighting update
        if (highlightManagerRef.current) {
          highlightManagerRef.current.update(result.content, resultName);
        }
      } else {
        dispatch(setStatus('Open cancelled'));
      }
    } catch (err) {
      dispatch(setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`));
    } finally {
      dispatch(hideLoading());
    }
  }, [dispatch]);

  /**
   * Handles the Save action.
   */
  const handleSave = useCallback(async () => {
    if (!fileSystemRef.current) return;

    try {
      dispatch(showLoading('Saving file...'));
      dispatch(setStatus('Saving...'));

      const result = await fileSystemRef.current.saveFile(currentHandleRef.current, content);

      if (result) {
        // In Electron, result is a file path string
        currentHandleRef.current = result as string;
        const resultName = getFileNameFromPath(result as string);
        dispatch(fileSaved({ fileName: resultName }));
        dispatch(setStatus(`Saved: ${resultName || fileName}`));
      } else {
        dispatch(setStatus('Save cancelled'));
      }
    } catch (err) {
      dispatch(setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`));
    } finally {
      dispatch(hideLoading());
    }
  }, [dispatch, content, fileName]);

  /**
   * Handles the Save As action.
   */
  const handleSaveAs = useCallback(async () => {
    if (!fileSystemRef.current) return;

    try {
      dispatch(showLoading('Saving file...'));
      dispatch(setStatus('Saving as...'));

      // Pass null to force showing save picker
      const result = await fileSystemRef.current.saveFile(null, content);

      if (result) {
        // In Electron, result is a file path string
        currentHandleRef.current = result as string;
        const resultName = getFileNameFromPath(result as string);
        dispatch(fileSaved({ fileName: resultName }));
        dispatch(setStatus(`Saved: ${resultName || fileName}`));
      } else {
        dispatch(setStatus('Save cancelled'));
      }
    } catch (err) {
      dispatch(setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`));
    } finally {
      dispatch(hideLoading());
    }
  }, [dispatch, content, fileName]);

  /**
   * Handles preview panel toggle.
   */
  const handleTogglePreview = useCallback(() => {
    dispatch(togglePreview());
  }, [dispatch]);

  /**
   * Handles cursor position changes from the Editor component.
   */
  const handleCursorChange = useCallback((line: number, column: number) => {
    setCursorLine(line);
    setCursorColumn(column);
  }, []);

  /**
   * Handles content changes for syntax highlighting.
   */
  const handleContentChange = useCallback((newContent: string, newFileName: string) => {
    if (highlightManagerRef.current) {
      highlightManagerRef.current.updateDebounced(newContent, newFileName);
    }
  }, []);

  /**
   * Sets up keyboard shortcuts.
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + O: Open file
      if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
        event.preventDefault();
        handleOpenFile();
      }
      // Ctrl/Cmd + S: Save file
      // Ctrl/Cmd + Shift + S: Save As
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (event.shiftKey) {
          handleSaveAs();
        } else {
          handleSave();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleOpenFile, handleSave, handleSaveAs]);

  /**
   * Warns about unsaved changes before leaving.
   */
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isModified) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isModified]);

  /**
   * Initializes the application.
   */
  useEffect(() => {
    if (isInitializedRef.current) return;

    // Check Electron API support
    if (!isElectronAPIAvailable()) {
      setIsElectronSupported(false);
      dispatch(setStatus('Electron API not available - file operations disabled'));
      return;
    }

    try {
      // Create the file system adapter
      fileSystemRef.current = createFileSystem();

      // Initialize syntax highlighting manager
      if (highlightedCodeRef.current && languageIndicatorRef.current) {
        highlightManagerRef.current = createEditorHighlightManager({
          codeElement: highlightedCodeRef.current,
          languageIndicator: languageIndicatorRef.current,
          debounceDelay: 300,
        });
      }

      isInitializedRef.current = true;
      dispatch(setStatus('Ready'));
    } catch (err) {
      dispatch(setStatus(`Initialization error: ${err instanceof Error ? err.message : 'Unknown error'}`));
    }
  }, [dispatch, highlightedCodeRef, languageIndicatorRef]);

  // If Electron API is not supported, show warning
  if (!isElectronSupported) {
    return (
      <div id="app">
        <header className="toolbar">
          <div className="toolbar-left">
            <h1 className="app-title">Notepad</h1>
            <span id="file-name" className="file-name">Untitled</span>
          </div>
          <div className="toolbar-right">
            <button type="button" className="btn btn-primary" disabled>
              <span className="btn-icon" aria-hidden="true">&#128194;</span>
              Open File
            </button>
            <button type="button" className="btn btn-secondary" disabled>
              <span className="btn-icon" aria-hidden="true">&#128190;</span>
              Save
            </button>
            <button type="button" className="btn btn-secondary" disabled>
              <span className="btn-icon" aria-hidden="true">&#128190;</span>
              Save As
            </button>
          </div>
        </header>

        <main className="editor-container">
          <div id="electron-warning" className="browser-warning">
            <div className="warning-content">
              <h2>Electron API Not Available</h2>
              <p>
                The Electron API could not be initialized.
                This usually means the preload script is not properly loaded.
              </p>
              <p>Please ensure you are running this application through Electron.</p>
            </div>
          </div>
        </main>

        <StatusBar cursorLine={1} cursorColumn={1} />
      </div>
    );
  }

  return (
    <div id="app">
      {/* Header with file operations */}
      <header className="toolbar">
        <div className="toolbar-left">
          <h1 className="app-title">Notepad</h1>
          <span id="file-name" className="file-name">{fileName}</span>
          {isModified && (
            <span id="modified-indicator" className="modified-indicator">*</span>
          )}
        </div>
        <div className="toolbar-right">
          <button
            id="btn-open"
            type="button"
            className="btn btn-primary"
            onClick={handleOpenFile}
          >
            <span className="btn-icon" aria-hidden="true">&#128194;</span>
            Open File
          </button>
          <button
            id="btn-save"
            type="button"
            className="btn btn-secondary"
            onClick={handleSave}
          >
            <span className="btn-icon" aria-hidden="true">&#128190;</span>
            Save
          </button>
          <button
            id="btn-save-as"
            type="button"
            className="btn btn-secondary"
            onClick={handleSaveAs}
          >
            <span className="btn-icon" aria-hidden="true">&#128190;</span>
            Save As
          </button>
          <button
            id="btn-toggle-preview"
            type="button"
            className="btn btn-secondary"
            onClick={handleTogglePreview}
          >
            <span className="btn-icon" aria-hidden="true">&#128065;</span>
            Preview
          </button>
        </div>
      </header>

      {/* Main editor area */}
      <main className="editor-container">
        <div
          id="editor-panel"
          className={`editor-panel${previewVisible ? ' split-view' : ''}`}
        >
          <Editor
            className="editor"
            onCursorChange={handleCursorChange}
            onContentChange={handleContentChange}
          />
        </div>

        {/* Syntax highlighting preview panel */}
        {previewVisible && (
          <div id="preview-panel" className="preview-panel">
            <div className="preview-header">
              <span className="preview-title">Syntax Highlighting Preview</span>
              <span
                ref={languageIndicatorRef}
                id="language-indicator"
                className="language-indicator"
              >
                Plain Text
              </span>
            </div>
            <pre id="code-preview" className="code-preview">
              <code ref={highlightedCodeRef} id="highlighted-code"></code>
            </pre>
          </div>
        )}
      </main>

      {/* Status bar */}
      <StatusBar cursorLine={cursorLine} cursorColumn={cursorColumn} />

      {/* Loading overlay */}
      {loading && (
        <div id="loading-overlay" className="loading-overlay">
          <div className="loading-spinner"></div>
          <span className="loading-text">{loadingMessage}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Electron Renderer App wrapper component.
 * Provides Redux store and refs for child components.
 */
export function RendererApp() {
  const highlightedCodeRef = useRef<HTMLElement>(null);
  const languageIndicatorRef = useRef<HTMLSpanElement>(null);

  return (
    <Provider store={store}>
      <ElectronAppContent
        highlightedCodeRef={highlightedCodeRef}
        languageIndicatorRef={languageIndicatorRef}
      />
    </Provider>
  );
}

export default RendererApp;
