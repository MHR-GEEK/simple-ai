// client/src/hooks/useGit.ts
import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import type { GitRepository, GitFile, GitCommit, GitFileChange } from '../types';
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
    try {
      const repos = await api.getRepositories();
      setRepositories(repos);
    } catch (error) {
      toast.error('Failed to fetch repositories');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRepository = useCallback(async (owner: string, repo: string) => {
    setLoading(true);
    try {
      const repository = await api.getRepository(owner, repo);
      setCurrentRepo(repository);
      setCurrentBranch(repository.defaultBranch);
      return repository;
    } catch (error) {
      toast.error('Failed to fetch repository');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFiles = useCallback(async (path: string = '') => {
    if (!currentRepo) return;
    setLoading(true);
    try {
      const fileList = await api.getFiles(currentRepo.fullName.split('/')[0], currentRepo.fullName.split('/')[1], path, currentBranch);
      setFiles(fileList);
      setCurrentPath(path);
    } catch (error) {
      toast.error('Failed to fetch files');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentRepo, currentBranch]);

  const fetchFileContent = useCallback(async (path: string): Promise<GitFile | null> => {
    if (!currentRepo) return null;
    try {
      return await api.getFileContent(currentRepo.fullName.split('/')[0], currentRepo.fullName.split('/')[1], path, currentBranch);
    } catch (error) {
      toast.error('Failed to fetch file content');
      console.error(error);
      return null;
    }
  }, [currentRepo, currentBranch]);

  const saveFile = useCallback(async (
    path: string, 
    content: string, 
    message: string, 
    sha?: string
  ): Promise<{ commit: GitCommit; file: GitFile } | null> => {
    if (!currentRepo) return null;
    try {
      const result = await api.createOrUpdateFile(
        currentRepo.fullName.split('/')[0],
        currentRepo.fullName.split('/')[1],
        path,
        content,
        message,
        currentBranch,
        sha
      );
      toast.success('File saved successfully');
      return result;
    } catch (error) {
      toast.error('Failed to save file');
      console.error(error);
      return null;
    }
  }, [currentRepo, currentBranch]);

  const removeFile = useCallback(async (path: string, message: string, sha?: string): Promise<GitCommit | null> => {
    if (!currentRepo) return null;
    try {
      const commit = await api.deleteFile(
        currentRepo.fullName.split('/')[0],
        currentRepo.fullName.split('/')[1],
        path,
        message,
        currentBranch,
        sha
      );
      toast.success('File deleted successfully');
      return commit;
    } catch (error) {
      toast.error('Failed to delete file');
      console.error(error);
      return null;
    }
  }, [currentRepo, currentBranch]);

  const fetchCommits = useCallback(async (limit: number = 50) => {
    if (!currentRepo) return;
    try {
      const commitList = await api.getCommits(
        currentRepo.fullName.split('/')[0],
        currentRepo.fullName.split('/')[1],
        currentBranch,
        limit
      );
      setCommits(commitList);
    } catch (error) {
      toast.error('Failed to fetch commits');
      console.error(error);
    }
  }, [currentRepo, currentBranch]);

  const createNewBranch = useCallback(async (branchName: string, fromBranch?: string): Promise<GitCommit | null> => {
    if (!currentRepo) return null;
    try {
      const commit = await api.createBranch(
        currentRepo.fullName.split('/')[0],
        currentRepo.fullName.split('/')[1],
        branchName,
        fromBranch
      );
      toast.success(`Branch "${branchName}" created`);
      return commit;
    } catch (error) {
      toast.error('Failed to create branch');
      console.error(error);
      return null;
    }
  }, [currentRepo]);

  const mergeBranches = useCallback(async (
    sourceBranch: string, 
    targetBranch: string, 
    message?: string
  ): Promise<GitCommit | null> => {
    if (!currentRepo) return null;
    try {
      const commit = await api.mergeBranch(
        currentRepo.fullName.split('/')[0],
        currentRepo.fullName.split('/')[1],
        sourceBranch,
        targetBranch,
        message
      );
      toast.success('Branches merged successfully');
      return commit;
    } catch (error) {
      toast.error('Failed to merge branches');
      console.error(error);
      return null;
    }
  }, [currentRepo]);

  const switchBranch = useCallback((branch: string) => {
    setCurrentBranch(branch);
    fetchFiles(currentPath);
    fetchCommits();
  }, [currentPath, fetchFiles, fetchCommits]);

  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  return {
    repositories,
    currentRepo,
    files,
    commits,
    loading,
    currentPath,
    currentBranch,
    fetchRepositories,
    fetchRepository,
    fetchFiles,
    fetchFileContent,
    saveFile,
    removeFile,
    fetchCommits,
    createNewBranch,
    mergeBranches,
    switchBranch,
    setCurrentRepo,
  };
}
