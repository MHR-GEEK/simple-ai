import axios, { AxiosInstance, AxiosError } from 'axios';
import type { Message, GitRepository, GitFile, GitCommit, BuildResult, Project, ProjectFile, UserSettings, APIConfig } from '../types';

class APIService {
  private client: AxiosInstance;
  private ws: WebSocket | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) window.location.href = '/auth/login';
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string) { this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`; }
  clearAuthToken() { delete this.client.defaults.headers.common['Authorization']; }

  async sendMessage(messages: Message[], options?: { stream?: boolean; model?: string; temperature?: number; maxTokens?: number; attachments?: File[] }) {
    const formData = new FormData();
    formData.append('messages', JSON.stringify(messages));
    if (options?.model) formData.append('model', options.model);
    if (options?.temperature) formData.append('temperature', options.temperature.toString());
    if (options?.maxTokens) formData.append('maxTokens', options.maxTokens.toString());
    if (options?.stream) formData.append('stream', 'true');
    if (options?.attachments) options.attachments.forEach(f => formData.append('attachments', f));

    return this.client.post('/chat/completions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: options?.stream ? 'stream' : 'json',
    });
  }

  async processVoiceCommand(audioBlob: Blob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'command.webm');
    return this.client.post('/voice/process', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  }

  async getRepositories(): Promise<GitRepository[]> { return (await this.client.get('/git/repositories')).data; }
  async getRepository(owner: string, repo: string): Promise<GitRepository> { return (await this.client.get(`/git/repositories/${owner}/${repo}`)).data; }
  async getFiles(owner: string, repo: string, path = '', branch?: string): Promise<GitFile[]> {
    const params = new URLSearchParams(); if (branch) params.append('branch', branch);
    return (await this.client.get(`/git/repositories/${owner}/${repo}/files/${path}`, { params })).data;
  }
  async getFileContent(owner: string, repo: string, path: string, branch?: string): Promise<GitFile> {
    const params = new URLSearchParams(); if (branch) params.append('branch', branch);
    return (await this.client.get(`/git/repositories/${owner}/${repo}/files/content/${path}`, { params })).data;
  }
  async createOrUpdateFile(owner: string, repo: string, path: string, content: string, message: string, branch?: string, sha?: string) {
    return (await this.client.put(`/git/repositories/${owner}/${repo}/files/${path}`, { content, message, branch, sha })).data;
  }
  async deleteFile(owner: string, repo: string, path: string, message: string, branch?: string, sha?: string): Promise<GitCommit> {
    return (await this.client.delete(`/git/repositories/${owner}/${repo}/files/${path}`, { data: { message, branch, sha } })).data;
  }
  async getCommits(owner: string, repo: string, branch?: string, limit = 50): Promise<GitCommit[]> {
    const params = new URLSearchParams(); if (branch) params.append('branch', branch); params.append('limit', limit.toString());
    return (await this.client.get(`/git/repositories/${owner}/${repo}/commits`, { params })).data;
  }
  async createBranch(owner: string, repo: string, branchName: string, fromBranch?: string): Promise<GitCommit> {
    return (await this.client.post(`/git/repositories/${owner}/${repo}/branches`, { name: branchName, fromBranch })).data;
  }
  async mergeBranch(owner: string, repo: string, sourceBranch: string, targetBranch: string, message?: string): Promise<GitCommit> {
    return (await this.client.post(`/git/repositories/${owner}/${repo}/merge`, { sourceBranch, targetBranch, message })).data;
  }

  async buildProject(projectId: string, config?: any): Promise<BuildResult> { return (await this.client.post(`/projects/${projectId}/build`, config)).data; }
  async executeCode(code: string, language: string, files?: Record<string, string>): Promise<BuildResult> { return (await this.client.post('/execute', { code, language, files })).data; }

  async uploadFiles(projectId: string, files: File[]): Promise<ProjectFile[]> {
    const formData = new FormData(); files.forEach(f => formData.append('files', f));
    return (await this.client.post(`/projects/${projectId}/files/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
  }
  async readFile(projectId: string, path: string): Promise<ProjectFile> { return (await this.client.get(`/projects/${projectId}/files/${path}`)).data; }
  async writeFile(projectId: string, path: string, content: string): Promise<ProjectFile> { return (await this.client.put(`/projects/${projectId}/files/${path}`, { content })).data; }
  async deleteFile(projectId: string, path: string): Promise<void> { await this.client.delete(`/projects/${projectId}/files/${path}`); }
  async listFiles(projectId: string, path = ''): Promise<ProjectFile[]> { return (await this.client.get(`/projects/${projectId}/files`, { params: { path } })).data; }

  async generateImage(prompt: string, options?: { size?: string; quality?: string; style?: string }) { return (await this.client.post('/images/generate', { prompt, ...options })).data; }

  async getProjects(): Promise<Project[]> { return (await this.client.get('/projects')).data; }
  async getProject(id: string): Promise<Project> { return (await this.client.get(`/projects/${id}`)).data; }
  async createProject(project: Partial<Project>): Promise<Project> { return (await this.client.post('/projects', project)).data; }
  async updateProject(id: string, project: Partial<Project>): Promise<Project> { return (await this.client.put(`/projects/${id}`, project)).data; }
  async deleteProject(id: string): Promise<void> { await this.client.delete(`/projects/${id}`); }

  async getSettings(): Promise<UserSettings> { return (await this.client.get('/settings')).data; }
  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> { return (await this.client.put('/settings', settings)).data; }
  async testAPIConnection(config: APIConfig) { return (await this.client.post('/settings/test-connection', config)).data; }

  connectWebSocket(onMessage: (data: any) => void) {
    const wsUrl = (import.meta.env.VITE_WS_URL || 'ws://localhost:4000').replace('http', 'ws');
    this.ws = new WebSocket(`${wsUrl}/ws`);
    this.ws.onopen = () => console.log('WS connected');
    this.ws.onmessage = (e) => { try { onMessage(JSON.parse(e.data)); } catch {} };
    this.ws.onclose = () => setTimeout(() => this.connectWebSocket(onMessage), 5000);
    this.ws.onerror = (e) => console.error('WS error', e);
  }
  sendWebSocketMessage(type: string, payload: any) { if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type, payload })); }
  disconnectWebSocket() { this.ws?.close(); this.ws = null; }
}

export const api = new APIService();
