import type {
  Sprint,
  CreateSprintInput,
  UpdateSprintInput,
} from "./types";
import type { Pagination, PaginatedResult } from "./types";

export interface SprintRepository {
  create(data: CreateSprintInput): Promise<Sprint>;
  getById(id: string): Promise<Sprint | null>;
  listByProject(
    projectId: string,
    pagination?: Pagination
  ): Promise<PaginatedResult<Sprint>>;
  listActive(userId: string): Promise<Sprint[]>;
  update(id: string, data: UpdateSprintInput): Promise<Sprint>;
  delete(id: string): Promise<void>;
}
