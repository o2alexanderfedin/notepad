/**
 * StatusBar Component
 * Displays the application status bar with file name, cursor position, and status message.
 * Integrates with Redux for state management.
 */

import { useAppSelector } from '../store/hooks';

/**
 * Props for the StatusBar component
 */
interface StatusBarProps {
  /** Optional CSS class name */
  className?: string;
  /** Current cursor line number (1-indexed) */
  cursorLine?: number;
  /** Current cursor column number (1-indexed) */
  cursorColumn?: number;
}

/**
 * StatusBar component - Displays status information at the bottom of the editor.
 * Shows the current status message on the left and cursor position on the right.
 * File name and modified status are displayed in the toolbar (handled separately).
 */
export function StatusBar({
  className,
  cursorLine = 1,
  cursorColumn = 1,
}: StatusBarProps) {
  // Read status from Redux UI state
  const status = useAppSelector((state) => state.ui.status);

  return (
    <footer className={`status-bar${className ? ` ${className}` : ''}`}>
      <span id="status-message" className="status-message">
        {status}
      </span>
      <span id="cursor-position" className="cursor-position">
        Ln {cursorLine}, Col {cursorColumn}
      </span>
    </footer>
  );
}

export default StatusBar;
