import { ReactNode } from 'react';
import { ChatPanel } from '../chat/ChatPanel';
import { FilesPanel } from '../files/FilesPanel';
import { GitPanel } from '../git/GitPanel';
import { TerminalPanel } from '../terminal/TerminalPanel';
import { SettingsPanel } from '../settings/SettingsPanel';

interface PanelContentProps { activePanel: 'chat' | 'files' | 'git' | 'terminal' | 'settings
