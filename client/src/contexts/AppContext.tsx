// client/src/contexts/AppContext.tsx
import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import type { UserSettings, Message, Project, GitRepository } from '../types';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface AppState {
  user: { id: string; name: string; email: string; avatar: string } | null;
  settings: UserSettings;
  sidebarOpen: boolean;
  activePanel: 'chat' | 'files' | 'git' | 'terminal' | 'settings';
  notifications: Notification[];
}

type AppAction =
  | { type: 'SET_USER'; payload: AppState['user'] }
  | { type: 'SET_SETTINGS'; payload: UserSettings }
  | { type: 'UPDATE_SETTING'; payload: Partial<UserSettings> }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_ACTIVE_PANEL'; payload: AppState['activePanel'] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string };

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
}

const defaultSettings: UserSettings = {
  apiConfig: {
    baseUrl: '',
    apiKey: '',
    model: 'nemotron-3-ultra-550b-a55b',
    temperature: 0.7,
    maxTokens: 4096,
    stream: true,
  },
  theme: 'system',
  voiceEnabled: true,
  voiceLanguage: 'en-US',
  autoSave: true,
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: true,
  gitAutoFetch: true,
  notifications: true,
};

const initialState: AppState = {
  user: null,
  settings: defaultSettings,
  sidebarOpen: true,
  activePanel: 'chat',
  notifications: [],
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'UPDATE_SETTING':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_ACTIVE_PANEL':
      return { ...state, activePanel: action.payload };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] };
    case 'REMOVE_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  initializeApp: () => Promise<void>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    dispatch({ type: 'ADD_NOTIFICATION', payload: { ...notification, id } });
    
    if (notification.duration !== 0) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
      }, notification.duration || 5000);
    }
  };

  const initializeApp = async () => {
    try {
      // Load settings from localStorage first
      const savedSettings = localStorage.getItem('ai-dev-platform-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        dispatch({ type: 'SET_SETTINGS', payload: { ...defaultSettings, ...parsed } });
        
        // Apply theme
        applyTheme(parsed.theme || 'system');
      }

      // Set API config
      if (savedSettings) {
        const { apiConfig } = JSON.parse(savedSettings);
        if (apiConfig?.baseUrl) {
          api.client.defaults.baseURL = `${apiConfig.baseUrl}/api`;
        }
        if (apiConfig?.apiKey) {
          api.setAuthToken(apiConfig.apiKey);
        }
      }

      // Try to fetch user info if authenticated
      if (api.client.defaults.headers.common['Authorization']) {
        // User is logged in, could fetch profile here
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    // Persist settings to localStorage
    localStorage.setItem('ai-dev-platform-settings', JSON.stringify(state.settings));
    
    // Apply theme changes
    applyTheme(state.settings.theme);
  }, [state.settings]);

  const applyTheme = (theme: UserSettings['theme']) => {
    const root = document.documentElement;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch, addNotification, initializeApp }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
