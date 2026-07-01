import { forwardRef, useImperativeHandle } from 'react';
import { Sun, Moon, Monitor, Menu, Bell, Github, User, LogOut, Settings } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { cn } from '../../utils/helpers';

interface HeaderProps { onMenuClick: () => void; onThemeToggle: () => void; theme: 'light' | 'dark' | 'system'; sidebarOpen: boolean; }

export const Header = forwardRef<HTMLDivElement, HeaderProps>(({ onMenuClick, onThemeToggle, theme, sidebarOpen }, ref) => {
  const { state, dispatch } = useApp();
  useImperativeHandle(ref, () => ({ getHeight: () => ref.current?.offsetHeight || 60 }));

  const icons = { light: <Sun className="w-5 h-5" />, dark: <Moon className="w-5 h-5" />, system: <Monitor className="w-5 h-5" /> };

  return (
    <div ref={ref} className={cn('fixed top-0 left-0 right-0 z-30 h-16 bg-background/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4', sidebarOpen ? 'lg:ml-72' : 'ml-0')}>
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Toggle menu"><Menu className="w-6 h-6" /></button>
        <h1 className="text-lg font-semibold hidden sm:block">AI Dev Platform</h1>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onThemeToggle} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800" aria-label={`Theme: ${theme}`}>{icons[theme]}</button>
        <div className="relative group">
          <button className="flex items-center gap-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-medium">{state.user?.name?.[0] || 'U'}</div>
            <span className="hidden md:block text-sm font-medium">{state.user?.name || 'Guest'}</span>
          </button>
          <div className="absolute right-0 top-full mt-2 w-48 bg-background dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-1 z-50">
            {state.user ? (
              <>
                <>
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700"><p className="text-sm font-medium">{state.user.name}</p><p className="text-xs text-gray-500">{state.user.email}</p></div>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"><Settings className="w-4 h-4" />Settings</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"><LogOut className="w-4 h-4" />Sign Out</button>
                </>
              ) : (
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"><Github className="w-4 h-4" />Sign in with GitHub</button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
});
Header.displayName = 'Header';
