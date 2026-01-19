import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
} from "./types";
import type { Pagination, PaginatedResult } from "./types";

export interface ProjectRepository {
  create(userId: string, data: CreateProjectInput): Promise<Project>;
  getById(id: string): Promise<Project | null>;
  listBySquad(
    squadId: string,
    pagination?: Pagination
  ): Promise<PaginatedResult<Project>>;
  listByUser(
    userId: string,
    pagination?: Pagination
  ): Promise<PaginatedResult<Project>>;
  update(id: string, data: UpdateProjectInput): Promise<Project>;
  delete(id: string): Promise<void>;
}
