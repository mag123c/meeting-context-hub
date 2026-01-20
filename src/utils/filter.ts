/**
 * Context 필터링 유틸리티
 */

import type { Context, ContextWithSimilarity, ListOptions } from "../types/context.types.js";

type FilterableContext = Context | ContextWithSimilarity;

/**
 * Context 배열에 필터 적용
 */
export function applyFilters<T extends FilterableContext>(
  contexts: T[],
  options?: ListOptions
): T[] {
  if (!options) return contexts;

  let filtered = contexts;

  if (options.tags && options.tags.length > 0) {
    filtered = filtered.filter((ctx) =>
      options.tags!.some((tag) => ctx.tags.includes(tag))
    );
  }

  if (options.type) {
    filtered = filtered.filter((ctx) => ctx.type === options.type);
  }

  if (options.project) {
    filtered = filtered.filter((ctx) => ctx.project === options.project);
  }

  if (options.sprint) {
    filtered = filtered.filter((ctx) => ctx.sprint === options.sprint);
  }

  return filtered;
}

/**
 * project/sprint 필터만 적용 (이미 태그 필터된 결과에 사용)
 */
export function applyProjectSprintFilters<T extends FilterableContext>(
  contexts: T[],
  options?: Pick<ListOptions, "project" | "sprint">
): T[] {
  if (!options) return contexts;

  let filtered = contexts;

  if (options.project) {
    filtered = filtered.filter((ctx) => ctx.project === options.project);
  }

  if (options.sprint) {
    filtered = filtered.filter((ctx) => ctx.sprint === options.sprint);
  }

  return filtered;
}
