/**
 * Browser File Operations
 * Provides reusable file operation functions (open, save, saveAs) for the browser platform.
 * These functions handle the interaction with the file system adapter and return
 * structured results for Redux state updates.
 */

import type { FileSystem, FileOpenResult } from '../shared/file-system-abstraction';

/**
 * File handle type - can be a FileSystemFileHandle (browser) or string path (Electron)
 */
export type FileHandle = FileSystemFileHandle | string | null;

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
  /** The file handle for subsequent save operations (if successful) */
  handle?: FileHandle;
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
  /** The file handle after save (if successful) */
  handle?: FileHandle;
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
 * Handles the Open File action.
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
        handle: result.handle || null,
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
 * Handles the Save action.
 * Saves content to the current file (or shows save picker if no current handle).
 *
 * @param fileSystem - The file system adapter to use for file operations
 * @param currentHandle - The current file handle (or null for new file)
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
      // Handle both FileSystemFileHandle and string (path) results
      const resultName = typeof result === 'string' ? result : result.name;
      const displayName = resultName || currentFileName;
      onStatus?.(`Saved: ${displayName}`);
      return {
        success: true,
        fileName: resultName,
        handle: result,
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
 * Handles the Save As action.
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
      // Handle both FileSystemFileHandle and string (path) results
      const resultName = typeof result === 'string' ? result : result.name;
      const displayName = resultName || currentFileName;
      onStatus?.(`Saved: ${displayName}`);
      return {
        success: true,
        fileName: resultName,
        handle: result,
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
 * Creates a file operations handler with bound callbacks.
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
     * @param currentHandle - The current file handle (or null for new file)
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
 * Extracts the file name from a file handle or path.
 * Utility function to get a display name from various handle types.
 *
 * @param handle - The file handle or path
 * @returns The extracted file name or undefined
 */
export function getFileNameFromHandle(handle: FileHandle): string | undefined {
  if (!handle) return undefined;

  if (typeof handle === 'string') {
    // Handle is a path, extract filename
    const lastSlash = Math.max(handle.lastIndexOf('/'), handle.lastIndexOf('\\'));
    return lastSlash >= 0 ? handle.slice(lastSlash + 1) : handle;
  }

  // FileSystemFileHandle has a name property
  return handle.name;
}
