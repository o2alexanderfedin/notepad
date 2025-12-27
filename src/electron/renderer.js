/**
 * Electron Renderer Process Script
 * Main entry point for the Electron version of the notepad application.
 * Handles UI initialization, file operations, and editor state management.
 * Uses the electronAPI exposed by the preload script via contextBridge.
 */

// Import the Electron file system handler (auto-registers with the adapter registry)
import './file-system-handler.js';

// Import the file system factory
import { createFileSystem } from '../shared/file-system-abstraction.js';

// Import helper to check API availability
import { isElectronAPIAvailable } from './file-system-handler.js';

// Import the syntax highlighting module
import { createEditorHighlightManager } from '../shared/editor.js';

/**
 * Application state management
 */
const appState = {
  fileSystem: null,
  currentHandle: null, // In Electron, this is the file path
  currentFileName: 'Untitled',
  isModified: false,
  editorInitialized: false,
  highlightManager: null
};

/**
 * DOM element references
 */
const elements = {
  app: null,
  editor: null,
  fileName: null,
  modifiedIndicator: null,
  btnOpen: null,
  btnSave: null,
  btnSaveAs: null,
  btnTogglePreview: null,
  previewPanel: null,
  editorPanel: null,
  codePreview: null,
  highlightedCode: null,
  languageIndicator: null,
  statusMessage: null,
  cursorPosition: null,
  loadingOverlay: null,
  electronWarning: null
};

/**
 * Initialize DOM element references.
 */
function initializeElements() {
  elements.app = document.getElementById('app');
  elements.editor = document.getElementById('editor');
  elements.fileName = document.getElementById('file-name');
  elements.modifiedIndicator = document.getElementById('modified-indicator');
  elements.btnOpen = document.getElementById('btn-open');
  elements.btnSave = document.getElementById('btn-save');
  elements.btnSaveAs = document.getElementById('btn-save-as');
  elements.btnTogglePreview = document.getElementById('btn-toggle-preview');
  elements.previewPanel = document.getElementById('preview-panel');
  elements.editorPanel = document.getElementById('editor-panel');
  elements.codePreview = document.getElementById('code-preview');
  elements.highlightedCode = document.getElementById('highlighted-code');
  elements.languageIndicator = document.getElementById('language-indicator');
  elements.statusMessage = document.getElementById('status-message');
  elements.cursorPosition = document.getElementById('cursor-position');
  elements.loadingOverlay = document.getElementById('loading-overlay');
  elements.electronWarning = document.getElementById('electron-warning');
}

/**
 * Shows or hides the loading overlay.
 * @param {boolean} show - Whether to show the loading overlay
 * @param {string} [message='Loading...'] - Optional loading message
 */
function setLoading(show, message = 'Loading...') {
  if (elements.loadingOverlay) {
    elements.loadingOverlay.hidden = !show;
    const textEl = elements.loadingOverlay.querySelector('.loading-text');
    if (textEl) {
      textEl.textContent = message;
    }
  }
}

/**
 * Updates the status bar message.
 * @param {string} message - The status message to display
 */
function setStatus(message) {
  if (elements.statusMessage) {
    elements.statusMessage.textContent = message;
  }
}

/**
 * Updates the file name display and modified indicator.
 */
function updateFileDisplay() {
  if (elements.fileName) {
    elements.fileName.textContent = appState.currentFileName;
  }
  if (elements.modifiedIndicator) {
    elements.modifiedIndicator.hidden = !appState.isModified;
  }
  // Update document title
  document.title = `${appState.isModified ? '* ' : ''}${appState.currentFileName} - Notepad`;
}

/**
 * Marks the document as modified or unmodified.
 * @param {boolean} modified - Whether the document is modified
 */
function setModified(modified) {
  appState.isModified = modified;
  updateFileDisplay();
}

/**
 * Updates the cursor position display.
 */
function updateCursorPosition() {
  if (!elements.editor || !elements.cursorPosition) return;

  const text = elements.editor.value;
  const cursorPos = elements.editor.selectionStart;

  // Calculate line and column
  const textBeforeCursor = text.substring(0, cursorPos);
  const lines = textBeforeCursor.split('\n');
  const lineNumber = lines.length;
  const columnNumber = lines[lines.length - 1].length + 1;

  elements.cursorPosition.textContent = `Ln ${lineNumber}, Col ${columnNumber}`;
}

/**
 * Extracts the file name from a full file path.
 * @param {string} filePath - The full file path
 * @returns {string} The file name
 */
function getFileNameFromPath(filePath) {
  if (!filePath) return 'Untitled';
  // Handle both Unix and Windows path separators
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1] || 'Untitled';
}

/**
 * Handles the Open File action.
 */
async function handleOpenFile() {
  try {
    setLoading(true, 'Opening file...');
    setStatus('Opening file...');

    const result = await appState.fileSystem.openFile();

    if (result) {
      elements.editor.value = result.content;
      appState.currentHandle = result.handle; // In Electron, handle is the file path
      appState.currentFileName = result.name || getFileNameFromPath(result.path);
      setModified(false);
      setStatus(`Opened: ${appState.currentFileName}`);
      updateCursorPosition();

      // Trigger immediate syntax highlighting update for the opened file
      triggerHighlightUpdate(true);
    } else {
      setStatus('Open cancelled');
    }
  } catch (err) {
    setStatus(`Error: ${err.message}`);
  } finally {
    setLoading(false);
  }
}

/**
 * Handles the Save action.
 */
