"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/storage/supabase/client";
import type {
  Sprint,
  CreateSprintInput,
  UpdateSprintInput,
  PaginatedResult,
  Pagination,
} from "@/repositories/types";
import { SupabaseSprintRepository } from "@/storage/supabase";

interface UseSprintsOptions {
  projectId?: string;
}

export function useSprints(options: UseSprintsOptions = {}) {
  const [data, setData] = useState<PaginatedResult<Sprint> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getRepository = useCallback(() => {
    if (typeof window === "undefined") return null;
    const supabase = createClient();
    return new SupabaseSprintRepository(supabase);
  }, []);

  const fetchSprints = useCallback(
    async (pagination?: Pagination) => {
      if (!options.projectId) return;

      setLoading(true);
      setError(null);

      try {
        const repo = getRepository();
        if (!repo) throw new Error("Repository not available");

        const result = await repo.listByProject(
          options.projectId,
          pagination || { page: 1, limit: 20 }
        );
        setData(result);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    },
    [options.projectId, getRepository]
  );

  const createSprint = useCallback(
    async (input: CreateSprintInput) => {
      setLoading(true);
      setError(null);

      try {
        const repo = getRepository();
        if (!repo) throw new Error("Repository not available");

        const sprint = await repo.create(input);
        return sprint;
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [getRepository]
  );

  const updateSprint = useCallback(
    async (id: string, input: UpdateSprintInput) => {
      setLoading(true);
      setError(null);

      try {
        const repo = getRepository();
        if (!repo) throw new Error("Repository not available");

        const sprint = await repo.update(id, input);
        return sprint;
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [getRepository]
  );

  const deleteSprint = useCallback(
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
    fetchSprints,
    createSprint,
    updateSprint,
    deleteSprint,
    refetch: fetchSprints,
  };
}
