// client/src/components/chat/ChatPanel.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Mic, MicOff, Paperclip, Image, Code, 
  Copy, Check, X, ChevronDown, ChevronUp,
  FileText, Download, RefreshCw, Trash2
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { marked } from 'marked';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useVoice } from '../../hooks/useVoice';
import { useProjects } from '../../hooks/useProjects';
import { cn, generateId, extractCodeBlocks, extractImages, formatFileSize } from
