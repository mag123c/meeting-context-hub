import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActionItemRepository } from "@/repositories/action-item.repository";
import type {
  ActionItem,
  CreateActionItemInput,
  UpdateActionItemInput,
  Pagination,
  PaginatedResult,
} from "@/repositories/types";
import { actionItemSchema } from "@/repositories/types";

export class SupabaseActionItemRepository implements ActionItemRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(data: CreateActionItemInput): Promise<ActionItem> {
    const { data: actionItem, error } = await this.supabase
      .from("action_items")
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`Failed to create action item: ${error.message}`);

    return actionItemSchema.parse(actionItem);
  }

  async getById(id: string): Promise<ActionItem | null> {
    const { data: actionItem, error } = await this.supabase
      .from("action_items")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to get action item: ${error.message}`);
    }

    return actionItemSchema.parse(actionItem);
  }

  async listBySprint(
    sprintId: string,
    pagination: Pagination = { page: 1, limit: 50 }
  ): Promise<PaginatedResult<ActionItem>> {
    const { page, limit } = pagination;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: items, error, count } = await this.supabase
      .from("action_items")
      .select("*", { count: "exact" })
      .eq("sprint_id", sprintId)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(`Failed to list action items: ${error.message}`);

    const data = items.map((i) => actionItemSchema.parse(i));

    return {
      data,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > page * limit,
    };
  }

  async listByMeeting(
    meetingId: string,
    pagination: Pagination = { page: 1, limit: 50 }
  ): Promise<PaginatedResult<ActionItem>> {
    const { page, limit } = pagination;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: items, error, count } = await this.supabase
      .from("action_items")
      .select("*", { count: "exact" })
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: true })
      .range(from, to);

    if (error) throw new Error(`Failed to list action items: ${error.message}`);

    const data = items.map((i) => actionItemSchema.parse(i));

    return {
      data,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > page * limit,
    };
  }

  async listByAssignee(
    assigneeName: string,
    pagination: Pagination = { page: 1, limit: 50 }
  ): Promise<PaginatedResult<ActionItem>> {
    const { page, limit } = pagination;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: items, error, count } = await this.supabase
      .from("action_items")
      .select("*", { count: "exact" })
      .eq("assignee_name", assigneeName)
      .order("deadline", { ascending: true, nullsFirst: false })
      .order("priority", { ascending: false })
      .range(from, to);

    if (error) throw new Error(`Failed to list action items: ${error.message}`);

    const data = items.map((i) => actionItemSchema.parse(i));

    return {
      data,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > page * limit,
    };
  }

  async update(id: string, data: UpdateActionItemInput): Promise<ActionItem> {
    const { data: actionItem, error } = await this.supabase
      .from("action_items")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update action item: ${error.message}`);

    return actionItemSchema.parse(actionItem);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("action_items")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete action item: ${error.message}`);
  }

  async markComplete(id: string): Promise<ActionItem> {
    const { data: actionItem, error } = await this.supabase
      .from("action_items")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to mark action item complete: ${error.message}`);

    return actionItemSchema.parse(actionItem);
  }

  async markPending(id: string): Promise<ActionItem> {
    const { data: actionItem, error } = await this.supabase
      .from("action_items")
      .update({
        status: "pending",
        completed_at: null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to mark action item pending: ${error.message}`);

    return actionItemSchema.parse(actionItem);
  }
}
