import type { StorageProvider } from '../../adapters/storage/storage.interface.js';
import type { Project } from '../../types/index.js';
import { createProject, validateProjectName } from '../domain/project.js';

/**
 * Use case for managing projects
 */
export class ManageProjectUseCase {
  constructor(private readonly storage: StorageProvider) {}

  /**
   * Create a new project
   */
  async createProject(name: string, description?: string): Promise<Project> {
    // Validate name
    const validation = validateProjectName(name);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Check for duplicate name
    const existing = await this.storage.getProjectByName(name);
    if (existing) {
      throw new Error(`Project "${name}" already exists`);
    }

    // Create and save
    const project = createProject(name, description || null);
    await this.storage.saveProject(project);

    return project;
  }

  /**
   * Get all projects
   */
  async listProjects(): Promise<Project[]> {
    return this.storage.listProjects();
  }

  /**
   * Get project by ID
   */
  async getProject(id: string): Promise<Project | null> {
    return this.storage.getProject(id);
  }

  /**
   * Delete a project (contexts become uncategorized)
   */
  async deleteProject(id: string): Promise<void> {
    const project = await this.storage.getProject(id);
    if (!project) {
      throw new Error('Project not found');
    }

    await this.storage.deleteProject(id);
  }

  /**
   * Update a project
   */
  async updateProject(id: string, updates: { name?: string; description?: string }): Promise<Project> {
    const project = await this.storage.getProject(id);
    if (!project) {
      throw new Error('Project not found');
    }

    // Validate name if provided
    if (updates.name !== undefined) {
      const trimmedName = updates.name.trim();
      if (!trimmedName) {
        throw new Error('Project name cannot be empty');
      }

      // Check for duplicate name (but allow keeping the same name)
      const existing = await this.storage.getProjectByName(trimmedName);
      if (existing && existing.id !== id) {
        throw new Error(`Project "${trimmedName}" already exists`);
      }

      updates.name = trimmedName;
    }

    await this.storage.updateProject(id, updates);

    return {
      ...project,
      ...updates,
    };
  }
}
