// client/src/services/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import type { 
  Message, 
  GitRepository, 
  GitFile, 
  GitCommit, 
  BuildResult, 
  Project, 
  ProjectFile,
  UserSettings,
  APIConfig 
} from '../types';

class APIService {
  private client: AxiosInstance;
  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken() {
    delete this.client.defaults.headers.common['Authorization'];
  }

  // Chat/Completion
  async sendMessage(
    messages: Message[], 
    options?: { 
      stream?: boolean; 
      model?: string; 
      temperature?: number; 
      maxTokens?: number;
      attachments?: File[];
    }
  ): Promise<Message | ReadableStream> {
    const formData = new FormData();
    formData.append('messages', JSON.stringify(messages));
    
    if (options?.model) formData.append('model', options.model);
    if (options?.temperature) formData.append('temperature', options.temperature.toString());
    if (options?.maxTokens) formData.append('maxTokens', options.maxTokens.toString());
    if (options?.stream) formData.append('stream', 'true');
    
    if (options?.attachments) {
      options.attachments.forEach((file, index) => {
        formData.append(`attachments`, file);
      });
    }

    const response = await this.client.post('/chat/completions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: options?.stream ? 'stream' : 'json',
    });

    return options?.stream ? response.data : response.data;
  }

  // Voice Commands
  async processVoiceCommand(audioBlob: Blob): Promise<{ transcript: string; command: any }> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'command.webm');
    const response = await this.client.post('/voice/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Git Operations
  async getRepositories(): Promise<GitRepository[]> {
    const response = await this.client.get('/git/repositories');
    return response.data;
  }

  async getRepository(owner: string, repo: string): Promise<GitRepository> {
    const response = await this.client.get(`/git/repositories/${owner}/${repo}`);
    return response.data;
  }

  async getFiles(owner: string, repo: string, path: string = '', branch?: string): Promise<GitFile[]> {
    const params = new URLSearchParams();
    if (branch) params.append('branch', branch);
    const response = await this.client.get(`/git/repositories/${owner}/${repo}/files/${path}`, { params });
    return response.data;
  }

  async getFileContent(owner: string, repo: string, path: string, branch?: string): Promise<GitFile> {
    const params = new URLSearchParams();
    if (branch) params.append('branch', branch);
    const response = await this.client.get(`/git/repositories/${owner}/${repo}/files/content/${path}`, { params });
    return response.data;
  }

  async createOrUpdateFile(
    owner: string, 
    repo: string, 
    path: string, 
    content: string, 
    message: string, 
    branch?: string,
    sha?: string
  ): Promise<{ commit: GitCommit; file: GitFile }> {
    const response = await this.client.put(`/git/repositories/${owner}/${repo}/files/${path}`, {
      content,
      message,
      branch,
      sha,
    });
    return response.data;
  }

  async deleteFile(owner: string, repo: string, path: string, message: string, branch?: string, sha?: string): Promise<GitCommit> {
    const response = await this.client.delete(`/git/repositories/${owner}/${repo}/files/${path}`, {
      data: { message, branch, sha },
    });
    return response.data;
  }

  async getCommits(owner: string, repo: string, branch?: string, limit: number = 50): Promise<GitCommit[]> {
    const params = new URLSearchParams();
    if (branch) params.append('branch', branch);
    params.append('limit', limit.toString());
    const response = await this.client.get(`/git/repositories/${owner}/${repo}/commits`, { params });
    return response.data;
  }

  async createBranch(owner: string, repo: string, branchName: string, fromBranch?: string): Promise<GitCommit> {
    const response = await this.client.post(`/git/repositories/${owner}/${repo}/branches`, {
      name: branchName,
      fromBranch,
    });
    return response.data;
  }

  async mergeBranch(owner: string, repo: string, sourceBranch: string, targetBranch: string, message?: string): Promise<GitCommit> {
    const response = await this.client.post(`/git/repositories/${owner}/${repo}/merge`, {
      sourceBranch,
      targetBranch,
      message,
    });
    return response.data;
  }

  // Build & Execute
  async buildProject(projectId: string, config?: any): Promise<BuildResult> {
    const response = await this.client.post(`/projects/${projectId}/build`, config);
    return response.data;
  }

  async executeCode(code: string, language: string, files?: Record<string, string>): Promise<BuildResult> {
    const response = await this.client.post('/execute', { code, language, files });
    return response.data;
  }

  // File Operations
  async uploadFiles(projectId: string, files: File[]): Promise<ProjectFile[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const response = await this.client.post(`/projects/${projectId}/files/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async readFile(projectId: string, path: string): Promise<ProjectFile> {
    const response = await this.client.get(`/projects/${projectId}/files/${path}`);
    return response.data;
  }

  async writeFile(projectId: string, path: string, content: string): Promise<ProjectFile> {
    const response = await this.client.put(`/projects/${projectId}/files/${path}`, { content });
    return response.data;
  }

  async deleteFile(projectId: string, path: string): Promise<void> {
    await this.client.delete(`/projects/${projectId}/files/${path}`);
  }

  async listFiles(projectId: string, path: string = ''): Promise<ProjectFile[]> {
    const response = await this.client.get(`/projects/${projectId}/files`, { params: { path } });
    return response.data;
  }

  // Image Generation
  async generateImage(prompt: string, options?: { size?: string; quality?: string; style?: string }): Promise<{ url: string; revisedPrompt: string }> {
    const response = await this.client.post('/images/generate', { prompt, ...options });
    return response.data;
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    const response = await this.client.get('/projects');
    return response.data;
  }

  async getProject(id: string): Promise<Project> {
    const response = await this.client.get(`/projects/${id}`);
    return response.data;
  }

  async createProject(project: Partial<Project>): Promise<Project> {
    const response = await this.client.post('/projects', project);
    return response.data;
  }

  async updateProject(id: string, project: Partial<Project>): Promise<Project> {
    const response = await this.client.put(`/projects/${id}`, project);
    return response.data;
  }

  async deleteProject(id: string): Promise<void> {
    await this.client.delete(`/projects/${id}`);
  }

  // Settings
  async getSettings(): Promise<UserSettings> {
    const response = await this.client.get('/settings');
    return response.data;
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const response = await this.client.put('/settings', settings);
    return response.data;
  }

  async testAPIConnection(config: APIConfig): Promise<{ success: boolean; latency: number }> {
    const response = await this.client.post('/settings/test-connection', config);
    return response.data;
  }

  // WebSocket for real-time updates
  connectWebSocket(onMessage: (data: any) => void): void {
    const wsUrl = (import.meta.env.VITE_WS_URL || 'ws://localhost:4000').replace('http', 'ws');
    this.ws = new WebSocket(`${wsUrl}/ws`);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...');
      setTimeout(() => this.connectWebSocket(onMessage), 5000);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  sendWebSocketMessage(type: string, payload: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  disconnectWebSocket(): void {
    this.ws?.close();
    this.ws = null;
  }
}

export const api = new APIService();
