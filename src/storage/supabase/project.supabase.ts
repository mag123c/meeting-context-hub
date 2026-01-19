import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectRepository } from "@/repositories/project.repository";
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  Pagination,
  PaginatedResult,
} from "@/repositories/types";
import { projectSchema } from "@/repositories/types";

export class SupabaseProjectRepository implements ProjectRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(userId: string, data: CreateProjectInput): Promise<Project> {
    // If no squad_id provided, create a personal project
    const { data: project, error } = await this.supabase
      .from("projects")
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`Failed to create project: ${error.message}`);

    return projectSchema.parse(project);
  }

  async getById(id: string): Promise<Project | null> {
    const { data: project, error } = await this.supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to get project: ${error.message}`);
    }

    return projectSchema.parse(project);
  }

  async listBySquad(
    squadId: string,
    pagination: Pagination = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<Project>> {
    const { page, limit } = pagination;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: projects, error, count } = await this.supabase
      .from("projects")
      .select("*", { count: "exact" })
      .eq("squad_id", squadId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(`Failed to list projects: ${error.message}`);

    const data = projects.map((p) => projectSchema.parse(p));

    return {
      data,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > page * limit,
    };
  }

  async listByUser(
    userId: string,
    pagination: Pagination = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<Project>> {
    const { page, limit } = pagination;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Get projects from user's squads
    const { data: projects, error, count } = await this.supabase
      .from("projects")
      .select(`
        *,
        squads!inner (
          user_id
        )
      `, { count: "exact" })
      .eq("squads.user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(`Failed to list user projects: ${error.message}`);

    const data = projects.map((p) => {
      const { squads: _squads, ...projectData } = p;
      return projectSchema.parse(projectData);
    });

    return {
      data,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > page * limit,
    };
  }

  async update(id: string, data: UpdateProjectInput): Promise<Project> {
    const { data: project, error } = await this.supabase
      .from("projects")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update project: ${error.message}`);

    return projectSchema.parse(project);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete project: ${error.message}`);
  }
}
