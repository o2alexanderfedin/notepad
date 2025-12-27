/**
 * Electron Preload Script
 *
 * This script runs in a privileged context before renderer content loads.
 * It uses contextBridge to safely expose a limited API to the renderer process.
 *
 * SECURITY: Never expose ipcRenderer directly to the renderer process.
 * Only expose specific, controlled methods through contextBridge.
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI, OpenFileResult, SaveFileResult } from '../types/electron';

/**
 * The secure Electron API implementation.
 *
 * This object defines all methods exposed to the renderer process
 * through contextBridge. Each method uses ipcRenderer.invoke to
 * communicate with the main process.
 */
const electronAPI: ElectronAPI = {
  /**
   * Opens a native file picker dialog and reads the selected file.
   * @returns Promise resolving to file data or null if user cancelled
   */
  openFile: (): Promise<OpenFileResult | null> => {
    return ipcRenderer.invoke('open-file');
  },

  /**
   * Saves content to a file.
   * If no path is provided, shows a save dialog.
   * @param path - Existing file path or null for new file
   * @param content - Content to save
   * @returns Promise resolving to saved file info or null if user cancelled
   */
  saveFile: (path: string | null, content: string): Promise<SaveFileResult | null> => {
    return ipcRenderer.invoke('save-file', { path, content });
  },

  /**
   * Saves content to a new file (always shows save dialog).
   * @param content - Content to save
   * @param suggestedName - Optional suggested filename for the dialog
   * @returns Promise resolving to saved file info or null if user cancelled
   */
  saveFileAs: (content: string, suggestedName?: string): Promise<SaveFileResult | null> => {
    return ipcRenderer.invoke('save-file-as', { content, suggestedName });
  }
};

/**
 * Expose a secure electronAPI to the renderer process.
 *
 * This API provides file system operations through IPC,
 * ensuring all file operations happen in the main process
 * where Node.js APIs are available and properly sandboxed.
 */
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
