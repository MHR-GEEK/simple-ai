// client/src/hooks/useProjects.ts
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
    try {
      const projectList = await api.getProjects();
      setProjects(projectList);
    } catch (error) {
      toast.error('Failed to fetch projects');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProject = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const project = await api.getProject(id);
      setCurrentProject(project);
      return project;
    } catch (error) {
      toast.error('Failed to fetch project');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (project: Partial<Project>) => {
    try {
      const newProject = await api.createProject(project);
      setProjects(prev => [...prev, newProject]);
      toast.success('Project created');
      return newProject;
    } catch (error) {
      toast.error('Failed to create project');
      console.error(error);
    }
  }, []);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    try {
      const updated = await api.updateProject(id, updates);
      setProjects(prev => prev.map(p => p.id === id ? updated : p));
      if (currentProject?.id === id) setCurrentProject(updated);
      return updated;
    } catch (error) {
      toast.error('Failed to update project');
      console.error(error);
    }
  }, [currentProject]);

  const deleteProject = useCallback(async (id: string) => {
    try {
      await api.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      if (currentProject?.id === id) setCurrentProject(null);
      toast.success('Project deleted');
    } catch (error) {
      toast.error('Failed to delete project');
      console.error(error);
    }
  }, [currentProject]);

  const fetchFiles = useCallback(async (path: string = '') => {
    if (!currentProject) return;
    try {
      const fileList = await api.listFiles(currentProject.id, path);
      setFiles(fileList);
    } catch (error) {
      toast.error('Failed to fetch files');
      console.error(error);
    }
  }, [currentProject]);

  const readFile = useCallback(async (path: string): Promise<ProjectFile | null> => {
    if (!currentProject) return null;
    try {
      return await api.readFile(currentProject.id, path);
    } catch (error) {
      toast.error('Failed to read file');
      console.error(error);
      return null;
    }
  }, [currentProject]);

  const writeFile = useCallback(async (path: string, content: string): Promise<ProjectFile | null> => {
    if (!currentProject) return null;
    try {
      const file = await api.writeFile(currentProject.id, path, content);
      setFiles(prev => {
        const exists = prev.find(f => f.path === path);
        if (exists) {
          return prev.map(f => f.path === path ? { ...f, content, modified: true } : f);
        }
        return [...prev, file];
      });
      return file;
    } catch (error) {
      toast.error('Failed to write file');
      console.error(error);
      return null;
    }
  }, [currentProject]);

  const deleteFile = useCallback(async (path: string) => {
    if (!currentProject) return;
    try {
      await api.deleteFile(currentProject.id, path);
      setFiles(prev => prev.filter(f => f.path !== path));
      setOpenFiles(prev => prev.filter(f => f.path !== path));
      if (activeFile?.path === path) setActiveFile(null);
      toast.success('File deleted');
    } catch (error) {
      toast.error('Failed to delete file');
      console.error(error);
    }
  }, [currentProject, activeFile]);

  const uploadFiles = useCallback(async (fileList: File[]) => {
    if (!currentProject) return;
    try {
      const uploaded = await api.uploadFiles(currentProject.id, fileList);
      setFiles(prev => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} file(s) uploaded`);
      return uploaded;
    } catch (error) {
      toast.error('Failed to upload files');
      console.error(error);
    }
  }, [currentProject]);

  const buildProject = useCallback(async (config?: any): Promise<BuildResult | null> => {
    if (!currentProject) return null;
    setBuilding(true);
    try {
      const result = await api.buildProject(currentProject.id, config);
      if (result.success) {
        toast.success('Build successful');
      } else {
        toast.error('Build failed');
      }
      return result;
    } catch (error) {
      toast.error('Build error');
      console.error(error);
      return null;
    } finally {
      setBuilding(false);
    }
  }, [currentProject]);

  const executeCode = useCallback(async (code: string, language: string, extraFiles?: Record<string, string>): Promise<BuildResult | null> => {
    try {
      return await api.executeCode(code, language, extraFiles);
    } catch (error) {
      toast.error('Execution failed');
      console.error(error);
      return null;
    }
  }, []);

  const openFile = useCallback((file: ProjectFile) => {
    setOpenFiles(prev => {
      if (prev.some(f => f.path === file.path)) return prev;
      return [...prev, file];
    });
    setActiveFile(file);
  }, []);

  const closeFile = useCallback((path: string) => {
    setOpenFiles(prev => prev.filter(f => f.path !== path));
    if (activeFile?.path === path) {
      const remaining = openFiles.filter(f => f.path !== path);
      setActiveFile(remaining[remaining.length - 1] || null);
    }
  }, [openFiles, activeFile]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    currentProject,
    files,
    openFiles,
    activeFile,
    loading,
    building,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    fetchFiles,
    readFile,
    writeFile,
    deleteFile,
    uploadFiles,
    buildProject,
    executeCode,
    openFile,
    closeFile,
    setActiveFile,
    setCurrentProject,
  };
}
