import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import type { GitRepository, GitFile, GitCommit } from '../types';
import toast from 'react-hot-toast';

export function useGit() {
  const [repositories, setRepositories] = useState<GitRepository[]>([]);
  const [currentRepo, setCurrentRepo] = useState<GitRepository | null>(null);
  const [files, setFiles] = useState<GitFile[]>([]);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [currentBranch, setCurrentBranch] = useState('main');

  const fetchRepositories = useCallback(async () => {
    setLoading(true);
    try { setRepositories(await api.getRepositories()); }
    catch { toast.error('Failed to fetch repos'); }
    finally { setLoading(false); }
  }, []);

  const fetchRepository = useCallback(async (owner: string, repo: string) => {
    setLoading(true);
    try {
      const r = await api.getRepository(owner, repo);
      setCurrentRepo(r); setCurrentBranch(r.defaultBranch); return r;
    } catch { toast.error('Failed to fetch repo'); }
    finally { setLoading(false); }
  }, []);

  const fetchFiles = useCallback(async (path = '') => {
    if (!currentRepo) return;
    setLoading(true);
    try { setFiles(await api.getFiles(currentRepo.fullName.split('/')[0], currentRepo.fullName.split('/')[1], path, currentBranch)); setCurrentPath(path); }
    catch { toast.error('Failed to fetch files'); }
    finally { setLoading(false); }
  }, [currentRepo, currentBranch]);

  const fetchFileContent = useCallback(async (path: string) => {
    if (!currentRepo) return null;
    try { return await api.getFileContent(currentRepo.fullName.split('/')[0], currentRepo.fullName.split('/')[1], path, currentBranch); }
    catch { toast.error('Failed to fetch file'); return null; }
  }, [currentRepo, currentBranch]);

  const saveFile = useCallback(async (path: string, content: string, message: string, sha?: string) => {
    if (!currentRepo) return null;
    try { return await api.createOrUpdateFile(currentRepo.fullName.split('/')[0], currentRepo.fullName.split('/')[1], path, content, message, currentBranch, sha); }
    catch { toast.error('Failed to save'); return null; }
  }, [currentRepo, currentBranch]);

  const removeFile = useCallback(async (path: string, message: string, sha?: string) => {
    if (!currentRepo) return null;
    try { return await api.deleteFile(currentRepo.fullName.split('/')[0], currentRepo.fullName.split('/')[1], path, message, currentBranch, sha); }
    catch { toast.error('Failed to delete'); return null; }
  }, [currentRepo, currentBranch]);

  const fetchCommits = useCallback(async (limit = 50) => {
    if (!currentRepo) return;
    try { setCommits(await api.getCommits(currentRepo.fullName.split('/')[0], currentRepo.fullName.split('/')[1], currentBranch, limit)); }
    catch { toast.error('Failed to fetch commits'); }
  }, [currentRepo, currentBranch]);

  const createNewBranch = useCallback(async (branchName: string, fromBranch?: string) => {
    if (!currentRepo) return null;
    try { return await api.createBranch(currentRepo.fullName.split('/')[0], currentRepo.fullName.split('/')[1], branchName, fromBranch); }
    catch { toast.error('Failed to create branch'); return null; }
  }, [currentRepo]);

  const mergeBranches = useCallback(async (source: string, target: string, message?: string) => {
    if (!currentRepo) return null;
    try { return await api.mergeBranch(currentRepo.fullName.split('/')[0], currentRepo.fullName.split('/')[1], source, target, message); }
    catch { toast.error('Failed to merge'); return null; }
  }, [currentRepo]);

  const switchBranch = useCallback((branch: string) => { setCurrentBranch(branch); fetchFiles(currentPath); fetchCommits(); }, [currentPath, fetchFiles, fetchCommits]);

  useEffect(() => { fetchRepositories(); }, [fetchRepositories]);

  return { repositories, currentRepo, files, commits, loading, currentPath, currentBranch, fetchRepositories, fetchRepository, fetchFiles, fetchFileContent, saveFile, removeFile, fetchCommits, createNewBranch, mergeBranches, switchBranch, setCurrentRepo };
}
