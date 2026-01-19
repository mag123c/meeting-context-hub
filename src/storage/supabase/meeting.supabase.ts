import type { SupabaseClient } from "@supabase/supabase-js";
import type { MeetingRepository } from "@/repositories/meeting.repository";
import type {
  Meeting,
  MeetingWithTags,
  CreateMeetingInput,
  UpdateMeetingInput,
  Pagination,
  PaginatedResult,
} from "@/repositories/types";
import { meetingSchema, meetingWithTagsSchema } from "@/repositories/types";

export class SupabaseMeetingRepository implements MeetingRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(userId: string, data: CreateMeetingInput): Promise<Meeting> {
    const { tag_ids, ...meetingData } = data;

    const { data: meeting, error } = await this.supabase
      .from("meetings")
      .insert({ ...meetingData, user_id: userId })
      .select()
      .single();

    if (error) throw new Error(`Failed to create meeting: ${error.message}`);

    if (tag_ids && tag_ids.length > 0) {
      await this.setTags(meeting.id, tag_ids);
    }

    return meetingSchema.parse(meeting);
  }

  async getById(id: string): Promise<MeetingWithTags | null> {
    const { data: meeting, error } = await this.supabase
      .from("meetings")
      .select(
        `
        *,
        meeting_tags (
          tags (*)
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to get meeting: ${error.message}`);
    }

    const tags = meeting.meeting_tags?.map((mt: { tags: unknown }) => mt.tags) || [];
    return meetingWithTagsSchema.parse({ ...meeting, tags, meeting_tags: undefined });
  }

  async listByUser(
    userId: string,
    pagination: Pagination = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<MeetingWithTags>> {
    const { page, limit } = pagination;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: meetings, error, count } = await this.supabase
      .from("meetings")
      .select(
        `
        *,
        meeting_tags (
          tags (*)
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(`Failed to list meetings: ${error.message}`);

    const data = meetings.map((m) => {
      const tags = m.meeting_tags?.map((mt: { tags: unknown }) => mt.tags) || [];
      return meetingWithTagsSchema.parse({ ...m, tags, meeting_tags: undefined });
    });

    return {
      data,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > page * limit,
    };
  }

  async update(id: string, data: UpdateMeetingInput): Promise<Meeting> {
    const { tag_ids, ...meetingData } = data;

    const { data: meeting, error } = await this.supabase
      .from("meetings")
      .update(meetingData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update meeting: ${error.message}`);

    if (tag_ids) {
      await this.setTags(id, tag_ids);
    }

    return meetingSchema.parse(meeting);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("meetings").delete().eq("id", id);

    if (error) throw new Error(`Failed to delete meeting: ${error.message}`);
  }

  async addTags(meetingId: string, tagIds: string[]): Promise<void> {
    const inserts = tagIds.map((tagId) => ({
      meeting_id: meetingId,
      tag_id: tagId,
    }));

    const { error } = await this.supabase
      .from("meeting_tags")
      .upsert(inserts, { onConflict: "meeting_id,tag_id" });

    if (error) throw new Error(`Failed to add tags: ${error.message}`);
  }

  async removeTags(meetingId: string, tagIds: string[]): Promise<void> {
    const { error } = await this.supabase
      .from("meeting_tags")
      .delete()
      .eq("meeting_id", meetingId)
      .in("tag_id", tagIds);

    if (error) throw new Error(`Failed to remove tags: ${error.message}`);
  }

  async setTags(meetingId: string, tagIds: string[]): Promise<void> {
    // 기존 태그 삭제
    await this.supabase
      .from("meeting_tags")
      .delete()
      .eq("meeting_id", meetingId);

    // 새 태그 추가
    if (tagIds.length > 0) {
      await this.addTags(meetingId, tagIds);
    }
  }

  async search(
    userId: string,
    query: string,
    pagination: Pagination = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<MeetingWithTags>> {
    const { page, limit } = pagination;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: meetings, error, count } = await this.supabase
      .from("meetings")
      .select(
        `
        *,
        meeting_tags (
          tags (*)
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .or(`title.ilike.%${query}%,raw_content.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(`Failed to search meetings: ${error.message}`);

    const data = meetings.map((m) => {
      const tags = m.meeting_tags?.map((mt: { tags: unknown }) => mt.tags) || [];
      return meetingWithTagsSchema.parse({ ...m, tags, meeting_tags: undefined });
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
