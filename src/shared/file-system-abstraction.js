/**
 * File System Abstraction Layer
 * Provides a unified interface for file operations across browser and Electron platforms.
 */

/**
 * Abstract base class defining the file system interface.
 * Platform-specific implementations must extend this class.
 */
export class FileSystemAdapter {
  /**
   * Opens a file using the platform's native file picker.
   * @returns {Promise<{handle: any, content: string, name: string, path?: string} | null>}
   *   Returns file data or null if user cancelled
   */
  async openFile() {
    throw new Error('FileSystemAdapter.openFile() must be implemented by subclass');
  }

  /**
   * Saves content to a file.
   * @param {any} handle - File handle/path from previous open or null for new file
   * @param {string} content - The content to save
   * @returns {Promise<any>} Returns the file handle/path or null if cancelled
   */
  async saveFile(handle, content) {
    throw new Error('FileSystemAdapter.saveFile() must be implemented by subclass');
  }

  /**
   * Gets the file extension from a file name.
   * @param {string} fileName - The file name
   * @returns {string} The file extension without the dot, or empty string
   */
  getExtension(fileName) {
    if (!fileName) return '';
    const lastDot = fileName.lastIndexOf('.');
    if (lastDot === -1 || lastDot === fileName.length - 1) return '';
    return fileName.slice(lastDot + 1).toLowerCase();
  }
}

/**
 * Detects the current runtime environment.
 * @returns {'electron' | 'browser'} The detected environment
 */
export function detectEnvironment() {
  // Check for Electron API exposed via contextBridge
  if (typeof window !== 'undefined' && window.electronAPI) {
    return 'electron';
  }
  return 'browser';
}

/**
 * Registry for file system adapters.
 * Implementations register themselves when loaded.
 */
const adapterRegistry = {
  browser: null,
  electron: null
};

/**
 * Registers a file system adapter for a specific environment.
 * @param {'browser' | 'electron'} environment - The target environment
 * @param {FileSystemAdapter} adapter - The adapter instance
 */
export function registerAdapter(environment, adapter) {
  if (!(adapter instanceof FileSystemAdapter)) {
    throw new Error('Adapter must extend FileSystemAdapter');
  }
  adapterRegistry[environment] = adapter;
}

/**
 * Factory function that creates the appropriate file system adapter
 * based on the current runtime environment.
 * @returns {FileSystemAdapter} The appropriate file system adapter
 * @throws {Error} If no adapter is registered for the current environment
 */
export function createFileSystem() {
  const env = detectEnvironment();
  const adapter = adapterRegistry[env];

  if (!adapter) {
    throw new Error(
      `No file system adapter registered for environment: ${env}. ` +
      `Make sure to import the appropriate file-system-handler module.`
    );
  }

  return adapter;
}

/**
 * Checks if the File System Access API is available (browser only).
 * @returns {boolean} True if File System Access API is supported
 */
export function isFileSystemAccessSupported() {
  return typeof window !== 'undefined' &&
         'showOpenFilePicker' in window &&
         'showSaveFilePicker' in window;
}
