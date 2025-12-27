/**
 * Shared Editor Module
 * Provides syntax highlighting functionality using Highlight.js.
 * Used by both browser and Electron versions of the application.
 */

// Import highlight.js core and common languages
import hljs from 'highlight.js/lib/core';

// Import commonly used languages to reduce bundle size
// This includes the 10+ languages mentioned in the spec
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import html from 'highlight.js/lib/languages/xml'; // XML includes HTML
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import java from 'highlight.js/lib/languages/java';
import csharp from 'highlight.js/lib/languages/csharp';
import cpp from 'highlight.js/lib/languages/cpp';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import yaml from 'highlight.js/lib/languages/yaml';
import ruby from 'highlight.js/lib/languages/ruby';
import php from 'highlight.js/lib/languages/php';

// Register languages with highlight.js
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('xml', html);
hljs.registerLanguage('html', html);
hljs.registerLanguage('css', css);
hljs.registerLanguage('json', json);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('java', java);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c', cpp);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('php', php);

/**
 * Map of file extensions to highlight.js language names.
 * Used for explicit language detection based on file name.
 */
const EXTENSION_TO_LANGUAGE = {
  // JavaScript/TypeScript
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',

  // Web technologies
  '.html': 'html',
  '.htm': 'html',
  '.xml': 'xml',
  '.svg': 'xml',
  '.css': 'css',
  '.scss': 'css',
  '.less': 'css',

  // Data formats
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',

  // Documentation
  '.md': 'markdown',
  '.markdown': 'markdown',

  // Shell scripting
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',

  // Programming languages
  '.py': 'python',
  '.java': 'java',
  '.cs': 'csharp',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.c': 'c',
  '.h': 'cpp',
  '.hpp': 'cpp',
  '.go': 'go',
  '.rs': 'rust',
  '.rb': 'ruby',
  '.php': 'php',

  // Database
  '.sql': 'sql'
};

/**
 * Default debounce delay in milliseconds.
 * Used to prevent excessive highlighting calls during rapid typing.
 */
const DEFAULT_DEBOUNCE_DELAY = 300;

/**
 * Debounce timer reference.
 */
let debounceTimer = null;

/**
 * Extracts the file extension from a file name.
 * @param {string} fileName - The file name or path
 * @returns {string|null} The file extension (including dot) or null
 */
function getFileExtension(fileName) {
  if (!fileName || typeof fileName !== 'string') {
    return null;
  }
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1 || lastDot === fileName.length - 1) {
    return null;
  }
  return fileName.slice(lastDot).toLowerCase();
}

/**
 * Gets the language hint based on file extension.
 * @param {string} fileName - The file name or path
 * @returns {string|null} The highlight.js language name or null
 */
function getLanguageFromFileName(fileName) {
  const extension = getFileExtension(fileName);
  if (!extension) {
    return null;
  }
  return EXTENSION_TO_LANGUAGE[extension] || null;
}

/**
 * Highlights code using Highlight.js.
 * Uses explicit language if provided, otherwise auto-detects.
 *
 * @param {string} code - The code to highlight
 * @param {string|null} language - Optional language hint (from file extension)
 * @returns {{ value: string, language: string }} The highlighted HTML and detected language
 */
function highlightCode(code, language = null) {
  if (!code || typeof code !== 'string') {
    return { value: '', language: 'plaintext' };
  }

  try {
    if (language && hljs.getLanguage(language)) {
      // Use explicit language hint for better accuracy
      const result = hljs.highlight(code, { language });
      return {
        value: result.value,
        language: result.language || language
      };
    }

    // Use auto-detection when no language hint provided
    const result = hljs.highlightAuto(code);
    return {
      value: result.value,
      language: result.language || 'plaintext'
    };
  } catch (err) {
    // Fallback to plain text on error
    return {
      value: escapeHtml(code),
      language: 'plaintext'
    };
  }
}

