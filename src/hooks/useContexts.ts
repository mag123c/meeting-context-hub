"use client";

import { useCallback, useState } from "react";
import type {
  ContextWithTags,
  CreateContextInput,
  PaginatedResult,
  Pagination,
} from "@/repositories/types";

interface UseContextsOptions {
  sprintId?: string;
  projectId?: string;
}

/**
 * useContexts Hook
 * Client-side hook for context CRUD operations via API routes.
 * Uses Zod-validated types from @/repositories/types.
 */
export function useContexts(options: UseContextsOptions = {}) {
  const [data, setData] = useState<PaginatedResult<ContextWithTags> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchContexts = useCallback(
    async (pagination?: Pagination) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (options.sprintId) params.set("sprintId", options.sprintId);
        if (options.projectId) params.set("projectId", options.projectId);
        if (pagination?.page) params.set("page", String(pagination.page));
        if (pagination?.limit) params.set("limit", String(pagination.limit));

        const res = await fetch(`/api/context?${params}`);
        if (!res.ok) {
          throw new Error("Failed to fetch contexts");
        }

        const result = await res.json();
        setData(result);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    },
    [options.sprintId, options.projectId]
  );

  const createContext = useCallback(
    async (input: CreateContextInput) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          throw new Error("Failed to create context");
        }

        return await res.json();
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateContext = useCallback(
    async (id: string, input: Partial<CreateContextInput>) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/context/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          throw new Error("Failed to update context");
        }

        return await res.json();
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteContext = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/context/${id}`, { method: "DELETE" });

      if (!res.ok) {
        throw new Error("Failed to delete context");
      }
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    fetchContexts,
    createContext,
    updateContext,
    deleteContext,
    refetch: fetchContexts,
  };
}
