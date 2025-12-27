/**
 * Electron IPC API Type Definitions
 *
 * Type definitions for the electronAPI exposed by preload.js
 * through Electron's contextBridge.
 *
 * These types ensure type safety when using the Electron IPC bridge
 * from the renderer process (React application).
 */

/**
 * Result returned when opening a file.
 * Contains the file path, content, and display name.
 */
export interface OpenFileResult {
  /** Full path to the opened file */
  path: string;
  /** Text content of the file */
  content: string;
  /** Display name of the file (basename) */
  name: string;
}

/**
 * Result returned when saving a file.
 * Contains the file path and display name.
 */
export interface SaveFileResult {
  /** Full path where the file was saved */
  path: string;
  /** Display name of the file (basename) */
  name: string;
}

/**
 * Electron API exposed to the renderer process.
 *
 * This interface defines the secure IPC bridge methods
 * available through window.electronAPI.
 *
 * SECURITY: This API is intentionally limited to specific
 * file operations. All file system access happens in the
 * main process where it can be properly sandboxed.
 */
export interface ElectronAPI {
  /**
   * Opens a native file picker dialog and reads the selected file.
   * @returns Promise resolving to file data or null if user cancelled
   */
  openFile: () => Promise<OpenFileResult | null>;

  /**
   * Saves content to a file.
   * If no path is provided, shows a save dialog.
   * @param path - Existing file path or null for new file
   * @param content - Content to save
   * @returns Promise resolving to saved file info or null if user cancelled
   */
  saveFile: (path: string | null, content: string) => Promise<SaveFileResult | null>;

  /**
   * Saves content to a new file (always shows save dialog).
   * @param content - Content to save
   * @param suggestedName - Optional suggested filename for the dialog
   * @returns Promise resolving to saved file info or null if user cancelled
   */
  saveFileAs: (content: string, suggestedName?: string) => Promise<SaveFileResult | null>;
}

/**
 * Extend the global Window interface to include electronAPI.
 *
 * This allows TypeScript to recognize window.electronAPI
 * when running in the Electron renderer process.
 *
 * Note: electronAPI is optional because the app may also
 * run in a regular browser without Electron.
 */
declare global {
  interface Window {
    /**
     * Electron IPC API bridge.
     * Only available when running in Electron renderer process.
     */
    electronAPI?: ElectronAPI;
  }
}

// Export empty object to make this a module
export {};
