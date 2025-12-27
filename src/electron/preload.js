/**
 * Electron Preload Script
 *
 * This script runs in a privileged context before renderer content loads.
 * It uses contextBridge to safely expose a limited API to the renderer process.
 *
 * SECURITY: Never expose ipcRenderer directly to the renderer process.
 * Only expose specific, controlled methods through contextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose a secure electronAPI to the renderer process.
 *
 * This API provides file system operations through IPC,
 * ensuring all file operations happen in the main process
 * where Node.js APIs are available and properly sandboxed.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Opens a native file picker dialog and reads the selected file.
   * @returns {Promise<{path: string, content: string, name: string} | null>}
   *          Returns file data or null if user cancelled
   */
  openFile: () => ipcRenderer.invoke('open-file'),

  /**
   * Saves content to a file.
   * If no path is provided, shows a save dialog.
   * @param {string | null} path - Existing file path or null for new file
   * @param {string} content - Content to save
   * @returns {Promise<{path: string, name: string} | null>}
   *          Returns saved file info or null if user cancelled
   */
  saveFile: (path, content) => ipcRenderer.invoke('save-file', { path, content }),

  /**
   * Saves content to a new file (always shows save dialog).
   * @param {string} content - Content to save
   * @param {string} [suggestedName] - Suggested filename for the dialog
   * @returns {Promise<{path: string, name: string} | null>}
   *          Returns saved file info or null if user cancelled
   */
  saveFileAs: (content, suggestedName) => ipcRenderer.invoke('save-file-as', { content, suggestedName })
});
