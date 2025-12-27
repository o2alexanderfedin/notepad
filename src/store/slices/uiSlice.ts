import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * UI state interface
 * Manages application-wide UI state like loading, preview visibility, and status messages
 */
export interface UiState {
  /** Whether the loading overlay is visible */
  loading: boolean;
  /** The message to display in the loading overlay */
  loadingMessage: string;
  /** Whether the syntax highlighting preview panel is visible */
  previewVisible: boolean;
  /** The status bar message */
  status: string;
}

/**
 * Initial state for the UI slice
 * Matches the default UI state from the original app.js
 */
const initialState: UiState = {
  loading: false,
  loadingMessage: 'Loading...',
  previewVisible: false,
  status: 'Ready',
};

/**
 * UI slice for managing application UI state
 * Handles loading overlay, preview panel, and status bar
 */
export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    /**
     * Sets the loading state with an optional message
     * @param state - Current UI state
     * @param action - Action with loading boolean and optional message
     */
    setLoading(state, action: PayloadAction<{ loading: boolean; message?: string }>) {
      state.loading = action.payload.loading;
      if (action.payload.message !== undefined) {
        state.loadingMessage = action.payload.message;
      } else if (action.payload.loading) {
        // Reset to default message when loading starts without custom message
        state.loadingMessage = 'Loading...';
      }
    },

    /**
     * Shows the loading overlay with a custom message
     * @param state - Current UI state
     * @param action - Action with loading message string
     */
    showLoading(state, action: PayloadAction<string>) {
      state.loading = true;
      state.loadingMessage = action.payload;
    },

    /**
     * Hides the loading overlay
     * @param state - Current UI state
     */
    hideLoading(state) {
      state.loading = false;
    },

    /**
     * Sets the preview panel visibility
     * @param state - Current UI state
     * @param action - Action with visibility boolean
     */
    setPreviewVisible(state, action: PayloadAction<boolean>) {
      state.previewVisible = action.payload;
    },

    /**
     * Toggles the preview panel visibility
     * @param state - Current UI state
     */
    togglePreview(state) {
      state.previewVisible = !state.previewVisible;
    },

    /**
     * Sets the status bar message
     * @param state - Current UI state
     * @param action - Action with status message string
     */
    setStatus(state, action: PayloadAction<string>) {
      state.status = action.payload;
    },
  },
});

// Export actions for use in components
export const {
  setLoading,
  showLoading,
  hideLoading,
  setPreviewVisible,
  togglePreview,
  setStatus,
} = uiSlice.actions;

// Export reducer for store configuration
export default uiSlice.reducer;
