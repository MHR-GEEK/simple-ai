// client/src/types/index.ts
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  codeBlocks?: CodeBlock[];
  images?: GeneratedImage[];
  metadata?: MessageMetadata;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  url?: string;
}

export interface CodeBlock {
  id: string;
  language: string;
  code: string;
  filename?: string;
  editable: boolean;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  revisedPrompt?: string;
  timestamp: Date;
}

export interface MessageMetadata {
  model?: string;
  tokensUsed?: number;
  processingTime?: number;
  voiceCommand?: boolean;
}

export interface GitRepository {
  id: string;
  name: string;
  fullName: string;
  description: string;
  private: boolean;
  htmlUrl: string;
  cloneUrl: string;
  defaultBranch: string;
  updatedAt: string;
  languages: Record<string, number>;
}

export interface GitFile {
  path: string;
  content: string;
  sha: string;
  size: number;
  type: 'file' | 'dir';
}

export interface GitCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  files: GitFileChange[];
}

export interface GitFileChange {
  filename: string;
  status: 'added' | 'modified' | 'removed' | 'renamed';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export interface BuildResult {
  success: boolean;
  output: string;
  errors: BuildError[];
  artifacts?: BuildArtifact[];
  duration: number;
}

export interface BuildError {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface BuildArtifact {
  name: string;
  path: string;
  size: number;
  type: string;
}

export interface VoiceCommand {
  transcript: string;
  confidence: number;
  intent: VoiceIntent;
  entities: Record<string, string>;
}

export type VoiceIntent = 
  | 'create_file'
  | 'edit_file'
  | 'delete_file'
  | 'run_code'
  | 'build_project'
  | 'commit_changes'
  | 'create_branch'
  | 'merge_branch'
  | 'generate_image'
  | 'analyze_code'
  | 'refactor_code'
  | 'write_tests'
  | 'document_code'
  | 'search_code'
  | 'navigate_file'
  | 'toggle_feature'
  | 'settings'
  | 'help'
  | 'unknown';

export interface APIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  stream: boolean;
}

export interface UserSettings {
  apiConfig: APIConfig;
  theme: 'light' | 'dark' | 'system';
  voiceEnabled: boolean;
  voiceLanguage: string;
  autoSave: boolean;
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  gitAutoFetch: boolean;
  notifications: boolean;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  description: string;
  gitRepo?: GitRepository;
  files: ProjectFile[];
  createdAt: Date;
  updatedAt: Date;
  lastOpenedAt: Date;
}

export interface ProjectFile {
  path: string;
  name: string;
  content: string;
  language: string;
  size: number;
  modified: boolean;
  isNew: boolean;
  isBinary: boolean;
}
