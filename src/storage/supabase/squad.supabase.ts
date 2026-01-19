import type { SupabaseClient } from "@supabase/supabase-js";
import type { SquadRepository } from "@/repositories/squad.repository";
import type {
  Squad,
  CreateSquadInput,
  UpdateSquadInput,
  Pagination,
  PaginatedResult,
} from "@/repositories/types";
import { squadSchema } from "@/repositories/types";

/**
 * Supabase implementation of SquadRepository interface.
 * Follows the same pattern as existing implementations (meeting.supabase.ts, etc.)
 */
export class SupabaseSquadRepository implements SquadRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(userId: string, data: CreateSquadInput): Promise<Squad> {
    const { data: squad, error } = await this.supabase
      .from("squads")
      .insert({ ...data, user_id: userId })
      .select()
      .single();

    if (error) throw new Error(`Failed to create squad: ${error.message}`);

    return squadSchema.parse(squad);
  }

  async getById(id: string): Promise<Squad | null> {
    const { data: squad, error } = await this.supabase
      .from("squads")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to get squad: ${error.message}`);
    }

    return squadSchema.parse(squad);
  }

  async listByUser(
    userId: string,
    pagination: Pagination = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<Squad>> {
    const { page, limit } = pagination;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: squads, error, count } = await this.supabase
      .from("squads")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(`Failed to list squads: ${error.message}`);

    const data = squads.map((s) => squadSchema.parse(s));

    return {
      data,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > page * limit,
    };
  }

  async update(id: string, data: UpdateSquadInput): Promise<Squad> {
    const { data: squad, error } = await this.supabase
      .from("squads")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update squad: ${error.message}`);

    return squadSchema.parse(squad);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("squads")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete squad: ${error.message}`);
  }
}
