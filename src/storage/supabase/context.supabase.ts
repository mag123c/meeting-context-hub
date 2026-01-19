import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContextRepository } from "@/repositories/context.repository";
import type {
  Context,
  ContextWithTags,
  CreateContextInput,
  UpdateContextInput,
  ContextSource,
  Pagination,
  PaginatedResult,
} from "@/repositories/types";
import { contextSchema, contextWithTagsSchema } from "@/repositories/types";

export class SupabaseContextRepository implements ContextRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(userId: string, data: CreateContextInput): Promise<Context> {
    const { tag_ids, ...contextData } = data;

    const { data: context, error } = await this.supabase
      .from("contexts")
      .insert({ ...contextData, user_id: userId })
      .select()
      .single();

    if (error) throw new Error(`Failed to create context: ${error.message}`);

    if (tag_ids && tag_ids.length > 0) {
      await this.setTags(context.id, tag_ids);
    }

    return contextSchema.parse(context);
  }

  async getById(id: string): Promise<ContextWithTags | null> {
    const { data: context, error } = await this.supabase
      .from("contexts")
      .select(
        `
        *,
        context_tags (
          tags (*)
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to get context: ${error.message}`);
    }

    const tags = context.context_tags?.map((ct: { tags: unknown }) => ct.tags) || [];
    return contextWithTagsSchema.parse({ ...context, tags, context_tags: undefined });
  }

  async listByUser(
    userId: string,
    pagination: Pagination = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<ContextWithTags>> {
    const { page, limit } = pagination;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: contexts, error, count } = await this.supabase
      .from("contexts")
      .select(
        `
        *,
        context_tags (
          tags (*)
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(`Failed to list contexts: ${error.message}`);

    const data = contexts.map((c) => {
      const tags = c.context_tags?.map((ct: { tags: unknown }) => ct.tags) || [];
      return contextWithTagsSchema.parse({ ...c, tags, context_tags: undefined });
    });

    return {
      data,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > page * limit,
    };
  }

  async listBySource(
    userId: string,
    source: ContextSource,
    pagination: Pagination = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<ContextWithTags>> {
    const { page, limit } = pagination;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: contexts, error, count } = await this.supabase
      .from("contexts")
      .select(
        `
        *,
        context_tags (
          tags (*)
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .eq("source", source)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(`Failed to list contexts by source: ${error.message}`);

    const data = contexts.map((c) => {
      const tags = c.context_tags?.map((ct: { tags: unknown }) => ct.tags) || [];
      return contextWithTagsSchema.parse({ ...c, tags, context_tags: undefined });
    });

    return {
      data,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > page * limit,
    };
  }

  async listByTag(
    userId: string,
    tagId: string,
    pagination: Pagination = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<ContextWithTags>> {
    const { page, limit } = pagination;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: contexts, error, count } = await this.supabase
      .from("contexts")
      .select(
        `
        *,
        context_tags!inner (
          tags (*)
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .eq("context_tags.tag_id", tagId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(`Failed to list contexts by tag: ${error.message}`);

    const data = contexts.map((c) => {
      const tags = c.context_tags?.map((ct: { tags: unknown }) => ct.tags) || [];
      return contextWithTagsSchema.parse({ ...c, tags, context_tags: undefined });
    });

    return {
      data,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > page * limit,
    };
  }

  async update(id: string, data: UpdateContextInput): Promise<Context> {
    const { tag_ids, ...contextData } = data;

    const { data: context, error } = await this.supabase
      .from("contexts")
      .update(contextData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update context: ${error.message}`);

    if (tag_ids) {
      await this.setTags(id, tag_ids);
    }

    return contextSchema.parse(context);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("contexts").delete().eq("id", id);

    if (error) throw new Error(`Failed to delete context: ${error.message}`);
  }

  async addTags(contextId: string, tagIds: string[]): Promise<void> {
    const inserts = tagIds.map((tagId) => ({
      context_id: contextId,
      tag_id: tagId,
    }));

    const { error } = await this.supabase
      .from("context_tags")
      .upsert(inserts, { onConflict: "context_id,tag_id" });

    if (error) throw new Error(`Failed to add tags: ${error.message}`);
  }

  async removeTags(contextId: string, tagIds: string[]): Promise<void> {
    const { error } = await this.supabase
      .from("context_tags")
      .delete()
      .eq("context_id", contextId)
      .in("tag_id", tagIds);

    if (error) throw new Error(`Failed to remove tags: ${error.message}`);
  }

  async setTags(contextId: string, tagIds: string[]): Promise<void> {
    await this.supabase
      .from("context_tags")
      .delete()
      .eq("context_id", contextId);

    if (tagIds.length > 0) {
      await this.addTags(contextId, tagIds);
    }
  }

  async search(
    userId: string,
    query: string,
    pagination: Pagination = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<ContextWithTags>> {
    const { page, limit } = pagination;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: contexts, error, count } = await this.supabase
      .from("contexts")
      .select(
        `
        *,
        context_tags (
          tags (*)
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .ilike("content", `%${query}%`)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(`Failed to search contexts: ${error.message}`);

    const data = contexts.map((c) => {
      const tags = c.context_tags?.map((ct: { tags: unknown }) => ct.tags) || [];
      return contextWithTagsSchema.parse({ ...c, tags, context_tags: undefined });
    });

    return {
      data,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > page * limit,
    };
  }
}
