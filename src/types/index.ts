/**
 * Shared types for Meeting Context Hub
 */

// Context entity
export interface Context {
  id: string;
  projectId: string | null;
  rawInput: string;
  title: string;
  summary: string;
  decisions: string[];
  actionItems: ActionItem[];
  policies: string[];
  openQuestions: string[];
  tags: string[];
  embedding: Float32Array | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionItem {
  task: string;
  assignee?: string;
  dueDate?: string;
}

// Project entity
export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
}

// AI extraction result
export interface ExtractedContext {
  title: string;
  summary: string;
  decisions: string[];
  actionItems: ActionItem[];
  policies: string[];
  openQuestions: string[];
  tags: string[];
}

// Search options
export interface SearchOptions {
  query: string;
  projectId?: string;
  limit?: number;
}

// List options
export interface ListOptions {
  projectId?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

// Search result with similarity score
export interface SearchResult {
  context: Context;
  score: number;
}

// Dictionary entry for STT correction
export interface DictionaryEntry {
  id: string;
  source: string; // Misrecognized text (e.g., "임포크")
  target: string; // Corrected text (e.g., "인포크")
  createdAt: Date;
  updatedAt: Date;
}

// PromptContext category types
export type PromptContextCategory = 'domain' | 'policy' | 'terminology' | 'custom';

// PromptContext entity - Domain knowledge for AI extraction
export interface PromptContext {
  id: string;
  category: PromptContextCategory;
  title: string;
  content: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
