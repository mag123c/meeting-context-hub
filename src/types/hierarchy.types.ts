/**
 * Hierarchy types for AI-based automatic classification
 */

/**
 * Represents a placement decision made by AI
 */
export interface HierarchyPlacement {
  project: string;        // Project name (e.g., "ProjectA", "Uncategorized")
  category: string;       // Category name (e.g., "Backend", "Meeting", "General")
  isNewProject: boolean;  // Whether this is a new project
  isNewCategory: boolean; // Whether this is a new category within the project
  confidence: number;     // AI confidence score (0-1)
}

/**
 * Represents a node in the hierarchy tree
 */
export interface HierarchyNode {
  name: string;
  children?: HierarchyNode[];
}

/**
 * Complete hierarchy cache structure stored in hierarchy.json
 */
export interface HierarchyCache {
  version: number;
  updatedAt: string;
  projects: HierarchyProject[];
}

/**
 * Project node with categories
 */
export interface HierarchyProject {
  name: string;
  categories: string[];
}

/**
 * AI classification response schema
 */
export interface HierarchyClassificationResponse {
  project: string | null;
  category: string | null;
  isNewProject: boolean;
  isNewCategory: boolean;
  confidence: number;
}

/**
 * Options for hierarchy classification
 */
export interface ClassifyOptions {
  existingHierarchy: HierarchyCache;
  contentSummary: string;
  tags: string[];
  contextType: string;
}
