/**
 * Context entity types
 */

export type ContextType = "text" | "image" | "audio" | "file";

export interface Context {
  id: string;
  type: ContextType;
  content: string;
  summary: string;
  tags: string[];
  embedding?: number[];
  source?: string;   // Original file path (image, audio, file)
  project?: string;  // Project name (hierarchy: level 1)
  category?: string; // Category name (hierarchy: level 2)
  sprint?: string;   // Sprint identifier
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContextInput {
  type: ContextType;
  content: string;
  source?: string;
  tags?: string[];    // Pre-extracted tags from image analysis
  project?: string;   // Project name (hierarchy: level 1)
  category?: string;  // Category name (hierarchy: level 2)
  sprint?: string;    // Sprint identifier
}

export interface ContextWithSimilarity extends Context {
  similarity: number;
}

export interface ListOptions {
  tags?: string[];
  type?: ContextType;
  project?: string;   // Project filter (hierarchy: level 1)
  category?: string;  // Category filter (hierarchy: level 2)
  sprint?: string;    // Sprint filter
  limit?: number;
  offset?: number;
}