/**
 * Escapes HTML special characters for safe display.
 * @param {string} text - The text to escape
 * @returns {string} The escaped HTML string
 */
function escapeHtml(text) {
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, char => htmlEscapes[char]);
}

/**
 * Applies syntax highlighting to a DOM element.
 * @param {HTMLElement} element - The element to highlight (should be a <code> element)
 * @param {string} code - The code to highlight
 * @param {string|null} fileName - Optional file name for language detection
 */
function applyHighlightToElement(element, code, fileName = null) {
  if (!element) {
    return;
  }

  const language = getLanguageFromFileName(fileName);
  const result = highlightCode(code, language);

  // Apply highlighted HTML
  element.innerHTML = result.value;

  // Set language class for styling
  element.className = element.className.replace(/\bhljs\s*|\blanguage-\S+\s*/g, '').trim();
  element.classList.add('hljs');
  if (result.language && result.language !== 'plaintext') {
    element.classList.add(`language-${result.language}`);
  }

  return result.language;
}

/**
 * Creates a debounced version of the highlight update function.
 * Prevents excessive DOM updates during rapid typing.
 *
 * @param {Function} callback - The function to debounce
 * @param {number} delay - The debounce delay in milliseconds
 * @returns {Function} The debounced function
 */
function debounce(callback, delay = DEFAULT_DEBOUNCE_DELAY) {
  return function (...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => callback.apply(this, args), delay);
  };
}

/**
 * Creates an editor highlight manager for a specific set of DOM elements.
 * Manages syntax highlighting with debouncing for the editor.
 *
 * @param {Object} config - Configuration object
 * @param {HTMLElement} config.codeElement - The <code> element for highlighted output
 * @param {HTMLElement} config.languageIndicator - Element to display detected language
 * @param {number} config.debounceDelay - Debounce delay in milliseconds
 * @returns {Object} Manager with update and destroy methods
 */
function createEditorHighlightManager(config = {}) {
  const {
    codeElement = null,
    languageIndicator = null,
    debounceDelay = DEFAULT_DEBOUNCE_DELAY
  } = config;

  let currentFileName = null;

  /**
   * Updates the syntax highlighting display.
   * @param {string} code - The code to highlight
   * @param {string|null} fileName - Optional file name for language hints
   */
  function update(code, fileName = null) {
    currentFileName = fileName || currentFileName;

    if (!codeElement) {
      return;
    }

    const language = applyHighlightToElement(codeElement, code, currentFileName);

    // Update language indicator if provided
    if (languageIndicator) {
      languageIndicator.textContent = language || 'Plain Text';
    }
  }

  // Create debounced update function
  const debouncedUpdate = debounce(update, debounceDelay);

  /**
   * Immediately updates without debouncing.
   * Useful for file open operations.
   */
  function updateImmediate(code, fileName = null) {
    update(code, fileName);
  }

  /**
   * Updates with debouncing.
   * Useful for live typing updates.
   */
  function updateDebounced(code, fileName = null) {
    currentFileName = fileName || currentFileName;
    debouncedUpdate(code, fileName);
  }

  /**
   * Sets the current file name for language detection.
   */
  function setFileName(fileName) {
    currentFileName = fileName;
  }

  /**
   * Cleans up resources.
   */
  function destroy() {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  return {
    update: updateImmediate,
    updateDebounced,
    setFileName,
    destroy
  };
}

/**
 * Gets the list of supported languages.
 * @returns {string[]} Array of supported language names
 */
function getSupportedLanguages() {
  return hljs.listLanguages();
}

// Export public API
export {
  highlightCode,
  applyHighlightToElement,
  getLanguageFromFileName,
  getFileExtension,
  createEditorHighlightManager,
  getSupportedLanguages,
  debounce,
  DEFAULT_DEBOUNCE_DELAY,
  EXTENSION_TO_LANGUAGE
};

// Export hljs for direct access if needed
export { hljs };
