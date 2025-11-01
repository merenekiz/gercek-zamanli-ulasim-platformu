import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface UIState {
  toasts: Toast[];
  isSidebarOpen: boolean;
  isMapFullscreen: boolean;
  theme: 'light' | 'dark';
}

const initialState: UIState = {
  toasts: [],
  isSidebarOpen: true,
  isMapFullscreen: false,
  theme: 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const toast: Toast = {
        ...action.payload,
        id: `toast-${Date.now()}-${Math.random()}`,
      };
      state.toasts.push(toast);
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },
    toggleMapFullscreen: (state) => {
      state.isMapFullscreen = !state.isMapFullscreen;
    },
    setMapFullscreen: (state, action: PayloadAction<boolean>) => {
      state.isMapFullscreen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
  },
});

export const {
  addToast,
  removeToast,
  clearToasts,
  toggleSidebar,
  setSidebarOpen,
  toggleMapFullscreen,
  setMapFullscreen,
  setTheme,
} = uiSlice.actions;

// Helper function for showing toasts (alias for addToast)
export const showToast = addToast;

export default uiSlice.reducer;
