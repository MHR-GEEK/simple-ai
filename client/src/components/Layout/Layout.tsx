import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Bot, FileText, GitBranch, Terminal, Settings, Mic, MicOff, Sun, Moon, Monitor, Bell, HelpCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useVoice } from '../../hooks/useVoice';
import { cn } from '../../utils/helpers';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PanelContent } from './PanelContent';
import { NotificationToast } from './NotificationToast';
import { VoiceIndicator } from './VoiceIndicator';

interface LayoutProps { children: ReactNode; }

export function Layout({ children }: LayoutProps) {
  const { state, dispatch, addNotification } = useApp();
  const [headerHeight, setHeaderHeight] = useState(60);

  const { isListening, isSupported, startListening, stopListening, toggleListening, transcript } = useVoice({
    onCommand: handleVoiceCommand, language: state.settings.voiceLanguage,
  });

  const handleVoiceCommand = (cmd: any) => {
    addNotification({ type: 'info', title: 'Voice Command', message: `"${cmd.transcript}" (${cmd.intent})` });
    switch (cmd.intent) {
      case 'settings': dispatch({ type: 'SET_ACTIVE_PANEL', payload: 'settings' }); break;
      case 'help': addNotification({ type: 'info', title: 'Voice Commands', message: 'Try: "Create file", "Run code", "Build project", "Generate image", "Analyze code", "Settings"', duration: 10000 }); break;
      default: dispatch({ type: 'SET_ACTIVE_PANEL', payload: 'chat' }); break;
    }
  };

  const toggleTheme = () => {
    const themes: UserSettings['theme'][] = ['light', 'dark', 'system'];
    const i = themes.indexOf(state.settings.theme);
    dispatch({ type: 'UPDATE_SETTING', payload: { theme: themes[(i + 1) % 3] } });
  };

  return (
    <div className="flex h-screen bg-background dark:bg-gray-950 text-foreground dark:text-gray-100">
      <AnimatePresence mode="wait">{state.sidebarOpen && <Sidebar activePanel={state.activePanel} onPanelChange={p => dispatch({ type: 'SET_ACTIVE_PANEL', payload: p })} onClose={() => dispatch({ type: 'TOGGLE_SIDEBAR' })} />}</AnimatePresence>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })} onThemeToggle={toggleTheme} theme={state.settings.theme} sidebarOpen={state.sidebarOpen} ref={el => el && setHeaderHeight(el.offsetHeight)} />
        <main className="flex-1 flex overflow-hidden" style={{ marginTop: headerHeight }}>
          <PanelContent activePanel={state.activePanel} children={children} />
        </main>
        <VoiceIndicator isListening={isListening} isSupported={isSupported} transcript={transcript} onToggle={toggleListening} enabled={state.settings.voiceEnabled} />
      </div>
      <NotificationToast notifications={state.notifications} />
    </div>
  );
}
