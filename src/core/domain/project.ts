import { v4 as uuidv4 } from 'uuid';
import type { Project } from '../../types/index.js';

/**
 * Create a new Project entity
 */
export function createProject(
  name: string,
  description: string | null = null
): Project {
  return {
    id: uuidv4(),
    name,
    description,
    createdAt: new Date(),
  };
}

/**
 * Validate project name
 */
export function validateProjectName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Project name cannot be empty' };
  }

  if (name.length > 100) {
    return { valid: false, error: 'Project name cannot exceed 100 characters' };
  }

  // Only allow alphanumeric, spaces, hyphens, underscores
  if (!/^[\w\s\-가-힣]+$/.test(name)) {
    return { valid: false, error: 'Project name contains invalid characters' };
  }

  return { valid: true };
}
