/**
 * Type declarations for the File System Access API.
 * This API is available in Chromium-based browsers (Chrome 86+, Edge 86+).
 * @see https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
 */

/**
 * Options for the file type filters in file picker dialogs.
 */
interface FilePickerAcceptType {
  /** Human-readable description of the file type */
  description?: string;
  /** Mapping of MIME types to file extensions */
  accept: Record<string, string[]>;
}

/**
 * Options for the open file picker dialog.
 */
interface OpenFilePickerOptions {
  /** Whether to allow selecting multiple files */
  multiple?: boolean;
  /** File type filters to show in the dialog */
  types?: FilePickerAcceptType[];
  /** Whether to exclude all file types except those specified */
  excludeAcceptAllOption?: boolean;
  /** Starting directory ID for the file picker */
  id?: string;
  /** Starting directory for the file picker */
  startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
}

/**
 * Options for the save file picker dialog.
 */
interface SaveFilePickerOptions {
  /** Suggested file name for the file being saved */
  suggestedName?: string;
  /** File type filters to show in the dialog */
  types?: FilePickerAcceptType[];
  /** Whether to exclude all file types except those specified */
  excludeAcceptAllOption?: boolean;
  /** Starting directory ID for the file picker */
  id?: string;
  /** Starting directory for the file picker */
  startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
}

/**
 * Extend the Window interface to include File System Access API methods.
 */
interface Window {
  /**
   * Shows a file picker dialog that allows the user to select one or more files.
   * @param options - Options for the file picker dialog
   * @returns A promise that resolves to an array of FileSystemFileHandle objects
   */
  showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>;

  /**
   * Shows a file picker dialog that allows the user to save a file.
   * @param options - Options for the save file picker dialog
   * @returns A promise that resolves to a FileSystemFileHandle object
   */
  showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;

  /**
   * Shows a directory picker dialog that allows the user to select a directory.
   * @param options - Options for the directory picker dialog
   * @returns A promise that resolves to a FileSystemDirectoryHandle object
   */
  showDirectoryPicker(options?: { id?: string; mode?: 'read' | 'readwrite'; startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' }): Promise<FileSystemDirectoryHandle>;
}
