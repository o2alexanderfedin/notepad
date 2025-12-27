/**
 * Electron Main Process
 * Handles native file dialogs, IPC communication, and window management.
 * All file operations are performed in the main process for security.
 */

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Get the directory path of the current module (ES modules compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * File filter configurations for native file dialogs.
 * Supports common text and code file types.
 */
const FILE_FILTERS = [
  { name: 'All Files', extensions: ['*'] },
  { name: 'Text Files', extensions: ['txt'] },
  { name: 'JavaScript', extensions: ['js', 'mjs', 'cjs', 'jsx'] },
  { name: 'TypeScript', extensions: ['ts', 'tsx'] },
  { name: 'Python', extensions: ['py'] },
  { name: 'Web Files', extensions: ['html', 'htm', 'css'] },
  { name: 'Markdown', extensions: ['md', 'markdown'] },
  { name: 'Data Files', extensions: ['json', 'yaml', 'yml', 'xml'] }
];

/** @type {BrowserWindow | null} */
let mainWindow = null;

/**
 * Creates the main application window with secure settings.
 */
function createWindow() {
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
 * IPC Handler: Open File
 * Shows native file picker and reads the selected file.
 * @returns {Promise<{path: string, content: string, name: string} | null>}
 */
ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
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
    // Extract filename from path
    const name = filePath.split(/[/\\]/).pop() || 'untitled';

    return {
      path: filePath,
      content,
      name
    };
  } catch (err) {
    // Handle file read errors
    throw new Error(`Failed to read file: ${err.message}`);
  }
});

/**
 * IPC Handler: Save File
 * Saves content to a file, showing save dialog if no path provided.
 * @param {Electron.IpcMainInvokeEvent} _event - IPC event (unused)
 * @param {Object} payload - The save payload
 * @param {string | null} payload.path - Existing file path or null for new file
 * @param {string} payload.content - Content to save
 * @returns {Promise<{path: string, name: string} | null>}
 */
ipcMain.handle('save-file', async (_event, { path: filePath, content }) => {
  let targetPath = filePath;

  // If no path provided, show save dialog for new file
  if (!targetPath) {
    const result = await dialog.showSaveDialog(mainWindow, {
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
    // Extract filename from path
    const name = targetPath.split(/[/\\]/).pop() || 'untitled';

    return {
      path: targetPath,
      name
    };
  } catch (err) {
    // Handle file write errors
    throw new Error(`Failed to save file: ${err.message}`);
  }
});

/**
 * IPC Handler: Save File As
 * Always shows save dialog regardless of existing path.
 * @param {Electron.IpcMainInvokeEvent} _event - IPC event (unused)
 * @param {Object} payload - The save payload
 * @param {string} payload.content - Content to save
 * @param {string} [payload.suggestedName] - Suggested filename for the dialog
 * @returns {Promise<{path: string, name: string} | null>}
 */
ipcMain.handle('save-file-as', async (_event, { content, suggestedName }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
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
    // Extract filename from path
    const name = targetPath.split(/[/\\]/).pop() || 'untitled';

    return {
      path: targetPath,
      name
    };
  } catch (err) {
    // Handle file write errors
    throw new Error(`Failed to save file: ${err.message}`);
  }
});

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
