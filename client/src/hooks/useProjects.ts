import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import type { Project, ProjectFile, BuildResult } from '../types';
import toast from 'react-hot-toast';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [openFiles, setOpenFiles] = useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [building, setBuilding] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try { setProjects(await api.getProjects()); }
    catch { toast.error('Failed to fetch projects'); }
    finally { setLoading(false); }
  }, []);

  const fetchProject = useCallback(async (id: string) => {
    setLoading(true);
    try { const p = await api.getProject(id); setCurrentProject(p); return p; }
    catch { toast.error('Failed to fetch project'); }
    finally { setLoading(false); }
  }, []);

  const createProject = useCallback(async (project: Partial<Project>) => {
    try { const p = await api.createProject(project); setProjects(prev => [...prev, p]); toast.success('Project created'); return p; }
    catch { toast.error('Failed to create project'); }
  }, []);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    try { const p = await api.updateProject(id, updates); setProjects(prev => prev.map(x => x.id === id ? p : x)); if (currentProject?.id === id) setCurrentProject(p); return p; }
    catch { toast.error('Failed to update project'); }
  }, [currentProject]);

  const deleteProject = useCallback(async (id: string) => {
    try { await api.deleteProject(id); setProjects(prev => prev.filter(p => p.id !== id)); if (currentProject?.id === id) setCurrentProject(null); toast.success('Project deleted'); }
    catch { toast.error('Failed to delete project'); }
  }, [currentProject]);

  const fetchFiles = useCallback(async (path = '') => {
    if (!currentProject) return;
    try { setFiles(await api.listFiles(currentProject.id, path)); }
    catch { toast.error('Failed to fetch files'); }
  }, [currentProject]);

  const readFile = useCallback(async (path: string) => {
    if (!currentProject) return null;
    try { return await api.readFile(currentProject.id, path); }
    catch { toast.error('Failed to read file'); return null; }
  }, [currentProject]);

  const writeFile = useCallback(async (path: string, content: string) => {
    if (!currentProject) return null;
    try { const f = await api.writeFile(currentProject.id, path, content); setFiles(prev => { const e = prev.find(x => x.path === path); return e ? prev.map(x => x.path === path ? { ...x, content, modified: true } : x) : [...prev, f]; }); return f; }
    catch { toast.error('Failed to write file'); return null; }
  }, [currentProject]);

  const deleteFile = useCallback(async (path: string) => {
    if (!currentProject) return;
    try { await api.deleteFile(currentProject.id, path); setFiles(prev => prev.filter(f => f.path !== path)); setOpenFiles(prev => prev.filter(f => f.path !== path)); if (activeFile?.path === path) setActiveFile(null); toast.success('File deleted'); }
    catch { toast.error('Failed to delete file'); }
  }, [currentProject, activeFile]);

  const uploadFiles = useCallback(async (fileList: File[]) => {
    if (!currentProject) return;
    try { const u = await api.uploadFiles(currentProject.id, fileList); setFiles(prev => [...prev, ...u]); toast.success(`${u.length} file(s) uploaded`); return u; }
    catch { toast.error('Failed to upload'); }
  }, [currentProject]);

  const buildProject = useCallback(async (config?: any): Promise<BuildResult | null> => {
    if (!currentProject) return null;
    setBuilding(true);
    try { const r = await api.buildProject(currentProject.id, config); r.success ? toast.success('Build successful') : toast.error('Build failed'); return r; }
    catch { toast.error('Build error'); return null; }
    finally { setBuilding(false); }
  }, [currentProject]);

  const executeCode = useCallback(async (code: string, language: string, extraFiles?: Record<string, string>) => {
    try { return await api.executeCode(code, language, extraFiles); }
    catch { toast.error('Execution failed'); return null; }
  }, []);

  const openFile = useCallback((file: ProjectFile) => { setOpenFiles(prev => prev.some(f => f.path === file.path) ? prev : [...prev, file]); setActiveFile(file); }, []);
  const closeFile = useCallback((path: string) => { setOpenFiles(prev => prev.filter(f => f.path !== path)); if (activeFile?.path === path) { const rem = openFiles.filter(f => f.path !== path); setActiveFile(rem[rem.length - 1] || null); } }, [openFiles, activeFile]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  return { projects, currentProject, files, openFiles, activeFile, loading, building, fetchProjects, fetchProject, createProject, updateProject, deleteProject, fetchFiles, readFile, writeFile, deleteFile, uploadFiles, buildProject, executeCode, openFile, closeFile, setActiveFile, setCurrentProject };
}
