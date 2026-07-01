// client/src/components/Layout/PanelContent.tsx
import { ReactNode } from 'react';
import { ChatPanel } from '../chat/ChatPanel';
import { FilesPanel } from '../files/FilesPanel';
import { GitPanel } from '../git/GitPanel';
import { TerminalPanel } from '../terminal/TerminalPanel';
import { SettingsPanel } from '../settings/SettingsPanel';

interface PanelContentProps {
  activePanel: 'chat' | 'files' | 'git' | 'terminal' | 'settings';
  children: ReactNode;
}

export function PanelContent({ activePanel, children }: PanelContentProps) {
  const panels = {
    chat: <ChatPanel />,
    files: <FilesPanel />,
    git: <GitPanel />,
    terminal: <TerminalPanel />,
    settings: <SettingsPanel />,
  };

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {panels[activePanel]}
      <div className="absolute inset-0 pointer-events-none">
        {children}
      </div>
    </div>
  );
}
