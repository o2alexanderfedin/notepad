import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Vite configuration for browser development
 * Serves the notepad app from src/browser directory
 */
export default defineConfig({
  // Root directory for the browser application
  root: 'src/browser',

  // Public directory (relative to project root, not Vite root)
  publicDir: resolve(__dirname, 'public'),

  // Development server configuration
  server: {
    port: 5173,
    open: true,
    // Strict port - fail if port is already in use
    strictPort: true,
  },

  // Build configuration
  build: {
    // Output to dist/browser directory (relative to project root)
    outDir: resolve(__dirname, 'dist/browser'),
    // Empty output directory before build
    emptyOutDir: true,
    // Generate source maps for debugging
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/browser/index.html'),
      },
    },
  },

  // Resolve configuration
  resolve: {
    alias: {
      // Alias for shared modules
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },

  // Define global constants
  define: {
    // Flag to identify browser environment at build time
    '__IS_BROWSER__': true,
  },
});
