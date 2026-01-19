import { z } from "zod";

// 공통 ID 스키마
export const idSchema = z.string().uuid();

// 타임스탬프 스키마
export const timestampSchema = z.string().datetime();

// 페이지네이션 스키마
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

// 페이지네이션 결과
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
