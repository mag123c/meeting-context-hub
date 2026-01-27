import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { Header } from '../components/Header.js';
import { Spinner } from '../components/Spinner.js';
import { TextInput } from '../components/TextInput.js';
import { ErrorText } from '../components/ErrorDisplay.js';
import { SectionBox } from '../components/SectionBox.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';
import { t, ti } from '../../i18n/index.js';
import type { ManageProjectUseCase } from '../../core/usecases/manage-project.usecase.js';
import type { ListContextsUseCase } from '../../core/usecases/list-contexts.usecase.js';
import type { Project } from '../../types/index.js';

interface ProjectScreenProps {
  manageProjectUseCase: ManageProjectUseCase;
  listContextsUseCase: ListContextsUseCase;
  goBack: () => void;
  language?: 'ko' | 'en';
}

type Mode = 'list' | 'create' | 'detail' | 'rename';

interface ProjectWithCount extends Project {
  contextCount: number;
}

export function ProjectScreen({
  manageProjectUseCase,
  listContextsUseCase,
  goBack,
  language = 'en',
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

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Rename state
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);

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

  const handleDeleteProject = useCallback(async () => {
    if (!selectedProject) return;

    setDeleting(true);
    setError(null);
    try {
      await manageProjectUseCase.deleteProject(selectedProject.id);
      setShowDeleteConfirm(false);
      setSelectedProject(null);
      setMode('list');
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete project'));
    }
    setDeleting(false);
  }, [selectedProject, manageProjectUseCase, loadProjects]);

  const handleRenameProject = useCallback(async () => {
    if (!selectedProject || !renameValue.trim()) return;

    setRenaming(true);
    setError(null);
    try {
      const updated = await manageProjectUseCase.updateProject(selectedProject.id, { name: renameValue.trim() });
      setSelectedProject({ ...selectedProject, name: updated.name });
      setMode('detail');
      setRenameValue('');
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to rename project'));
    }
    setRenaming(false);
  }, [selectedProject, renameValue, manageProjectUseCase, loadProjects]);

  useInput((input, key) => {
    // Ignore inputs when delete dialog is shown
    if (showDeleteConfirm) return;

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
      } else if (mode === 'rename') {
        setMode('detail');
        setRenameValue('');
        setError(null);
      } else {
        goBack();
      }
      return;
    }

    if (mode === 'list' && input === 'n') {
      setMode('create');
      setError(null);
    }

    // Delete project in detail mode
    if (mode === 'detail' && input === 'd') {
      setShowDeleteConfirm(true);
    }

    // Rename project in detail mode
    if (mode === 'detail' && input === 'r') {
      setRenameValue(selectedProject?.name || '');
      setMode('rename');
      setError(null);
    }

    if (mode === 'create' && key.return) {
      if (createStep === 'name' && newName.trim()) {
        setCreateStep('description');
      } else if (createStep === 'description') {
        handleCreateProject();
      }
    }

    if (mode === 'rename' && key.return) {
      handleRenameProject();
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('project.title', language)} />
        <Spinner message={t('project.loading', language)} />
      </Box>
    );
  }

  if (mode === 'create') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('project.create_title', language)} />

        {creating ? (
          <Spinner message={t('project.creating', language)} />
        ) : (
          <>
            {createStep === 'name' ? (
              <TextInput
                label={t('project.name_label', language)}
                value={newName}
                onChange={setNewName}
                placeholder={t('project.name_placeholder', language)}
              />
            ) : (
              <>
                <Text color="gray">{t('project.name_label', language)} {newName}</Text>
                <Box marginTop={1}>
                  <TextInput
                    label={t('project.desc_label', language)}
                    value={newDescription}
                    onChange={setNewDescription}
                    placeholder={t('project.desc_placeholder', language)}
                  />
                </Box>
              </>
            )}
            <Box marginTop={1}>
              <Text color="gray" dimColor>
                {t('project.hint_create', language)}
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
    // Show delete confirmation dialog
    if (showDeleteConfirm) {
      if (deleting) {
        return (
          <Box flexDirection="column" padding={1}>
            <Spinner message={t('dialog.deleting', language)} />
          </Box>
        );
      }

      return (
        <Box flexDirection="column" padding={1}>
          <Header title={selectedProject.name} />
          <ConfirmDialog
            title={t('dialog.delete_group_title', language)}
            message={t('dialog.delete_group_message', language)}
            confirmLabel={t('common.delete', language)}
            cancelLabel={t('common.cancel', language)}
            destructive
            onConfirm={handleDeleteProject}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        </Box>
      );
    }

    return (
      <Box flexDirection="column" padding={1}>
        <Header title={selectedProject.name} />
        <SectionBox color="cyan">
          {selectedProject.description && (
            <Text color="gray">{selectedProject.description}</Text>
          )}
          <Box marginY={1}>
            <Text>{ti('project.contexts_count', language, { count: selectedProject.contextCount })}</Text>
          </Box>
          <Text color="gray" dimColor>
            {t('project.created', language)} {new Date(selectedProject.createdAt).toLocaleString()}
          </Text>
        </SectionBox>
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            {t('project.hint_detail', language)}
          </Text>
        </Box>

        {error && (
          <Box marginTop={1}>
            <ErrorText error={error} language={language} />
          </Box>
        )}
      </Box>
    );
  }

  // Rename mode
  if (mode === 'rename' && selectedProject) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('project.rename', language)} />

        {renaming ? (
          <Spinner message={t('project.renaming', language)} />
        ) : (
          <>
            <TextInput
              label={t('project.new_name_label', language)}
              value={renameValue}
              onChange={setRenameValue}
              placeholder={selectedProject.name}
            />
            <Box marginTop={1}>
              <Text color="gray" dimColor>
                {t('project.hint_rename', language)}
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

  // List mode
  const projectItems = projects.map(p => ({
    label: `${p.name} (${ti('project.contexts_count', language, { count: p.contextCount })})`,
    value: p.id,
  }));

  return (
    <Box flexDirection="column" padding={1}>
      <Header title={t('project.title', language)} subtitle={ti('project.subtitle', language, { count: projects.length })} />

      {projects.length === 0 ? (
        <SectionBox color="gray">
          <Text color="gray">{t('project.empty', language)}</Text>
        </SectionBox>
      ) : (
        <SectionBox color="cyan">
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
        </SectionBox>
      )}

      {error && (
        <Box marginTop={1}>
          <ErrorText error={error} language={language} />
        </Box>
      )}

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          {t('project.hint_list', language)}
        </Text>
      </Box>
    </Box>
  );
}
