/**
 * File System Abstraction Layer
 * Provides a unified interface for file operations across browser and Electron platforms.
 */

/**
 * Supported runtime environments.
 */
export type Environment = 'electron' | 'browser';

/**
 * Result of a file open operation.
 */
export interface FileOpenResult {
  /** Platform-specific file handle for subsequent operations */
  handle: FileSystemFileHandle | string;
  /** The content of the opened file */
  content: string;
  /** The name of the file */
  name: string;
  /** The full path to the file (Electron only) */
  path?: string;
}

/**
 * Interface defining the file system operations.
 * Platform-specific implementations must implement this interface.
 */
export interface FileSystem {
  /**
   * Opens a file using the platform's native file picker.
   * @returns Promise resolving to file data or null if user cancelled
   */
  openFile(): Promise<FileOpenResult | null>;

  /**
   * Saves content to a file.
   * @param handle - File handle/path from previous open or null for new file
   * @param content - The content to save
   * @returns Promise resolving to the file handle/path or null if cancelled
   */
  saveFile(handle: FileSystemFileHandle | string | null, content: string): Promise<FileSystemFileHandle | string | null>;

  /**
   * Gets the file extension from a file name.
   * @param fileName - The file name
   * @returns The file extension without the dot, or empty string
   */
  getExtension(fileName: string): string;
}

/**
 * Abstract base class defining the file system interface.
 * Platform-specific implementations must extend this class.
 */
export abstract class FileSystemAdapter implements FileSystem {
  /**
   * Opens a file using the platform's native file picker.
   * @returns Promise resolving to file data or null if user cancelled
   */
  abstract openFile(): Promise<FileOpenResult | null>;

  /**
   * Saves content to a file.
   * @param handle - File handle/path from previous open or null for new file
   * @param content - The content to save
   * @returns Promise resolving to the file handle/path or null if cancelled
   */
  abstract saveFile(handle: FileSystemFileHandle | string | null, content: string): Promise<FileSystemFileHandle | string | null>;

  /**
   * Gets the file extension from a file name.
   * @param fileName - The file name
   * @returns The file extension without the dot, or empty string
   */
  getExtension(fileName: string): string {
    if (!fileName) return '';
    const lastDot = fileName.lastIndexOf('.');
    if (lastDot === -1 || lastDot === fileName.length - 1) return '';
    return fileName.slice(lastDot + 1).toLowerCase();
  }
}

/**
 * Adapter registry type.
 */
interface AdapterRegistry {
  browser: FileSystemAdapter | null;
  electron: FileSystemAdapter | null;
}

/**
 * Registry for file system adapters.
 * Implementations register themselves when loaded.
 */
const adapterRegistry: AdapterRegistry = {
  browser: null,
  electron: null
};

/**
 * Detects the current runtime environment.
 * @returns The detected environment
 */
export function detectEnvironment(): Environment {
  // Check for Electron API exposed via contextBridge
  if (typeof window !== 'undefined' && (window as Window & { electronAPI?: unknown }).electronAPI) {
    return 'electron';
  }
  return 'browser';
}

/**
 * Registers a file system adapter for a specific environment.
 * @param environment - The target environment
 * @param adapter - The adapter instance
 * @throws Error if adapter is not an instance of FileSystemAdapter
 */
export function registerAdapter(environment: Environment, adapter: FileSystemAdapter): void {
  if (!(adapter instanceof FileSystemAdapter)) {
    throw new Error('Adapter must extend FileSystemAdapter');
  }
  adapterRegistry[environment] = adapter;
}

/**
 * Factory function that creates the appropriate file system adapter
 * based on the current runtime environment.
 * @returns The appropriate file system adapter
 * @throws Error if no adapter is registered for the current environment
 */
export function createFileSystem(): FileSystemAdapter {
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
 * @returns True if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' &&
         'showOpenFilePicker' in window &&
         'showSaveFilePicker' in window;
}
