/**
 * Electron File System Handler
 * Implements file operations using Electron's native file system via IPC.
 * Uses the electronAPI exposed by the preload script via contextBridge.
 */

import {
  FileSystemAdapter,
  registerAdapter
} from '../shared/file-system-abstraction.js';

/**
 * Checks if the Electron API is available.
 * The API is exposed by the preload script via contextBridge.
 * @returns {boolean} True if electronAPI is available
 */
function isElectronAPIAvailable() {
  return typeof window !== 'undefined' && window.electronAPI != null;
}

/**
 * Electron implementation of the FileSystemAdapter.
 * Uses IPC to communicate with the main process for file operations.
 */
class ElectronFileSystem extends FileSystemAdapter {
  /**
   * Opens a file using Electron's native file picker dialog.
   * @returns {Promise<{handle: string, content: string, name: string, path: string} | null>}
   *   Returns file data or null if user cancelled
   */
  async openFile() {
    // Check for API availability
    if (!isElectronAPIAvailable()) {
      throw new Error(
        'Electron API is not available. ' +
        'Make sure you are running in an Electron environment with the preload script loaded.'
      );
    }

    // Call the main process via IPC
    const result = await window.electronAPI.openFile();

    // User cancelled the file picker
    if (!result) {
      return null;
    }

    // Return with consistent interface
    // In Electron, the "handle" is the file path
    return {
      handle: result.path,
      content: result.content,
      name: result.name,
      path: result.path
    };
  }

  /**
   * Saves content to a file using Electron's native file system.
   * @param {string | null} handle - Existing file path or null for new file
   * @param {string} content - The content to save
   * @returns {Promise<string | null>} Returns the file path or null if cancelled
   */
  async saveFile(handle, content) {
    // Check for API availability
    if (!isElectronAPIAvailable()) {
      throw new Error(
        'Electron API is not available. ' +
        'Make sure you are running in an Electron environment with the preload script loaded.'
      );
    }

    let result;

    if (handle) {
      // Save to existing file path
      result = await window.electronAPI.saveFile(handle, content);
    } else {
      // No existing path, show save dialog
      result = await window.electronAPI.saveFileAs(content);
    }

    // User cancelled the save dialog
    if (!result) {
      return null;
    }

    // Return the file path as the handle
    return result.path;
  }

  /**
   * Saves content to a new file (always shows save dialog).
   * @param {string} content - The content to save
   * @param {string} [suggestedName] - Suggested filename for the dialog
   * @returns {Promise<{path: string, name: string} | null>} Returns file info or null if cancelled
   */
  async saveFileAs(content, suggestedName) {
    // Check for API availability
    if (!isElectronAPIAvailable()) {
      throw new Error(
        'Electron API is not available. ' +
        'Make sure you are running in an Electron environment with the preload script loaded.'
      );
    }

    // Always show save dialog for Save As
    const result = await window.electronAPI.saveFileAs(content, suggestedName);

    // User cancelled the save dialog
    if (!result) {
      return null;
    }

    return result;
  }
}

// Create and register the Electron adapter instance
const electronFileSystem = new ElectronFileSystem();
registerAdapter('electron', electronFileSystem);

// Export for direct usage if needed
export { ElectronFileSystem, electronFileSystem, isElectronAPIAvailable };
