import type {
  Squad,
  CreateSquadInput,
  UpdateSquadInput,
} from "./types";
import type { Pagination, PaginatedResult } from "./types";

export interface SquadRepository {
  create(userId: string, data: CreateSquadInput): Promise<Squad>;
  getById(id: string): Promise<Squad | null>;
  listByUser(
    userId: string,
    pagination?: Pagination
  ): Promise<PaginatedResult<Squad>>;
  update(id: string, data: UpdateSquadInput): Promise<Squad>;
  delete(id: string): Promise<void>;
}
