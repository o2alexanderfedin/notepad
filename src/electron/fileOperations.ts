/**
 * Electron File Operations
 * Provides reusable file operation functions (open, save, saveAs) for the Electron platform.
 * These functions handle the interaction with the electronAPI exposed by preload script
 * and return structured results for Redux state updates.
 *
 * Uses window.electronAPI for IPC communication with the Electron main process.
 */

import type { FileSystem, FileOpenResult } from '../shared/file-system-abstraction';
import type { OpenFileResult as ElectronOpenFileResult, SaveFileResult as ElectronSaveFileResult } from '../types/electron.d';

/**
 * File handle type - In Electron, handles are always file paths (strings)
 */
export type FileHandle = string | null;

/**
 * Result of an open file operation
 */
export interface OpenFileResult {
  /** Whether the operation was successful */
  success: boolean;
  /** The opened file content (if successful) */
  content?: string;
  /** The file name (if successful) */
  fileName?: string;
  /** The file path for subsequent save operations (if successful) */
  handle?: FileHandle;
  /** The full file path (if successful) */
  path?: string;
  /** Whether the user cancelled the operation */
  cancelled?: boolean;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Result of a save file operation
 */
export interface SaveFileResult {
  /** Whether the operation was successful */
  success: boolean;
  /** The file name after save (if successful) */
  fileName?: string;
  /** The file path after save (if successful) */
  handle?: FileHandle;
  /** The full file path after save (if successful) */
  path?: string;
  /** Whether the user cancelled the operation */
  cancelled?: boolean;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Callback type for progress/status updates
 */
export type StatusCallback = (message: string) => void;

/**
 * Callback type for loading state changes
 */
export type LoadingCallback = (loading: boolean, message?: string) => void;

/**
 * Options for file operations
 */
export interface FileOperationOptions {
  /** Callback for status updates */
  onStatus?: StatusCallback;
  /** Callback for loading state changes */
  onLoading?: LoadingCallback;
}

/**
 * Checks if the Electron API is available.
 * The API is exposed by the preload script via contextBridge.
 * @returns True if window.electronAPI is available
 */
export function isElectronAPIAvailable(): boolean {
  return typeof window !== 'undefined' && window.electronAPI != null;
}

/**
 * Handles the Open File action using Electron's native file dialog.
 * Opens a file picker dialog and reads the selected file content.
 *
 * @param fileSystem - The file system adapter to use for file operations
 * @param options - Optional callbacks for status and loading updates
 * @returns Promise resolving to the open result
 */
export async function handleOpenFile(
  fileSystem: FileSystem,
  options: FileOperationOptions = {}
): Promise<OpenFileResult> {
  const { onStatus, onLoading } = options;

  try {
    onLoading?.(true, 'Opening file...');
    onStatus?.('Opening file...');

    const result: FileOpenResult | null = await fileSystem.openFile();

    if (result) {
      onStatus?.(`Opened: ${result.name}`);
      return {
        success: true,
        content: result.content,
        fileName: result.name,
        handle: typeof result.handle === 'string' ? result.handle : null,
        path: result.path,
      };
    } else {
      onStatus?.('Open cancelled');
      return {
        success: false,
        cancelled: true,
      };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    onStatus?.(`Error: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  } finally {
    onLoading?.(false);
  }
}

/**
 * Handles the Open File action directly using window.electronAPI.
 * Bypasses the file system abstraction for direct Electron IPC access.
 *
 * @param options - Optional callbacks for status and loading updates
 * @returns Promise resolving to the open result
 */
export async function handleOpenFileWithElectronAPI(
  options: FileOperationOptions = {}
): Promise<OpenFileResult> {
  const { onStatus, onLoading } = options;

  if (!isElectronAPIAvailable()) {
    const errorMessage = 'Electron API is not available. Make sure you are running in an Electron environment.';
    onStatus?.(`Error: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  }

  try {
    onLoading?.(true, 'Opening file...');
    onStatus?.('Opening file...');

    const result: ElectronOpenFileResult | null = await window.electronAPI!.openFile();

    if (result) {
      onStatus?.(`Opened: ${result.name}`);
      return {
        success: true,
        content: result.content,
        fileName: result.name,
        handle: result.path,
        path: result.path,
      };
    } else {
      onStatus?.('Open cancelled');
      return {
        success: false,
        cancelled: true,
      };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    onStatus?.(`Error: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  } finally {
    onLoading?.(false);
  }
}

/**
 * Handles the Save action using the file system adapter.
 * Saves content to the current file (or shows save picker if no current handle).
 *
 * @param fileSystem - The file system adapter to use for file operations
 * @param currentHandle - The current file path or null for new file
 * @param content - The content to save
 * @param currentFileName - The current file name (for status updates)
 * @param options - Optional callbacks for status and loading updates
 * @returns Promise resolving to the save result
 */
export async function handleSave(
  fileSystem: FileSystem,
  currentHandle: FileHandle,
  content: string,
  currentFileName: string,
  options: FileOperationOptions = {}
): Promise<SaveFileResult> {
  const { onStatus, onLoading } = options;

  try {
    onLoading?.(true, 'Saving file...');
    onStatus?.('Saving...');

    const result = await fileSystem.saveFile(currentHandle, content);

    if (result) {
      // In Electron, result is always a string path
      const resultPath = typeof result === 'string' ? result : null;
      const displayName = getFileNameFromPath(resultPath) || currentFileName;
      onStatus?.(`Saved: ${displayName}`);
      return {
        success: true,
        fileName: displayName,
        handle: resultPath,
        path: resultPath || undefined,
      };
    } else {
      onStatus?.('Save cancelled');
      return {
        success: false,
        cancelled: true,
      };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    onStatus?.(`Error: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  } finally {
    onLoading?.(false);
  }
}

/**
 * Handles the Save action directly using window.electronAPI.
 * Bypasses the file system abstraction for direct Electron IPC access.
 *
 * @param currentHandle - The current file path or null for new file
 * @param content - The content to save
 * @param currentFileName - The current file name (for status updates)
 * @param options - Optional callbacks for status and loading updates
 * @returns Promise resolving to the save result
 */
export async function handleSaveWithElectronAPI(
  currentHandle: FileHandle,
  content: string,
  currentFileName: string,
  options: FileOperationOptions = {}
): Promise<SaveFileResult> {
  const { onStatus, onLoading } = options;

  if (!isElectronAPIAvailable()) {
    const errorMessage = 'Electron API is not available. Make sure you are running in an Electron environment.';
    onStatus?.(`Error: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  }

  try {
    onLoading?.(true, 'Saving file...');
    onStatus?.('Saving...');

    let result: ElectronSaveFileResult | null;

    if (currentHandle) {
      // Save to existing file path
      result = await window.electronAPI!.saveFile(currentHandle, content);
    } else {
      // No existing path, show save dialog
      result = await window.electronAPI!.saveFileAs(content);
    }

    if (result) {
      const displayName = result.name || getFileNameFromPath(result.path) || currentFileName;
      onStatus?.(`Saved: ${displayName}`);
      return {
        success: true,
        fileName: displayName,
        handle: result.path,
        path: result.path,
      };
    } else {
      onStatus?.('Save cancelled');
      return {
        success: false,
        cancelled: true,
      };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    onStatus?.(`Error: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  } finally {
    onLoading?.(false);
  }
}

/**
 * Handles the Save As action using the file system adapter.
 * Always shows the save picker dialog to save to a new file.
 *
 * @param fileSystem - The file system adapter to use for file operations
 * @param content - The content to save
 * @param currentFileName - The current file name (for status updates)
 * @param options - Optional callbacks for status and loading updates
 * @returns Promise resolving to the save result
 */
export async function handleSaveAs(
  fileSystem: FileSystem,
  content: string,
  currentFileName: string,
  options: FileOperationOptions = {}
): Promise<SaveFileResult> {
  const { onStatus, onLoading } = options;

  try {
    onLoading?.(true, 'Saving file...');
    onStatus?.('Saving as...');

    // Pass null to force showing save picker
    const result = await fileSystem.saveFile(null, content);

    if (result) {
      // In Electron, result is always a string path
      const resultPath = typeof result === 'string' ? result : null;
      const displayName = getFileNameFromPath(resultPath) || currentFileName;
      onStatus?.(`Saved: ${displayName}`);
      return {
        success: true,
        fileName: displayName,
        handle: resultPath,
        path: resultPath || undefined,
      };
    } else {
      onStatus?.('Save cancelled');
      return {
        success: false,
        cancelled: true,
      };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    onStatus?.(`Error: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  } finally {
    onLoading?.(false);
  }
}

/**
 * Handles the Save As action directly using window.electronAPI.
 * Bypasses the file system abstraction for direct Electron IPC access.
 *
 * @param content - The content to save
 * @param currentFileName - The current file name (for status updates)
 * @param suggestedName - Optional suggested filename for the dialog
 * @param options - Optional callbacks for status and loading updates
 * @returns Promise resolving to the save result
 */
export async function handleSaveAsWithElectronAPI(
  content: string,
  currentFileName: string,
  suggestedName?: string,
  options: FileOperationOptions = {}
): Promise<SaveFileResult> {
  const { onStatus, onLoading } = options;

  if (!isElectronAPIAvailable()) {
    const errorMessage = 'Electron API is not available. Make sure you are running in an Electron environment.';
    onStatus?.(`Error: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  }

  try {
    onLoading?.(true, 'Saving file...');
    onStatus?.('Saving as...');

    // Always show save dialog for Save As
    const result: ElectronSaveFileResult | null = await window.electronAPI!.saveFileAs(content, suggestedName);

    if (result) {
      const displayName = result.name || getFileNameFromPath(result.path) || currentFileName;
      onStatus?.(`Saved: ${displayName}`);
      return {
        success: true,
        fileName: displayName,
        handle: result.path,
        path: result.path,
      };
    } else {
      onStatus?.('Save cancelled');
      return {
        success: false,
        cancelled: true,
      };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    onStatus?.(`Error: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  } finally {
    onLoading?.(false);
  }
}

/**
 * Creates a file operations handler with bound callbacks using the file system adapter.
 * Useful for creating a reusable handler instance with pre-configured callbacks.
 *
 * @param fileSystem - The file system adapter to use
 * @param options - Callbacks for status and loading updates
 * @returns Object with bound file operation methods
 */
export function createFileOperationsHandler(
  fileSystem: FileSystem,
  options: FileOperationOptions = {}
) {
  return {
    /**
     * Opens a file using the file picker dialog.
     */
    openFile: () => handleOpenFile(fileSystem, options),

    /**
     * Saves content to the current file or shows save picker.
     * @param currentHandle - The current file path (or null for new file)
     * @param content - The content to save
     * @param currentFileName - The current file name
     */
    save: (currentHandle: FileHandle, content: string, currentFileName: string) =>
      handleSave(fileSystem, currentHandle, content, currentFileName, options),

    /**
     * Saves content to a new file (always shows save picker).
     * @param content - The content to save
     * @param currentFileName - The current file name
     */
    saveAs: (content: string, currentFileName: string) =>
      handleSaveAs(fileSystem, content, currentFileName, options),
  };
}

/**
 * Creates a file operations handler with bound callbacks using direct electronAPI.
 * Useful for creating a reusable handler instance without the file system abstraction.
 *
 * @param options - Callbacks for status and loading updates
 * @returns Object with bound file operation methods
 */
export function createElectronFileOperationsHandler(
  options: FileOperationOptions = {}
) {
  return {
    /**
     * Checks if the Electron API is available.
     */
    isAvailable: isElectronAPIAvailable,

    /**
     * Opens a file using the native file picker dialog.
     */
    openFile: () => handleOpenFileWithElectronAPI(options),

    /**
     * Saves content to the current file or shows save picker.
     * @param currentHandle - The current file path (or null for new file)
     * @param content - The content to save
     * @param currentFileName - The current file name
     */
    save: (currentHandle: FileHandle, content: string, currentFileName: string) =>
      handleSaveWithElectronAPI(currentHandle, content, currentFileName, options),

    /**
     * Saves content to a new file (always shows save picker).
     * @param content - The content to save
     * @param currentFileName - The current file name
     * @param suggestedName - Optional suggested filename for the dialog
     */
    saveAs: (content: string, currentFileName: string, suggestedName?: string) =>
      handleSaveAsWithElectronAPI(content, currentFileName, suggestedName, options),
  };
}

/**
 * Extracts the file name from a full file path.
 * Utility function to get a display name from file paths.
 * Handles both Unix (/) and Windows (\) path separators.
 *
 * @param filePath - The full file path
 * @returns The extracted file name or undefined if path is null/empty
 */
export function getFileNameFromPath(filePath: string | null | undefined): string | undefined {
  if (!filePath) return undefined;
  // Handle both Unix and Windows path separators
  const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
  return lastSlash >= 0 ? filePath.slice(lastSlash + 1) : filePath;
}

/**
 * Extracts the file name from a file handle.
 * For Electron, handles are always file paths.
 *
 * @param handle - The file handle (path)
 * @returns The extracted file name or undefined
 */
export function getFileNameFromHandle(handle: FileHandle): string | undefined {
  return getFileNameFromPath(handle);
}
