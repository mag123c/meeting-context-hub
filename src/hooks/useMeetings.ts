"use client";

import { useCallback, useState } from "react";
import type {
  MeetingWithTags,
  CreateMeetingInput,
  PaginatedResult,
  Pagination,
} from "@/repositories/types";

interface UseMeetingsOptions {
  sprintId?: string;
  projectId?: string;
}

/**
 * useMeetings Hook
 * Client-side hook for meeting CRUD operations via API routes.
 * Uses Zod-validated types from @/repositories/types.
 */
export function useMeetings(options: UseMeetingsOptions = {}) {
  const [data, setData] = useState<PaginatedResult<MeetingWithTags> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMeetings = useCallback(
    async (pagination?: Pagination) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (options.sprintId) params.set("sprintId", options.sprintId);
        if (options.projectId) params.set("projectId", options.projectId);
        if (pagination?.page) params.set("page", String(pagination.page));
        if (pagination?.limit) params.set("limit", String(pagination.limit));

        const res = await fetch(`/api/meeting?${params}`);
        if (!res.ok) {
          throw new Error("Failed to fetch meetings");
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

  const createMeeting = useCallback(
    async (input: { title: string; rawContent: string }) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/meeting", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          throw new Error("Failed to create meeting");
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

  const updateMeeting = useCallback(
    async (id: string, input: Partial<CreateMeetingInput>) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/meeting/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          throw new Error("Failed to update meeting");
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

  const deleteMeeting = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/meeting/${id}`, { method: "DELETE" });

      if (!res.ok) {
        throw new Error("Failed to delete meeting");
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
    fetchMeetings,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    refetch: fetchMeetings,
  };
}
