/**
 * Browser File System Handler
 * Implements file operations using the File System Access API.
 * Only works in Chromium-based browsers (Chrome 86+, Edge 86+).
 */

import {
  FileSystemAdapter,
  registerAdapter,
  isFileSystemAccessSupported
} from '../shared/file-system-abstraction.ts';

/**
 * File type configurations for the file picker dialogs.
 * Supports common text and code file types.
 */
const FILE_TYPES = [
  {
    description: 'Text Files',
    accept: {
      'text/plain': ['.txt']
    }
  },
  {
    description: 'JavaScript Files',
    accept: {
      'text/javascript': ['.js', '.mjs', '.cjs', '.jsx']
    }
  },
  {
    description: 'TypeScript Files',
    accept: {
      'text/typescript': ['.ts', '.tsx']
    }
  },
  {
    description: 'Python Files',
    accept: {
      'text/x-python': ['.py']
    }
  },
  {
    description: 'Web Files',
    accept: {
      'text/html': ['.html', '.htm'],
      'text/css': ['.css'],
      'text/markdown': ['.md', '.markdown']
    }
  },
  {
    description: 'Data Files',
    accept: {
      'application/json': ['.json'],
      'text/yaml': ['.yaml', '.yml'],
      'text/xml': ['.xml']
    }
  },
  {
    description: 'All Files',
    accept: {
      '*/*': []
    }
  }
];

/**
 * Browser implementation of the FileSystemAdapter.
 * Uses the File System Access API for file operations.
 */
class BrowserFileSystem extends FileSystemAdapter {
  /**
   * Opens a file using the browser's file picker dialog.
   * @returns {Promise<{handle: FileSystemFileHandle, content: string, name: string} | null>}
   *   Returns file data or null if user cancelled
   */
  async openFile() {
    // Check for API support
    if (!isFileSystemAccessSupported()) {
      throw new Error(
        'File System Access API is not supported in this browser. ' +
        'Please use Chrome, Edge, or the Electron desktop app.'
      );
    }

    try {
      // Show the file picker dialog
      const [fileHandle] = await window.showOpenFilePicker({
        types: FILE_TYPES,
        multiple: false
      });

      // Read the file contents
      const file = await fileHandle.getFile();
      const content = await file.text();

      return {
        handle: fileHandle,
        content,
        name: file.name
      };
    } catch (err) {
      // User cancelled the file picker - not an error
      if (err.name === 'AbortError') {
        return null;
      }
      // Re-throw other errors
      throw err;
    }
  }

  /**
   * Saves content to a file using the browser's file system.
   * @param {FileSystemFileHandle | null} handle - Existing file handle or null for new file
   * @param {string} content - The content to save
   * @returns {Promise<FileSystemFileHandle | null>} Returns the file handle or null if cancelled
   */
  async saveFile(handle, content) {
    // Check for API support
    if (!isFileSystemAccessSupported()) {
      throw new Error(
        'File System Access API is not supported in this browser. ' +
        'Please use Chrome, Edge, or the Electron desktop app.'
      );
    }

    try {
      let fileHandle = handle;

      // If no existing handle, show save picker for new file
      if (!fileHandle) {
        fileHandle = await window.showSaveFilePicker({
          suggestedName: 'untitled.txt',
          types: FILE_TYPES
        });
      }

      // Create a writable stream and write the content
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      return fileHandle;
    } catch (err) {
      // User cancelled the save picker - not an error
      if (err.name === 'AbortError') {
        return null;
      }
      // Re-throw other errors
      throw err;
    }
  }
}

// Create and register the browser adapter instance
const browserFileSystem = new BrowserFileSystem();
registerAdapter('browser', browserFileSystem);

// Export for direct usage if needed
export { BrowserFileSystem, browserFileSystem, FILE_TYPES };
