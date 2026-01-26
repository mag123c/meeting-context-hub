import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { Header } from '../components/Header.js';
import { Spinner } from '../components/Spinner.js';
import { TextInput } from '../components/TextInput.js';
import { ErrorText } from '../components/ErrorDisplay.js';
import type { ManageProjectUseCase } from '../../core/usecases/manage-project.usecase.js';
import type { ListContextsUseCase } from '../../core/usecases/list-contexts.usecase.js';
import type { Project } from '../../types/index.js';

interface ProjectScreenProps {
  manageProjectUseCase: ManageProjectUseCase;
  listContextsUseCase: ListContextsUseCase;
  goBack: () => void;
  language?: 'ko' | 'en';
}

type Mode = 'list' | 'create' | 'detail';

interface ProjectWithCount extends Project {
  contextCount: number;
}

export function ProjectScreen({
  manageProjectUseCase,
  listContextsUseCase,
  goBack,
  language = 'ko',
}: ProjectScreenProps): React.ReactElement {
  const [mode, setMode] = useState<Mode>('list');
  const [projects, setProjects] = useState<ProjectWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectWithCount | null>(null);

  // Create project state
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createStep, setCreateStep] = useState<'name' | 'description'>('name');
  const [creating, setCreating] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const projectList = await manageProjectUseCase.listProjects();

      // Get context counts for each project
      const projectsWithCounts = await Promise.all(
        projectList.map(async (p) => {
          const result = await listContextsUseCase.execute({ projectId: p.id, limit: 0 });
          return { ...p, contextCount: result.total };
        })
      );

      setProjects(projectsWithCounts);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load projects'));
      setLoading(false);
    }
  }, [manageProjectUseCase, listContextsUseCase]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateProject = useCallback(async () => {
    if (!newName.trim()) return;

    setCreating(true);
    setError(null);
    try {
      await manageProjectUseCase.createProject(newName.trim(), newDescription.trim() || undefined);
      setNewName('');
      setNewDescription('');
      setCreateStep('name');
      setMode('list');
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create project'));
    }
    setCreating(false);
  }, [newName, newDescription, manageProjectUseCase, loadProjects]);

  useInput((input, key) => {
    if (key.escape) {
      if (mode === 'create') {
        setMode('list');
        setNewName('');
        setNewDescription('');
        setCreateStep('name');
        setError(null);
      } else if (mode === 'detail') {
        setMode('list');
        setSelectedProject(null);
      } else {
        goBack();
      }
      return;
    }

    if (mode === 'list' && input === 'n') {
      setMode('create');
      setError(null);
    }

    if (mode === 'create' && key.return) {
      if (createStep === 'name' && newName.trim()) {
        setCreateStep('description');
      } else if (createStep === 'description') {
        handleCreateProject();
      }
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title="Projects" />
        <Spinner message="Loading projects..." />
      </Box>
    );
  }

  if (mode === 'create') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title="Create Project" />

        {creating ? (
          <Spinner message="Creating project..." />
        ) : (
          <>
            {createStep === 'name' ? (
              <TextInput
                label="Project Name:"
                value={newName}
                onChange={setNewName}
                placeholder="Enter project name..."
              />
            ) : (
              <>
                <Text color="gray">Name: {newName}</Text>
                <Box marginTop={1}>
                  <TextInput
                    label="Description (optional):"
                    value={newDescription}
                    onChange={setNewDescription}
                    placeholder="Enter description... (Enter to skip)"
                  />
                </Box>
              </>
            )}
            <Box marginTop={1}>
              <Text color="gray" dimColor>
                Enter to continue | ESC to cancel
              </Text>
            </Box>
          </>
        )}

        {error && (
          <Box marginTop={1}>
            <ErrorText error={error} language={language} />
          </Box>
        )}
      </Box>
    );
  }

  if (mode === 'detail' && selectedProject) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title={selectedProject.name} />
        {selectedProject.description && (
          <Text color="gray">{selectedProject.description}</Text>
        )}
        <Box marginY={1}>
          <Text>Contexts: {selectedProject.contextCount}</Text>
        </Box>
        <Text color="gray" dimColor>
          Created: {new Date(selectedProject.createdAt).toLocaleString()}
        </Text>
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Press ESC to go back
          </Text>
        </Box>
      </Box>
    );
  }

  // List mode
  const projectItems = projects.map(p => ({
    label: `${p.name} (${p.contextCount} contexts)`,
    value: p.id,
  }));

  return (
    <Box flexDirection="column" padding={1}>
      <Header title="Projects" subtitle={`${projects.length} project(s)`} />

      {projects.length === 0 ? (
        <Box marginY={1}>
          <Text color="gray">No projects yet. Press n to create one!</Text>
        </Box>
      ) : (
        <SelectInput
          items={projectItems}
          onSelect={(item) => {
            const proj = projects.find(p => p.id === item.value);
            if (proj) {
              setSelectedProject(proj);
              setMode('detail');
            }
          }}
        />
      )}

      {error && (
        <Box marginTop={1}>
          <ErrorText error={error} language={language} />
        </Box>
      )}

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          n: New project | Enter: View details | ESC: Back
        </Text>
      </Box>
    </Box>
  );
}
