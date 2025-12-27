/**
 * Browser Entry Point
 * Initializes the React 18 application using createRoot.
 * This is the main entry point loaded by index.html.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// Find the root element in the DOM
const rootElement = document.getElementById('app');

if (!rootElement) {
  throw new Error('Root element with id "app" not found in the document');
}

// Create React 18 root and render the application
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
