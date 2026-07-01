// client/src/components/Layout/Sidebar.tsx
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, FileText, GitBranch, Terminal, Settings,
  ChevronRight, ChevronLeft, X
} from 'lucide-react';
import { cn } from '../../utils/helpers';

interface SidebarProps {
  activePanel: 'chat' | 'files' | 'git' | 'terminal' | 'settings';
  onPanelChange: (panel: 'chat' | 'files' | 'git' | 'terminal' | 'settings') => void;
  onClose: () => void;
  children?: ReactNode;
}

const panels = [
  { id: 'chat', icon: Bot, label: 'AI Chat' },
  { id: 'files', icon: FileText, label: 'Files' },
  { id: 'git', icon: GitBranch, label: 'Git' },
  { id: 'terminal', icon: Terminal, label: 'Terminal' },
  { id: 'settings', icon: Settings, label: 'Settings' },
] as const;

export function Sidebar({ activePanel, onPanelChange, onClose, children }: SidebarProps) {
  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      exit={{ x: -280 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed left-0 top-0 z-40 h-full w-72 bg-background dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col"
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          AI Dev Platform
        </h1>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {panels.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onPanelChange(id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              activePanel === id
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{label}</span>
            {activePanel === id && <ChevronRight className="ml-auto w-4 h-4" />}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        {children}
      </div>
    </motion.aside>
  );
}
