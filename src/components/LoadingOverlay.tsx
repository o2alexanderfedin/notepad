/**
 * LoadingOverlay Component
 * Displays a full-screen loading overlay with spinner and message.
 * Shows/hides based on Redux ui.loading state.
 */

import { useAppSelector } from '../store/hooks';

/**
 * Props for the LoadingOverlay component
 */
interface LoadingOverlayProps {
  /** Optional CSS class name */
  className?: string;
}

/**
 * LoadingOverlay component - Displays a loading indicator overlay.
 * Renders a full-screen overlay with a spinner and loading message
 * when the application is performing async operations.
 * Visibility is controlled by Redux UI state (ui.loading).
 */
export function LoadingOverlay({ className }: LoadingOverlayProps) {
  // Read loading state from Redux UI slice
  const loading = useAppSelector((state) => state.ui.loading);
  const loadingMessage = useAppSelector((state) => state.ui.loadingMessage);

  // Don't render if not loading
  if (!loading) {
    return null;
  }

  return (
    <div className={`loading-overlay${className ? ` ${className}` : ''}`}>
      <div className="loading-spinner" />
      <span className="loading-text">{loadingMessage}</span>
    </div>
  );
}

export default LoadingOverlay;
