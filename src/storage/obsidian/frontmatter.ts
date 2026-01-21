import matter from "gray-matter";
import type { Context } from "../../types/context.types.js";

export interface Frontmatter {
  id: string;
  type: string;
  summary: string;
  tags: string[];
  embedding?: number[];
  source?: string;
  project?: string;
  sprint?: string;
  createdAt: string;
  updatedAt: string;
}

export function contextToMarkdown(context: Context): string {
  const frontmatter: Record<string, unknown> = {
    id: context.id,
    type: context.type,
    summary: context.summary,
    tags: context.tags,
    createdAt: context.createdAt.toISOString(),
    updatedAt: context.updatedAt.toISOString(),
  };

  // Exclude undefined values
  if (context.source) {
    frontmatter.source = context.source;
  }
  if (context.embedding && context.embedding.length > 0) {
    frontmatter.embedding = context.embedding;
  }
  if (context.project) {
    frontmatter.project = context.project;
  }
  if (context.sprint) {
    frontmatter.sprint = context.sprint;
  }

  return matter.stringify(context.content, frontmatter);
}

export function markdownToContext(markdown: string): Context {
  const { data, content } = matter(markdown);
  const fm = data as Frontmatter;

  return {
    id: fm.id,
    type: fm.type as Context["type"],
    content: content.trim(),
    summary: fm.summary,
    tags: fm.tags || [],
    embedding: fm.embedding,
    source: fm.source,
    project: fm.project,
    sprint: fm.sprint,
    createdAt: new Date(fm.createdAt),
    updatedAt: new Date(fm.updatedAt),
  };
}

export function updateFrontmatter(
  markdown: string,
  updates: Partial<Frontmatter>
): string {
  const { data, content } = matter(markdown);
  const updatedData = { ...data, ...updates, updatedAt: new Date().toISOString() };
  return matter.stringify(content, updatedData);
}