async function handleSave() {
  try {
    setLoading(true, 'Saving file...');
    setStatus('Saving...');

    const content = elements.editor.value;
    const result = await appState.fileSystem.saveFile(appState.currentHandle, content);

    if (result) {
      appState.currentHandle = result;
      // Update file name from the path
      appState.currentFileName = getFileNameFromPath(result);
      setModified(false);
      setStatus(`Saved: ${appState.currentFileName}`);
    } else {
      setStatus('Save cancelled');
    }
  } catch (err) {
    setStatus(`Error: ${err.message}`);
  } finally {
    setLoading(false);
  }
}

/**
 * Handles the Save As action.
 */
async function handleSaveAs() {
  try {
    setLoading(true, 'Saving file...');
    setStatus('Saving as...');

    const content = elements.editor.value;
    // Pass null to force showing save picker
    const result = await appState.fileSystem.saveFile(null, content);

    if (result) {
      appState.currentHandle = result;
      // Update file name from the path
      appState.currentFileName = getFileNameFromPath(result);
      setModified(false);
      setStatus(`Saved: ${appState.currentFileName}`);
    } else {
      setStatus('Save cancelled');
    }
  } catch (err) {
    setStatus(`Error: ${err.message}`);
  } finally {
    setLoading(false);
  }
}

/**
 * Handles editor input events (text changes).
 */
function handleEditorInput() {
  if (!appState.isModified) {
    setModified(true);
  }
  // Trigger syntax highlighting update with debouncing
  triggerHighlightUpdate();
}

/**
 * Handles editor selection/cursor changes.
 */
function handleEditorSelectionChange() {
  updateCursorPosition();
}

/**
 * Triggers syntax highlighting update.
 * Uses the EditorHighlightManager for debounced updates during typing,
 * or immediate updates when a file is opened.
 * @param {boolean} immediate - If true, updates immediately without debouncing
 */
function triggerHighlightUpdate(immediate = false) {
  if (!appState.highlightManager || !elements.editor) {
    return;
  }

  const code = elements.editor.value;
  const fileName = appState.currentFileName;

  if (immediate) {
    appState.highlightManager.update(code, fileName);
  } else {
    appState.highlightManager.updateDebounced(code, fileName);
  }
}

/**
 * Toggles the syntax highlighting preview panel.
 */
function handleTogglePreview() {
  if (elements.previewPanel && elements.editorPanel) {
    const isHidden = elements.previewPanel.hidden;
    elements.previewPanel.hidden = !isHidden;

    // Adjust editor panel to share space with preview
    if (isHidden) {
      elements.editorPanel.classList.add('split-view');
    } else {
      elements.editorPanel.classList.remove('split-view');
    }
  }
}

/**
 * Shows the Electron API unavailable warning and disables file operations.
 */
function showElectronWarning() {
  if (elements.electronWarning) {
    elements.electronWarning.hidden = false;
  }
  if (elements.editorPanel) {
    elements.editorPanel.hidden = true;
  }
  // Disable file operation buttons
  if (elements.btnOpen) elements.btnOpen.disabled = true;
  if (elements.btnSave) elements.btnSave.disabled = true;
  if (elements.btnSaveAs) elements.btnSaveAs.disabled = true;

  setStatus('Electron API not available - file operations disabled');
}

/**
 * Sets up keyboard shortcuts.
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    // Ctrl/Cmd + O: Open file
    if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
      event.preventDefault();
      handleOpenFile();
    }
    // Ctrl/Cmd + S: Save file
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      if (event.shiftKey) {
        handleSaveAs();
      } else {
        handleSave();
      }
    }
  });
}

/**
 * Sets up event listeners for UI elements.
 */
function setupEventListeners() {
  // File operation buttons
  if (elements.btnOpen) {
    elements.btnOpen.addEventListener('click', handleOpenFile);
  }
  if (elements.btnSave) {
    elements.btnSave.addEventListener('click', handleSave);
  }
  if (elements.btnSaveAs) {
    elements.btnSaveAs.addEventListener('click', handleSaveAs);
  }

  // Editor events
  if (elements.editor) {
    elements.editor.addEventListener('input', handleEditorInput);
    elements.editor.addEventListener('keyup', handleEditorSelectionChange);
    elements.editor.addEventListener('click', handleEditorSelectionChange);
    elements.editor.addEventListener('focus', handleEditorSelectionChange);
  }

  // Preview toggle
  if (elements.btnTogglePreview) {
    elements.btnTogglePreview.addEventListener('click', handleTogglePreview);
  }

  // Keyboard shortcuts
  setupKeyboardShortcuts();

  // Warn about unsaved changes before leaving
  window.addEventListener('beforeunload', (event) => {
    if (appState.isModified) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
}

/**
 * Initializes the Electron renderer application.
 */
async function initializeApp() {
  // Initialize DOM references
  initializeElements();

  // Check if Electron API is available
  if (!isElectronAPIAvailable()) {
    showElectronWarning();
    return;
  }

  try {
    // Create the file system adapter
    appState.fileSystem = createFileSystem();

    // Initialize the syntax highlighting manager
    appState.highlightManager = createEditorHighlightManager({
      codeElement: elements.highlightedCode,
      languageIndicator: elements.languageIndicator,
      debounceDelay: 300
    });

    // Set up event listeners
    setupEventListeners();

    // Initialize cursor position display
    updateCursorPosition();

    // Mark as initialized
    appState.editorInitialized = true;
    setStatus('Ready');

  } catch (err) {
    setStatus(`Initialization error: ${err.message}`);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for potential external access or testing
export {
  appState,
  elements,
  handleOpenFile,
  handleSave,
  handleSaveAs,
  setStatus,
  setLoading,
  setModified
};
