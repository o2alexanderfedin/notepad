/**
 * Editor Component
 * A textarea component for editing text with cursor position tracking.
 * Integrates with Redux for state management and syntax highlighting.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateContent } from '../store/slices/editorSlice';

/**
 * Props for the Editor component
 */
interface EditorProps {
  /** Optional CSS class name */
  className?: string;
  /** Optional placeholder text */
  placeholder?: string;
  /** Callback for cursor position changes */
  onCursorChange?: (line: number, column: number) => void;
  /** Callback for content changes (for syntax highlighting updates) */
  onContentChange?: (content: string, fileName: string) => void;
}

/**
 * Calculates cursor position (line and column) from text and cursor index.
 * @param text - The full text content
 * @param cursorPos - The cursor position index
 * @returns Object with line and column numbers (1-indexed)
 */
function calculateCursorPosition(text: string, cursorPos: number): { line: number; column: number } {
  const textBeforeCursor = text.substring(0, cursorPos);
  const lines = textBeforeCursor.split('\n');
  const lineNumber = lines.length;
  const columnNumber = lines[lines.length - 1].length + 1;

  return { line: lineNumber, column: columnNumber };
}

/**
 * Editor component - A textarea with Redux state management and cursor tracking.
 * Handles text input, cursor position updates, and integrates with syntax highlighting.
 */
export function Editor({
  className,
  placeholder = 'Start typing or open a file...',
  onCursorChange,
  onContentChange,
}: EditorProps) {
  const dispatch = useAppDispatch();
  const content = useAppSelector((state) => state.editor.content);
  const fileName = useAppSelector((state) => state.editor.fileName);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Updates cursor position and notifies parent component.
   */
  const updateCursorPosition = useCallback(() => {
    if (!textareaRef.current || !onCursorChange) {
      return;
    }

    const text = textareaRef.current.value;
    const cursorPos = textareaRef.current.selectionStart;
    const { line, column } = calculateCursorPosition(text, cursorPos);

    onCursorChange(line, column);
  }, [onCursorChange]);

  /**
   * Handles text input changes.
   * Dispatches Redux action to update content and marks document as modified.
   */
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      dispatch(updateContent(newContent));

      // Notify parent about content change for syntax highlighting
      if (onContentChange) {
        onContentChange(newContent, fileName);
      }
    },
    [dispatch, fileName, onContentChange]
  );

  /**
   * Handles selection/cursor change events.
   */
  const handleSelectionChange = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement> | React.MouseEvent<HTMLTextAreaElement> | React.FocusEvent<HTMLTextAreaElement>) => {
      // Prevent unused variable warning - event is needed for handler signature
      void e;
      updateCursorPosition();
    },
    [updateCursorPosition]
  );

  /**
   * Handles keyboard events (for cursor position tracking).
   */
  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      handleSelectionChange(e);
    },
    [handleSelectionChange]
  );

  /**
   * Handles mouse click events (for cursor position tracking).
   */
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLTextAreaElement>) => {
      handleSelectionChange(e);
    },
    [handleSelectionChange]
  );

  /**
   * Handles focus events (for cursor position tracking).
   */
  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      handleSelectionChange(e);
    },
    [handleSelectionChange]
  );

  /**
   * Update cursor position when content changes from external source (e.g., file open).
   */
  useEffect(() => {
    updateCursorPosition();
  }, [content, updateCursorPosition]);

  /**
   * Notify parent about initial content for syntax highlighting.
   */
  useEffect(() => {
    if (onContentChange && content) {
      onContentChange(content, fileName);
    }
  }, [content, fileName, onContentChange]);

  return (
    <textarea
      ref={textareaRef}
      id="editor"
      className={className}
      value={content}
      onChange={handleInput}
      onKeyUp={handleKeyUp}
      onClick={handleClick}
      onFocus={handleFocus}
      placeholder={placeholder}
      spellCheck={false}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
    />
  );
}

export default Editor;
