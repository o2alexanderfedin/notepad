/**
 * PreviewPanel Component
 * Displays syntax-highlighted preview of the editor content.
 * Uses highlight.js for syntax highlighting with debounced updates.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppSelector } from '../store/hooks';
import {
  highlightCode,
  getLanguageFromFileName,
  DEFAULT_DEBOUNCE_DELAY,
} from '../shared/editor';

/**
 * Props for the PreviewPanel component
 */
interface PreviewPanelProps {
  /** Optional CSS class name */
  className?: string;
  /** Optional debounce delay in milliseconds (default: 300) */
  debounceDelay?: number;
}

/**
 * PreviewPanel component - Displays syntax-highlighted code preview.
 * Updates highlighting when content changes, using debouncing for performance.
 * Visibility is controlled by Redux UI state.
 */
export function PreviewPanel({
  className,
  debounceDelay = DEFAULT_DEBOUNCE_DELAY,
}: PreviewPanelProps) {
  // Read state from Redux
  const content = useAppSelector((state) => state.editor.content);
  const fileName = useAppSelector((state) => state.editor.fileName);
  const previewVisible = useAppSelector((state) => state.ui.previewVisible);

  // Local state for highlighted content and detected language
  const [highlightedHtml, setHighlightedHtml] = useState<string>('');
  const [detectedLanguage, setDetectedLanguage] = useState<string>('Plain Text');

  // Ref for debounce timer
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Applies syntax highlighting to the content.
   * Gets language hint from file name, falls back to auto-detection.
   */
  const applyHighlighting = useCallback((code: string, file: string) => {
    const language = getLanguageFromFileName(file);
    const result = highlightCode(code, language);

    setHighlightedHtml(result.value);
    setDetectedLanguage(result.language === 'plaintext' ? 'Plain Text' : result.language);
  }, []);

  /**
   * Debounced highlighting update.
   * Prevents excessive processing during rapid typing.
   */
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only apply highlighting if preview is visible
    if (!previewVisible) {
      return;
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      applyHighlighting(content, fileName);
    }, debounceDelay);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [content, fileName, previewVisible, debounceDelay, applyHighlighting]);

  /**
   * Apply immediate highlighting when preview becomes visible.
   * This ensures content is highlighted immediately when panel is shown.
   */
  useEffect(() => {
    if (previewVisible && content) {
      applyHighlighting(content, fileName);
    }
  }, [previewVisible, applyHighlighting, content, fileName]);

  // Don't render if preview is not visible
  if (!previewVisible) {
    return null;
  }

  return (
    <aside className={`preview-panel${className ? ` ${className}` : ''}`}>
      <header className="preview-header">
        <span className="preview-title">Preview</span>
        <span className="language-indicator">{detectedLanguage}</span>
      </header>
      <pre className="code-preview">
        <code
          className="hljs"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      </pre>
    </aside>
  );
}

export default PreviewPanel;
