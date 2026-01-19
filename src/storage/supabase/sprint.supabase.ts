import type { SupabaseClient } from "@supabase/supabase-js";
import type { SprintRepository } from "@/repositories/sprint.repository";
import type {
  Sprint,
  CreateSprintInput,
  UpdateSprintInput,
  Pagination,
  PaginatedResult,
} from "@/repositories/types";
import { sprintSchema } from "@/repositories/types";

export class SupabaseSprintRepository implements SprintRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(data: CreateSprintInput): Promise<Sprint> {
    const { data: sprint, error } = await this.supabase
      .from("sprints")
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`Failed to create sprint: ${error.message}`);

    return sprintSchema.parse(sprint);
  }

  async getById(id: string): Promise<Sprint | null> {
    const { data: sprint, error } = await this.supabase
      .from("sprints")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to get sprint: ${error.message}`);
    }

    return sprintSchema.parse(sprint);
  }

  async listByProject(
    projectId: string,
    pagination: Pagination = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<Sprint>> {
    const { page, limit } = pagination;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: sprints, error, count } = await this.supabase
      .from("sprints")
      .select("*", { count: "exact" })
      .eq("project_id", projectId)
      .order("start_date", { ascending: false })
      .range(from, to);

    if (error) throw new Error(`Failed to list sprints: ${error.message}`);

    const data = sprints.map((s) => sprintSchema.parse(s));

    return {
      data,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > page * limit,
    };
  }

  async listActive(userId: string): Promise<Sprint[]> {
    // Active sprints: join through projects to filter by user's squads/projects
    const { data: sprints, error } = await this.supabase
      .from("sprints")
      .select(`
        *,
        projects!inner (
          id,
          squads (
            user_id
          )
        )
      `)
      .eq("status", "active")
      .order("start_date", { ascending: true });

    if (error) throw new Error(`Failed to list active sprints: ${error.message}`);

    // Filter by user_id (from squads relation)
    const userSprints = sprints.filter((s) => {
      const squad = s.projects?.squads;
      return squad?.user_id === userId;
    });

    return userSprints.map((s) => {
      const { projects: _projects, ...sprintData } = s;
      return sprintSchema.parse(sprintData);
    });
  }

  async update(id: string, data: UpdateSprintInput): Promise<Sprint> {
    const { data: sprint, error } = await this.supabase
      .from("sprints")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update sprint: ${error.message}`);

    return sprintSchema.parse(sprint);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("sprints")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete sprint: ${error.message}`);
  }
}
