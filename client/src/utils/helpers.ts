import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { VoiceCommand, VoiceIntent, CodeBlock, GeneratedImage } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getLanguageFromFilename(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
    py: 'python', rs: 'rust', go: 'go', java: 'java', cpp: 'cpp', c: 'c',
    cs: 'csharp', php: 'php', rb: 'ruby', swift: 'swift', kt: 'kotlin',
    scala: 'scala', html: 'html', css: 'css', scss: 'scss', json: 'json',
    yaml: 'yaml', yml: 'yaml', md: 'markdown', sql: 'sql', sh: 'bash',
    bash: 'bash', zsh: 'bash', fish: 'bash', dockerfile: 'dockerfile',
    tf: 'terraform', vue: 'vue', svelte: 'svelte', astro: 'astro',
  };
  return languageMap[extension || ''] || 'plaintext';
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function parseVoiceCommand(transcript: string): VoiceCommand {
  const lower = transcript.toLowerCase().trim();
  
  const intents: Record<string, VoiceIntent> = {
    'create file': 'create_file', 'new file': 'create_file', 'make file': 'create_file',
    'edit file': 'edit_file', 'modify file': 'edit_file', 'change file': 'edit_file',
    'delete file': 'delete_file', 'remove file': 'delete_file',
    'run code': 'run_code', 'execute code': 'run_code',
    'build project': 'build_project', 'build': 'build_project', 'compile': 'build_project',
    'commit changes': 'commit_changes', 'commit': 'commit_changes', 'save changes': 'commit_changes',
    'create branch': 'create_branch', 'new branch': 'create_branch',
    'merge branch': 'merge_branch', 'merge': 'merge_branch',
    'generate image': 'generate_image', 'create image': 'generate_image', 'make image': 'generate_image',
    'analyze code': 'analyze_code', 'review code': 'analyze_code',
    'refactor code': 'refactor_code', 'improve code': 'refactor_code',
    'write tests': 'write_tests', 'create tests': 'write_tests',
    'document code': 'document_code', 'add comments': 'document_code',
    'search code': 'search_code', 'find code': 'search_code',
    'go to file': 'navigate_file', 'open file': 'navigate_file',
    'toggle': 'toggle_feature', 'enable': 'toggle_feature', 'disable': 'toggle_feature',
    'settings': 'settings', 'preferences': 'settings',
    'help': 'help', 'what can you do': 'help',
  };

  let intent: VoiceIntent = 'unknown';
  let matchedPhrase = '';
  
  for (const [phrase, intentValue] of Object.entries(intents)) {
    if (lower.includes(phrase)) {
      intent = intentValue;
      matchedPhrase = phrase;
      break;
    }
  }

  const entities: Record<string, string> = {};
  
  const fileMatches = transcript.match(/(?:file|called|named)\s+["']?([\w\-./]+\.\w+)["']?/gi);
  if (fileMatches) {
    entities.filename = fileMatches[0].replace(/(?:file|called|named)\s+["']?/i, '').replace(/["']?$/, '').trim();
  }

  const branchMatches = transcript.match(/(?:branch|called|named)\s+["']?([\w\-/]+)["']?/gi);
  if (branchMatches) {
    entities.branchName = branchName = branchMatches[0].replace(/(?:branch|called|named)\s+["']?/i, '').replace(/["']?$/, '').trim();
  }

  const commitMatches = transcript.match(/(?:message|with)\s+["']([^"']+)["']/gi);
  if (commitMatches) {
    entities.commitMessage = commitMatches[0].replace(/(?:message|with)\s+["']/, '').replace(/["']$/, '').trim();
  }

  const imageMatches = transcript.match(/(?:image|picture|photo|draw|generate)\s+(?:of|for|about)?\s*["']?([^"']+)["']?/gi);
  if (imageMatches) {
    entities.prompt = imageMatches[0].replace(/(?:image|picture|photo|draw|generate)\s+(?:of|for|about)?\s*["']?/i, '').replace(/["']?$/, '').trim();
  }

  return { transcript, confidence: matchedPhrase ? 0.8 : 0.3, intent, entities };
}

export function extractCodeBlocks(content: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    blocks.push({ id: generateId(), language: match[1] || 'plaintext', code: match[2].trim(), editable: true });
  }
  return blocks;
}

export function extractImages(content: string): GeneratedImage[] {
  const images: GeneratedImage[] = [];
  const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    images.push({ id: generateId(), url: match[2], prompt: match[1] || 'Generated image', timestamp: new Date() });
  }
  return images;
}
