/**
 * Electron File System Handler
 * Implements file operations using Electron's native file system via IPC.
 * Uses the electronAPI exposed by the preload script via contextBridge.
 */

import {
  FileSystemAdapter,
  registerAdapter,
  type FileOpenResult
} from '../shared/file-system-abstraction';
import type { ElectronAPI, SaveFileResult } from '../types/electron';

/**
 * Checks if the Electron API is available.
 * The API is exposed by the preload script via contextBridge.
 * @returns True if electronAPI is available
 */
function isElectronAPIAvailable(): boolean {
  return typeof window !== 'undefined' && window.electronAPI != null;
}

/**
 * Gets the typed electronAPI from the window object.
 * @returns The typed electronAPI
 * @throws Error if the API is not available
 */
function getElectronAPI(): ElectronAPI {
  if (!isElectronAPIAvailable()) {
    throw new Error(
      'Electron API is not available. ' +
      'Make sure you are running in an Electron environment with the preload script loaded.'
    );
  }
  return window.electronAPI as ElectronAPI;
}

/**
 * Electron implementation of the FileSystemAdapter.
 * Uses IPC to communicate with the main process for file operations.
 */
class ElectronFileSystem extends FileSystemAdapter {
  /**
   * Opens a file using Electron's native file picker dialog.
   * @returns Promise resolving to file data or null if user cancelled
   */
  async openFile(): Promise<FileOpenResult | null> {
    const api = getElectronAPI();

    // Call the main process via IPC
    const result = await api.openFile();

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
   * @param handle - Existing file path or null for new file
   * @param content - The content to save
   * @returns Promise resolving to the file path or null if cancelled
   */
  async saveFile(handle: string | null, content: string): Promise<string | null> {
    const api = getElectronAPI();

    let result: SaveFileResult | null;

    if (handle) {
      // Save to existing file path
      result = await api.saveFile(handle, content);
    } else {
      // No existing path, show save dialog
      result = await api.saveFileAs(content);
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
   * @param content - The content to save
   * @param suggestedName - Suggested filename for the dialog
   * @returns Promise resolving to file info or null if cancelled
   */
  async saveFileAs(content: string, suggestedName?: string): Promise<SaveFileResult | null> {
    const api = getElectronAPI();

    // Always show save dialog for Save As
    const result = await api.saveFileAs(content, suggestedName);

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
