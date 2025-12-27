import { configureStore } from '@reduxjs/toolkit';
import editorReducer from './slices/editorSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    editor: editorReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
