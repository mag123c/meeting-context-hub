import type {
  ActionItem,
  CreateActionItemInput,
  UpdateActionItemInput,
} from "./types";
import type { Pagination, PaginatedResult } from "./types";

export interface ActionItemRepository {
  create(data: CreateActionItemInput): Promise<ActionItem>;
  getById(id: string): Promise<ActionItem | null>;
  listBySprint(
    sprintId: string,
    pagination?: Pagination
  ): Promise<PaginatedResult<ActionItem>>;
  listByMeeting(
    meetingId: string,
    pagination?: Pagination
  ): Promise<PaginatedResult<ActionItem>>;
  listByAssignee(
    assigneeName: string,
    pagination?: Pagination
  ): Promise<PaginatedResult<ActionItem>>;
  update(id: string, data: UpdateActionItemInput): Promise<ActionItem>;
  delete(id: string): Promise<void>;
  markComplete(id: string): Promise<ActionItem>;
  markPending(id: string): Promise<ActionItem>;
}
