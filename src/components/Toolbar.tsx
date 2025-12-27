/**
 * Toolbar Component
 * Header component with file operations buttons and document info display.
 * Integrates with Redux for state management.
 */

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { togglePreview } from '../store/slices/uiSlice';

/**
 * Props for the Toolbar component
 */
interface ToolbarProps {
  /** Optional CSS class name for the toolbar */
  className?: string;
  /** Callback when Open File button is clicked */
  onOpenFile?: () => void;
  /** Callback when Save button is clicked */
  onSave?: () => void;
  /** Callback when Save As button is clicked */
  onSaveAs?: () => void;
}

/**
 * Toolbar component - Application header with file operations and document info.
 * Displays app title, file name, modified indicator, and action buttons.
 */
export function Toolbar({
  className = 'toolbar',
  onOpenFile,
  onSave,
  onSaveAs,
}: ToolbarProps) {
  const dispatch = useAppDispatch();
  const fileName = useAppSelector((state) => state.editor.fileName);
  const isModified = useAppSelector((state) => state.editor.isModified);
  const previewVisible = useAppSelector((state) => state.ui.previewVisible);

  /**
   * Handles Open File button click.
   */
  const handleOpenFile = useCallback(() => {
    if (onOpenFile) {
      onOpenFile();
    }
  }, [onOpenFile]);

  /**
   * Handles Save button click.
   */
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave();
    }
  }, [onSave]);

  /**
   * Handles Save As button click.
   */
  const handleSaveAs = useCallback(() => {
    if (onSaveAs) {
      onSaveAs();
    }
  }, [onSaveAs]);

  /**
   * Handles Preview toggle button click.
   */
  const handleTogglePreview = useCallback(() => {
    dispatch(togglePreview());
  }, [dispatch]);

  return (
    <header className={className}>
      <div className="toolbar-left">
        <h1 className="app-title">Notepad</h1>
        <span id="file-name" className="file-name">
          {fileName}
        </span>
        {isModified && (
          <span id="modified-indicator" className="modified-indicator">
            *
          </span>
        )}
      </div>
      <div className="toolbar-right">
        <button
          id="btn-open"
          type="button"
          className="btn btn-primary"
          onClick={handleOpenFile}
        >
          <span className="btn-icon" aria-hidden="true">
            &#128194;
          </span>
          Open File
        </button>
        <button
          id="btn-save"
          type="button"
          className="btn btn-secondary"
          onClick={handleSave}
        >
          <span className="btn-icon" aria-hidden="true">
            &#128190;
          </span>
          Save
        </button>
        <button
          id="btn-save-as"
          type="button"
          className="btn btn-secondary"
          onClick={handleSaveAs}
        >
          <span className="btn-icon" aria-hidden="true">
            &#128190;
          </span>
          Save As
        </button>
        <button
          id="btn-toggle-preview"
          type="button"
          className={`btn btn-secondary${previewVisible ? ' btn-active' : ''}`}
          onClick={handleTogglePreview}
          aria-pressed={previewVisible}
        >
          <span className="btn-icon" aria-hidden="true">
            &#128065;
          </span>
          Preview
        </button>
      </div>
    </header>
  );
}

export default Toolbar;
