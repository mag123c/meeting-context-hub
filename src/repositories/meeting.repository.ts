import type {
  Meeting,
  MeetingWithTags,
  CreateMeetingInput,
  UpdateMeetingInput,
} from "./types";
import type { Pagination, PaginatedResult } from "./types";

export interface MeetingRepository {
  create(userId: string, data: CreateMeetingInput): Promise<Meeting>;
  getById(id: string): Promise<MeetingWithTags | null>;
  listByUser(
    userId: string,
    pagination?: Pagination
  ): Promise<PaginatedResult<MeetingWithTags>>;
  update(id: string, data: UpdateMeetingInput): Promise<Meeting>;
  delete(id: string): Promise<void>;
  addTags(meetingId: string, tagIds: string[]): Promise<void>;
  removeTags(meetingId: string, tagIds: string[]): Promise<void>;
  setTags(meetingId: string, tagIds: string[]): Promise<void>;
  search(
    userId: string,
    query: string,
    pagination?: Pagination
  ): Promise<PaginatedResult<MeetingWithTags>>;
}
