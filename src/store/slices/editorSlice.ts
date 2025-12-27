import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Editor state interface
 * Manages the core editor content and file metadata
 */
export interface EditorState {
  /** The current content of the editor */
  content: string;
  /** The name of the currently open file */
  fileName: string;
  /** Whether the document has unsaved modifications */
  isModified: boolean;
}

/**
 * Initial state for the editor slice
 * Matches the default values from the original app.js appState
 */
const initialState: EditorState = {
  content: '',
  fileName: 'Untitled',
  isModified: false,
};

/**
 * Editor slice for managing editor state
 * Handles content updates, file name changes, and modification tracking
 */
export const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    /**
     * Sets the editor content
     * @param state - Current editor state
     * @param action - Action with new content string
     */
    setContent(state, action: PayloadAction<string>) {
      state.content = action.payload;
    },

    /**
     * Sets the file name
     * @param state - Current editor state
     * @param action - Action with new file name string
     */
    setFileName(state, action: PayloadAction<string>) {
      state.fileName = action.payload;
    },

    /**
     * Sets the modified flag
     * @param state - Current editor state
     * @param action - Action with modified boolean
     */
    setModified(state, action: PayloadAction<boolean>) {
      state.isModified = action.payload;
    },

    /**
     * Updates content and marks document as modified
     * Convenience action for editor input handling
     * @param state - Current editor state
     * @param action - Action with new content string
     */
    updateContent(state, action: PayloadAction<string>) {
      state.content = action.payload;
      state.isModified = true;
    },

    /**
     * Opens a new file - sets content, file name, and clears modified flag
     * @param state - Current editor state
     * @param action - Action with file content and name
     */
    openFile(state, action: PayloadAction<{ content: string; fileName: string }>) {
      state.content = action.payload.content;
      state.fileName = action.payload.fileName;
      state.isModified = false;
    },

    /**
     * Marks file as saved - clears modified flag and optionally updates file name
     * @param state - Current editor state
     * @param action - Action with optional new file name
     */
    fileSaved(state, action: PayloadAction<{ fileName?: string }>) {
      state.isModified = false;
      if (action.payload.fileName) {
        state.fileName = action.payload.fileName;
      }
    },

    /**
     * Resets editor to initial state (new file)
     * @param state - Current editor state
     */
    newFile(state) {
      state.content = '';
      state.fileName = 'Untitled';
      state.isModified = false;
    },
  },
});

// Export actions for use in components
export const {
  setContent,
  setFileName,
  setModified,
  updateContent,
  openFile,
  fileSaved,
  newFile,
} = editorSlice.actions;

// Export reducer for store configuration
export default editorSlice.reducer;
