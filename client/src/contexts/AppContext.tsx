import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import type { UserSettings, Notification } from '../types';
import { api } from '../services/api';

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

const defaultSettings: UserSettings = {
  apiConfig: { baseUrl: '', apiKey: '', model: 'nvidia/nemotron-3-ultra-550b-a55b', temperature: 1, maxTokens: 16384, stream: true },
  theme: 'system', voiceEnabled: true, voiceLanguage: 'en-US', autoSave: true,
  fontSize: 14, tabSize: 2, wordWrap: true, minimap: true, gitAutoFetch: true, notifications: true,
};

const initialState: AppState = { user: null, settings: defaultSettings, sidebarOpen: true, activePanel: 'chat', notifications: [] };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER': return { ...state, user: action.payload };
    case 'SET_SETTINGS': return { ...state, settings: action.payload };
    case 'UPDATE_SETTING': return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'TOGGLE_SIDEBAR': return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_ACTIVE_PANEL': return { ...state, activePanel: action.payload };
    case 'ADD_NOTIFICATION': return { ...state, notifications: [...state.notifications, action.payload] };
    case 'REMOVE_NOTIFICATION': return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) };
    default: return state;
  }
}

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<AppAction>; addNotification: (n: Omit<Notification, 'id'>) => void; initializeApp: () => Promise<void> } | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const addNotification = (n: Omit<Notification, 'id'>) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    dispatch({ type: 'ADD_NOTIFICATION', payload: { ...n, id } });
    if (n.duration !== 0) setTimeout(() => dispatch({ type: 'REMOVE_NOTIFICATION', payload: id }), n.duration || 5000);
  };

  const initializeApp = async () => {
    try {
      const saved = localStorage.getItem('ai-dev-platform-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'SET_SETTINGS', payload: { ...defaultSettings, ...parsed } });
        applyTheme(parsed.theme || 'system');
        if (parsed.apiConfig?.baseUrl) api.client.defaults.baseURL = `${parsed.apiConfig.baseUrl}/api`;
        if (parsed.apiConfig?.apiKey) api.setAuthToken(parsed.apiConfig.apiKey);
      }
    } catch (e) { console.error('Init failed', e); }
  };

  useEffect(() => { initializeApp(); }, []);
  useEffect(() => { localStorage.setItem('ai-dev-platform-settings', JSON.stringify(state.settings)); applyTheme(state.settings.theme); }, [state.settings]);

  const applyTheme = (theme: UserSettings['theme']) => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  };

  return <AppContext.Provider value={{ state, dispatch, addNotification, initializeApp }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
