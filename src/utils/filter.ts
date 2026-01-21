/**
 * Context filtering utility
 */

import type { Context, ContextWithSimilarity, ListOptions } from "../types/context.types.js";

type FilterableContext = Context | ContextWithSimilarity;

/**
 * Apply filters to Context array
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
 * Apply only project/sprint filters (for already tag-filtered results)
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
