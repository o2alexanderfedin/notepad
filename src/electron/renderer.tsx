/**
 * Electron Renderer Entry Point
 * Initializes the React 18 application using createRoot for the Electron renderer process.
 * This is the main entry point loaded by the Electron renderer's index.html.
 *
 * The RendererApp component handles:
 * - Redux Provider setup
 * - File operations via Electron IPC
 * - Keyboard shortcuts (Ctrl/Cmd+O, Ctrl/Cmd+S, Ctrl/Cmd+Shift+S)
 * - Syntax highlighting with highlight.js
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RendererApp } from './RendererApp';

// Find the root element in the DOM
const rootElement = document.getElementById('app');

if (!rootElement) {
  throw new Error('Root element with id "app" not found in the document');
}

// Create React 18 root and render the application
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <RendererApp />
  </StrictMode>
);
