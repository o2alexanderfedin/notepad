/**
 * Electron Main Process
 * Handles native file dialogs, IPC communication, and window management.
 * All file operations are performed in the main process for security.
 */

import { app, BrowserWindow, ipcMain, dialog, IpcMainInvokeEvent, FileFilter } from 'electron';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Get the directory path of the current module (ES modules compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Result returned when a file is successfully opened.
 */
interface FileOpenResult {
  path: string;
  content: string;
  name: string;
}

/**
 * Result returned when a file is successfully saved.
 */
interface FileSaveResult {
  path: string;
  name: string;
}

/**
 * Payload for save-file IPC handler.
 */
interface SaveFilePayload {
  path: string | null;
  content: string;
}

/**
 * Payload for save-file-as IPC handler.
 */
interface SaveFileAsPayload {
  content: string;
  suggestedName?: string;
}

/**
 * File filter configurations for native file dialogs.
 * Supports common text and code file types.
 */
const FILE_FILTERS: FileFilter[] = [
  { name: 'All Files', extensions: ['*'] },
  { name: 'Text Files', extensions: ['txt'] },
  { name: 'JavaScript', extensions: ['js', 'mjs', 'cjs', 'jsx'] },
  { name: 'TypeScript', extensions: ['ts', 'tsx'] },
  { name: 'Python', extensions: ['py'] },
  { name: 'Web Files', extensions: ['html', 'htm', 'css'] },
  { name: 'Markdown', extensions: ['md', 'markdown'] },
  { name: 'Data Files', extensions: ['json', 'yaml', 'yml', 'xml'] }
];

let mainWindow: BrowserWindow | null = null;

/**
 * Creates the main application window with secure settings.
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      // Security: Enable context isolation for IPC security
      contextIsolation: true,
      // Security: Disable node integration in renderer
      nodeIntegration: false,
      // Security: Enable sandboxing
      sandbox: true,
      // Load preload script for secure IPC bridge
      preload: join(__dirname, 'preload.js')
    }
  });

  // Load the renderer HTML
  mainWindow.loadFile(join(__dirname, 'index.html'));

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Extracts filename from a file path.
 * @param filePath - Full file path
 * @returns The filename portion of the path
 */
function extractFileName(filePath: string): string {
  return filePath.split(/[/\\]/).pop() || 'untitled';
}

/**
 * Type guard to check if an error has a message property.
 * @param error - The error to check
 * @returns True if error has a message property
 */
function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

/**
 * Gets error message from unknown error type.
 * @param error - The error to extract message from
 * @returns The error message string
 */
function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return String(error);
}

/**
 * IPC Handler: Open File
 * Shows native file picker and reads the selected file.
 * @returns Promise resolving to file info or null if cancelled
 */
ipcMain.handle('open-file', async (): Promise<FileOpenResult | null> => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: FILE_FILTERS
  });

  // User cancelled the dialog
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];

  try {
    const content = await readFile(filePath, 'utf8');
    const name = extractFileName(filePath);

    return {
      path: filePath,
      content,
      name
    };
  } catch (err: unknown) {
    // Handle file read errors
    throw new Error(`Failed to read file: ${getErrorMessage(err)}`);
  }
});

/**
 * IPC Handler: Save File
 * Saves content to a file, showing save dialog if no path provided.
 * @param _event - IPC event (unused)
 * @param payload - The save payload containing path and content
 * @returns Promise resolving to file info or null if cancelled
 */
ipcMain.handle(
  'save-file',
  async (_event: IpcMainInvokeEvent, { path: filePath, content }: SaveFilePayload): Promise<FileSaveResult | null> => {
    let targetPath = filePath;

    // If no path provided, show save dialog for new file
    if (!targetPath) {
      const result = await dialog.showSaveDialog(mainWindow!, {
        defaultPath: 'untitled.txt',
        filters: FILE_FILTERS
      });

      // User cancelled the dialog
      if (result.canceled || !result.filePath) {
        return null;
      }

      targetPath = result.filePath;
    }

    try {
      await writeFile(targetPath, content, 'utf8');
      const name = extractFileName(targetPath);

      return {
        path: targetPath,
        name
      };
    } catch (err: unknown) {
      // Handle file write errors
      throw new Error(`Failed to save file: ${getErrorMessage(err)}`);
    }
  }
);

/**
 * IPC Handler: Save File As
 * Always shows save dialog regardless of existing path.
 * @param _event - IPC event (unused)
 * @param payload - The save payload containing content and optional suggested name
 * @returns Promise resolving to file info or null if cancelled
 */
ipcMain.handle(
  'save-file-as',
  async (_event: IpcMainInvokeEvent, { content, suggestedName }: SaveFileAsPayload): Promise<FileSaveResult | null> => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      defaultPath: suggestedName || 'untitled.txt',
      filters: FILE_FILTERS
    });

    // User cancelled the dialog
    if (result.canceled || !result.filePath) {
      return null;
    }

    const targetPath = result.filePath;

    try {
      await writeFile(targetPath, content, 'utf8');
      const name = extractFileName(targetPath);

      return {
        path: targetPath,
        name
      };
    } catch (err: unknown) {
      // Handle file write errors
      throw new Error(`Failed to save file: ${getErrorMessage(err)}`);
    }
  }
);

// Application lifecycle events

app.whenReady().then(() => {
  createWindow();

  // On macOS, re-create window when dock icon is clicked and no windows exist
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
