"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/storage/supabase/client";
import type {
  ActionItem,
  CreateActionItemInput,
  UpdateActionItemInput,
  PaginatedResult,
  Pagination,
} from "@/repositories/types";
import { SupabaseActionItemRepository } from "@/storage/supabase";

interface UseActionItemsOptions {
  sprintId?: string;
  meetingId?: string;
}

export function useActionItems(options: UseActionItemsOptions = {}) {
  const [data, setData] = useState<PaginatedResult<ActionItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getRepository = useCallback(() => {
    if (typeof window === "undefined") return null;
    const supabase = createClient();
    return new SupabaseActionItemRepository(supabase);
  }, []);

  const fetchActionItems = useCallback(
    async (pagination?: Pagination) => {
      setLoading(true);
      setError(null);

      try {
        const repo = getRepository();
        if (!repo) throw new Error("Repository not available");

        let result: PaginatedResult<ActionItem>;

        if (options.sprintId) {
          result = await repo.listBySprint(
            options.sprintId,
            pagination || { page: 1, limit: 50 }
          );
        } else if (options.meetingId) {
          result = await repo.listByMeeting(
            options.meetingId,
            pagination || { page: 1, limit: 50 }
          );
        } else {
          throw new Error("Either sprintId or meetingId is required");
        }

        setData(result);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    },
    [options.sprintId, options.meetingId, getRepository]
  );

  const createActionItem = useCallback(
    async (input: CreateActionItemInput) => {
      setLoading(true);
      setError(null);

      try {
        const repo = getRepository();
        if (!repo) throw new Error("Repository not available");

        const actionItem = await repo.create(input);
        return actionItem;
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [getRepository]
  );

  const updateActionItem = useCallback(
    async (id: string, input: UpdateActionItemInput) => {
      setLoading(true);
      setError(null);

      try {
        const repo = getRepository();
        if (!repo) throw new Error("Repository not available");

        const actionItem = await repo.update(id, input);
        return actionItem;
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [getRepository]
  );

  const deleteActionItem = useCallback(
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

  const markComplete = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const repo = getRepository();
        if (!repo) throw new Error("Repository not available");

        const actionItem = await repo.markComplete(id);
        return actionItem;
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [getRepository]
  );

  const markPending = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const repo = getRepository();
        if (!repo) throw new Error("Repository not available");

        const actionItem = await repo.markPending(id);
        return actionItem;
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
    fetchActionItems,
    createActionItem,
    updateActionItem,
    deleteActionItem,
    markComplete,
    markPending,
    refetch: fetchActionItems,
  };
}
