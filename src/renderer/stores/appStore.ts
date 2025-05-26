import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { AppSettings } from '@shared/types';

interface AppState {
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
  sidebarOpen: boolean;
  selectedTool: 'select' | 'pan' | 'add';
  
  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  setSidebarOpen: (open: boolean) => void;
  setSelectedTool: (tool: 'select' | 'pan' | 'add') => void;
  setError: (error: string | null) => void;
}

const defaultSettings: AppSettings = {
  theme: 'light',
  autoSave: true,
  autoSaveInterval: 5,
  defaultProcessColor: '#3b82f6',
  defaultFont: 'Inter',
  fontSize: 14,
  showGrid: true,
  snapToGrid: true,
  gridSize: 20,
};

export const useAppStore = create<AppState>()(
  immer((set) => ({
    settings: defaultSettings,
    isLoading: false,
    error: null,
    sidebarOpen: true,
    selectedTool: 'select',
    
    loadSettings: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      try {
        const result = await window.electronAPI.app.getSettings();
        if (result.success && result.data) {
          set((state) => {
            state.settings = result.data;
          });
        }
      } catch (error) {
        set((state) => {
          state.error = error.message;
        });
      } finally {
        set((state) => {
          state.isLoading = false;
        });
      }
    },
    
    updateSettings: async (newSettings: Partial<AppSettings>) => {
      set((state) => {
        state.settings = { ...state.settings, ...newSettings };
      });
      
      try {
        await window.electronAPI.app.updateSettings(newSettings);
      } catch (error) {
        set((state) => {
          state.error = error.message;
        });
      }
    },
    
    setSidebarOpen: (open: boolean) => {
      set((state) => {
        state.sidebarOpen = open;
      });
    },
    
    setSelectedTool: (tool: 'select' | 'pan' | 'add') => {
      set((state) => {
        state.selectedTool = tool;
      });
    },
    
    setError: (error: string | null) => {
      set((state) => {
        state.error = error;
      });
    },
  }))
);