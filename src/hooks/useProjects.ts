"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/storage/supabase/client";
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  PaginatedResult,
  Pagination,
} from "@/repositories/types";
import { SupabaseProjectRepository } from "@/storage/supabase";
import { useAuth } from "./useAuth";

interface UseProjectsOptions {
  squadId?: string;
}

/**
 * useProjects Hook
 * Client-side hook for project CRUD operations.
 * Uses repository pattern with Supabase implementation.
 * Auth state managed via useAuth hook.
 */
export function useProjects(options: UseProjectsOptions = {}) {
  const { user } = useAuth();
  const [data, setData] = useState<PaginatedResult<Project> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getRepository = useCallback(() => {
    if (typeof window === "undefined") return null;
    const supabase = createClient();
    return new SupabaseProjectRepository(supabase);
  }, []);

  const fetchProjects = useCallback(
    async (pagination?: Pagination) => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        const repo = getRepository();
        if (!repo) throw new Error("Repository not available");

        let result: PaginatedResult<Project>;

        if (options.squadId) {
          result = await repo.listBySquad(
            options.squadId,
            pagination || { page: 1, limit: 20 }
          );
        } else {
          result = await repo.listByUser(
            user.id,
            pagination || { page: 1, limit: 20 }
          );
        }

        setData(result);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    },
    [options.squadId, getRepository, user]
  );

  const createProject = useCallback(
    async (input: CreateProjectInput) => {
      if (!user) throw new Error("Not authenticated");

      setLoading(true);
      setError(null);

      try {
        const repo = getRepository();
        if (!repo) throw new Error("Repository not available");

        const project = await repo.create(user.id, input);
        return project;
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [getRepository, user]
  );

  const updateProject = useCallback(
    async (id: string, input: UpdateProjectInput) => {
      setLoading(true);
      setError(null);

      try {
        const repo = getRepository();
        if (!repo) throw new Error("Repository not available");

        const project = await repo.update(id, input);
        return project;
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [getRepository]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const repo = getRepository();
        if (!repo) throw new Error("Repository not available");

        await repo.delete(id);
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [getRepository]
  );

  return {
    data,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  };
}
