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
import type { DictionaryService } from '../../core/services/dictionary.service.js';
import type { PromptContextService } from '../../core/services/prompt-context.service.js';
import type { Project, DictionaryEntry, PromptContext, PromptContextCategory } from '../../types/index.js';

interface ProjectScreenProps {
  manageProjectUseCase: ManageProjectUseCase;
  listContextsUseCase: ListContextsUseCase;
  dictionaryService?: DictionaryService;
  promptContextService?: PromptContextService;
  goBack: () => void;
  language?: 'ko' | 'en';
}

type Mode = 'list' | 'create' | 'detail' | 'rename' | 'settings' | 'dictionary-list' | 'dictionary-add' | 'dictionary-edit' | 'domain-list' | 'domain-add' | 'domain-edit';

interface ProjectWithCount extends Project {
  contextCount: number;
}

export function ProjectScreen({
  manageProjectUseCase,
  listContextsUseCase,
  dictionaryService,
  promptContextService,
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

  // Dictionary state
  const [dictEntries, setDictEntries] = useState<DictionaryEntry[]>([]);
  const [dictSelectedIndex, setDictSelectedIndex] = useState(0);
  const [dictSource, setDictSource] = useState('');
  const [dictTarget, setDictTarget] = useState('');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [dictInputStep, setDictInputStep] = useState<'source' | 'target'>('source');
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Domain knowledge state
  const [domainEntries, setDomainEntries] = useState<PromptContext[]>([]);
  const [domainSelectedIndex, setDomainSelectedIndex] = useState(0);
  const [domainTitle, setDomainTitle] = useState('');
  const [domainContent, setDomainContent] = useState('');
  const [domainCategory, setDomainCategory] = useState<PromptContextCategory>('custom');
  const [editingDomainId, setEditingDomainId] = useState<string | null>(null);
  const [domainInputStep, setDomainInputStep] = useState<'title' | 'content'>('title');

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

  // Load dictionary entries for the current project
  const loadDictionaryEntries = useCallback(async () => {
    if (!dictionaryService || !selectedProject) return;
    try {
      const entries = await dictionaryService.listEntries(selectedProject.id);
      setDictEntries(entries);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load dictionary'));
    }
  }, [dictionaryService, selectedProject]);

  // Load domain entries for the current project
  const loadDomainEntries = useCallback(async () => {
    if (!promptContextService || !selectedProject) return;
    try {
      const entries = await promptContextService.list(selectedProject.id);
      setDomainEntries(entries);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load domain knowledge'));
    }
  }, [promptContextService, selectedProject]);

  useEffect(() => {
    if (mode === 'dictionary-list' && selectedProject) {
      loadDictionaryEntries();
    }
    if (mode === 'domain-list' && selectedProject) {
      loadDomainEntries();
    }
  }, [mode, selectedProject, loadDictionaryEntries, loadDomainEntries]);

  // Dictionary handlers
  const handleAddDictEntry = useCallback(async () => {
    if (!dictionaryService || !selectedProject || !dictSource.trim() || !dictTarget.trim()) return;

    setSaving(true);
    setError(null);

    try {
      await dictionaryService.addEntry(dictSource.trim(), dictTarget.trim(), selectedProject.id);
      setSuccess(t('dictionary.added', language));
      setDictSource('');
      setDictTarget('');
      setDictInputStep('source');
      setMode('dictionary-list');
      await loadDictionaryEntries();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add entry'));
    } finally {
      setSaving(false);
    }
  }, [dictionaryService, selectedProject, dictSource, dictTarget, language, loadDictionaryEntries]);

  const handleUpdateDictEntry = useCallback(async () => {
    if (!dictionaryService || !editingEntryId || !dictSource.trim() || !dictTarget.trim()) return;

    setSaving(true);
    setError(null);

    try {
      await dictionaryService.updateEntry(editingEntryId, {
        source: dictSource.trim(),
        target: dictTarget.trim(),
      });
      setSuccess(t('dictionary.updated', language));
      setDictSource('');
      setDictTarget('');
      setDictInputStep('source');
      setEditingEntryId(null);
      setMode('dictionary-list');
      await loadDictionaryEntries();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update entry'));
    } finally {
      setSaving(false);
    }
  }, [dictionaryService, editingEntryId, dictSource, dictTarget, language, loadDictionaryEntries]);

  const handleDeleteDictEntry = useCallback(async () => {
    if (!dictionaryService || dictEntries.length === 0) return;

    const entry = dictEntries[dictSelectedIndex];
    if (!entry) return;

    setSaving(true);
    setError(null);

    try {
      await dictionaryService.deleteEntry(entry.id);
      setSuccess(t('dictionary.deleted', language));
      await loadDictionaryEntries();
      setDictSelectedIndex((prev) => Math.max(0, prev - 1));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete entry'));
    } finally {
      setSaving(false);
    }
  }, [dictionaryService, dictEntries, dictSelectedIndex, language, loadDictionaryEntries]);

  // Domain handlers
  const handleAddDomainEntry = useCallback(async () => {
    if (!promptContextService || !selectedProject || !domainTitle.trim() || !domainContent.trim()) return;

    setSaving(true);
    setError(null);

    try {
      await promptContextService.create(domainTitle.trim(), domainContent.trim(), domainCategory, selectedProject.id);
      setSuccess(t('domain.added', language));
      setDomainTitle('');
      setDomainContent('');
      setDomainCategory('custom');
      setDomainInputStep('title');
      setMode('domain-list');
      await loadDomainEntries();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add domain knowledge'));
    } finally {
      setSaving(false);
    }
  }, [promptContextService, selectedProject, domainTitle, domainContent, domainCategory, language, loadDomainEntries]);

  const handleUpdateDomainEntry = useCallback(async () => {
    if (!promptContextService || !editingDomainId || !domainTitle.trim() || !domainContent.trim()) return;

    setSaving(true);
    setError(null);

    try {
      await promptContextService.update(editingDomainId, {
        title: domainTitle.trim(),
        content: domainContent.trim(),
        category: domainCategory,
      });
      setSuccess(t('domain.updated', language));
      setDomainTitle('');
      setDomainContent('');
      setDomainCategory('custom');
      setDomainInputStep('title');
      setEditingDomainId(null);
      setMode('domain-list');
      await loadDomainEntries();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update domain knowledge'));
    } finally {
      setSaving(false);
    }
  }, [promptContextService, editingDomainId, domainTitle, domainContent, domainCategory, language, loadDomainEntries]);

  const handleDeleteDomainEntry = useCallback(async () => {
    if (!promptContextService || domainEntries.length === 0) return;

    const entry = domainEntries[domainSelectedIndex];
    if (!entry) return;

    setSaving(true);
    setError(null);

    try {
      await promptContextService.delete(entry.id);
      setSuccess(t('domain.deleted', language));
      await loadDomainEntries();
      setDomainSelectedIndex((prev) => Math.max(0, prev - 1));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete domain knowledge'));
    } finally {
      setSaving(false);
    }
  }, [promptContextService, domainEntries, domainSelectedIndex, language, loadDomainEntries]);

  const handleToggleDomainEnabled = useCallback(async () => {
    if (!promptContextService || domainEntries.length === 0) return;

    const entry = domainEntries[domainSelectedIndex];
    if (!entry) return;

    setSaving(true);
    setError(null);

    try {
      await promptContextService.toggleEnabled(entry.id);
      await loadDomainEntries();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to toggle domain knowledge'));
    } finally {
      setSaving(false);
    }
  }, [promptContextService, domainEntries, domainSelectedIndex, loadDomainEntries]);

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
      } else if (mode === 'settings') {
        setMode('detail');
        setError(null);
      } else if (mode === 'dictionary-add' || mode === 'dictionary-edit') {
        setMode('dictionary-list');
        setDictSource('');
        setDictTarget('');
        setDictInputStep('source');
        setEditingEntryId(null);
        setError(null);
      } else if (mode === 'dictionary-list') {
        setMode('settings');
        setError(null);
      } else if (mode === 'domain-add' || mode === 'domain-edit') {
        setMode('domain-list');
        setDomainTitle('');
        setDomainContent('');
        setDomainCategory('custom');
        setDomainInputStep('title');
        setEditingDomainId(null);
        setError(null);
      } else if (mode === 'domain-list') {
        setMode('settings');
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

    // Settings in detail mode
    if (mode === 'detail' && input === 'c') {
      setMode('settings');
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

    // Dictionary list mode navigation
    if (mode === 'dictionary-list' && !saving) {
      if (key.upArrow) {
        setDictSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setDictSelectedIndex((prev) => Math.min(dictEntries.length - 1, prev + 1));
      } else if (input === 'a') {
        setMode('dictionary-add');
        setDictSource('');
        setDictTarget('');
        setDictInputStep('source');
        setError(null);
      } else if (input === 'd' && dictEntries.length > 0) {
        handleDeleteDictEntry();
      } else if (key.return && dictEntries.length > 0) {
        const entry = dictEntries[dictSelectedIndex];
        if (entry) {
          setEditingEntryId(entry.id);
          setDictSource(entry.source);
          setDictTarget(entry.target);
          setDictInputStep('source');
          setMode('dictionary-edit');
          setError(null);
        }
      }
      return;
    }

    // Dictionary add/edit mode
    if ((mode === 'dictionary-add' || mode === 'dictionary-edit') && !saving) {
      if (key.return) {
        if (dictInputStep === 'source' && dictSource.trim()) {
          setDictInputStep('target');
        } else if (dictInputStep === 'target' && dictTarget.trim()) {
          if (mode === 'dictionary-add') {
            handleAddDictEntry();
          } else {
            handleUpdateDictEntry();
          }
        }
      }
      return;
    }

    // Domain list mode navigation
    if (mode === 'domain-list' && !saving) {
      if (key.upArrow) {
        setDomainSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setDomainSelectedIndex((prev) => Math.min(domainEntries.length - 1, prev + 1));
      } else if (input === 'a') {
        setMode('domain-add');
        setDomainTitle('');
        setDomainContent('');
        setDomainCategory('custom');
        setDomainInputStep('title');
        setError(null);
      } else if (input === 'd' && domainEntries.length > 0) {
        handleDeleteDomainEntry();
      } else if (input === 't' && domainEntries.length > 0) {
        handleToggleDomainEnabled();
      } else if (key.return && domainEntries.length > 0) {
        const entry = domainEntries[domainSelectedIndex];
        if (entry) {
          setEditingDomainId(entry.id);
          setDomainTitle(entry.title);
          setDomainContent(entry.content);
          setDomainCategory(entry.category);
          setDomainInputStep('title');
          setMode('domain-edit');
          setError(null);
        }
      }
      return;
    }

    // Domain add/edit mode
    if ((mode === 'domain-add' || mode === 'domain-edit') && !saving) {
      if (key.return) {
        if (domainInputStep === 'title' && domainTitle.trim()) {
          setDomainInputStep('content');
        } else if (domainInputStep === 'content' && domainContent.trim()) {
          if (mode === 'domain-add') {
            handleAddDomainEntry();
          } else {
            handleUpdateDomainEntry();
          }
        }
      }
      return;
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

  // Settings mode
  if (mode === 'settings' && selectedProject) {
    const settingsItems = [
      { label: t('dictionary.manage_group', language), value: 'dictionary' },
      { label: t('domain.manage_group', language), value: 'domain' },
    ];

    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title={t('project.settings_title', language)}
          subtitle={selectedProject.name}
        />

        <Box marginY={1}>
          <SelectInput
            items={settingsItems}
            onSelect={(item) => {
              if (item.value === 'dictionary') {
                setMode('dictionary-list');
                setDictSelectedIndex(0);
                setError(null);
              } else if (item.value === 'domain') {
                setMode('domain-list');
                setDomainSelectedIndex(0);
                setError(null);
              }
            }}
          />
        </Box>

        <Box marginTop={1}>
          <Text color="gray" dimColor>
            {t('hint.esc_back', language)}
          </Text>
        </Box>
      </Box>
    );
  }

  // Dictionary list mode
  if (mode === 'dictionary-list' && selectedProject) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title={t('dictionary.title', language)}
          subtitle={`${selectedProject.name} - ${ti('dictionary.count', language, { count: dictEntries.length })}`}
        />

        {saving && <Spinner message={t('dictionary.deleting', language)} />}

        {success && (
          <Box marginY={1}>
            <Text color="green">{success}</Text>
          </Box>
        )}

        {error && (
          <Box marginY={1}>
            <ErrorText error={error} language={language} />
          </Box>
        )}

        {!saving && (
          <>
            <Box flexDirection="column" marginY={1} borderStyle="round" borderColor="cyan" paddingX={1}>
              {dictEntries.length === 0 ? (
                <Text color="gray">{t('dictionary.empty', language)}</Text>
              ) : (
                dictEntries.map((entry, index) => (
                  <Box key={entry.id}>
                    <Text color={index === dictSelectedIndex ? 'cyan' : undefined}>
                      {index === dictSelectedIndex ? '> ' : '  '}
                      {entry.source} {t('dictionary.arrow', language)} {entry.target}
                    </Text>
                  </Box>
                ))
              )}
            </Box>

            <Box marginTop={1}>
              <Text color="gray" dimColor>
                {t('dictionary.hint_list', language)}
              </Text>
            </Box>
          </>
        )}
      </Box>
    );
  }

  // Dictionary add/edit mode
  if ((mode === 'dictionary-add' || mode === 'dictionary-edit') && selectedProject) {
    const isEdit = mode === 'dictionary-edit';
    const title = isEdit ? t('dictionary.edit_title', language) : t('dictionary.add_title', language);
    const spinnerMsg = isEdit ? t('dictionary.updating', language) : t('dictionary.adding', language);

    return (
      <Box flexDirection="column" padding={1}>
        <Header title={title} subtitle={selectedProject.name} />

        {saving ? (
          <Spinner message={spinnerMsg} />
        ) : (
          <>
            <Box marginY={1} flexDirection="column">
              <Box>
                <Text color={dictInputStep === 'source' ? 'cyan' : 'gray'}>
                  {t('dictionary.source_label', language)}{' '}
                </Text>
              </Box>
              {dictInputStep === 'source' ? (
                <TextInput
                  value={dictSource}
                  onChange={setDictSource}
                  placeholder={t('dictionary.source_placeholder', language)}
                />
              ) : (
                <Text>{dictSource}</Text>
              )}
            </Box>

            {dictInputStep === 'target' && (
              <Box marginY={1} flexDirection="column">
                <Box>
                  <Text color="cyan">{t('dictionary.target_label', language)} </Text>
                </Box>
                <TextInput
                  value={dictTarget}
                  onChange={setDictTarget}
                  placeholder={t('dictionary.target_placeholder', language)}
                />
              </Box>
            )}

            {error && (
              <Box marginY={1}>
                <ErrorText error={error} language={language} />
              </Box>
            )}

            <Box marginTop={1}>
              <Text color="gray" dimColor>
                {t('dictionary.hint_form', language)}
              </Text>
            </Box>
          </>
        )}
      </Box>
    );
  }

  // Domain list mode
  if (mode === 'domain-list' && selectedProject) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title={t('domain.title', language)}
          subtitle={`${selectedProject.name} - ${ti('domain.count', language, { count: domainEntries.length })}`}
        />

        {saving && <Spinner message={t('domain.deleting', language)} />}

        {success && (
          <Box marginY={1}>
            <Text color="green">{success}</Text>
          </Box>
        )}

        {error && (
          <Box marginY={1}>
            <ErrorText error={error} language={language} />
          </Box>
        )}

        {!saving && (
          <>
            <Box flexDirection="column" marginY={1} borderStyle="round" borderColor="cyan" paddingX={1}>
              {domainEntries.length === 0 ? (
                <Text color="gray">{t('domain.empty', language)}</Text>
              ) : (
                domainEntries.map((entry, index) => (
                  <Box key={entry.id}>
                    <Text color={index === domainSelectedIndex ? 'cyan' : undefined}>
                      {index === domainSelectedIndex ? '> ' : '  '}
                      [{entry.category}] {entry.title}
                    </Text>
                    <Text color={entry.enabled ? 'green' : 'gray'} dimColor={!entry.enabled}>
                      {' '}({entry.enabled ? t('domain.enabled', language) : t('domain.disabled', language)})
                    </Text>
                  </Box>
                ))
              )}
            </Box>

            <Box marginTop={1}>
              <Text color="gray" dimColor>
                {t('domain.hint_list', language)}
              </Text>
            </Box>
          </>
        )}
      </Box>
    );
  }

  // Domain add/edit mode
  if ((mode === 'domain-add' || mode === 'domain-edit') && selectedProject) {
    const isEdit = mode === 'domain-edit';
    const title = isEdit ? t('domain.edit_title', language) : t('domain.add_title', language);
    const spinnerMsg = isEdit ? t('domain.updating', language) : t('domain.adding', language);

    return (
      <Box flexDirection="column" padding={1}>
        <Header title={title} subtitle={selectedProject.name} />

        {saving ? (
          <Spinner message={spinnerMsg} />
        ) : (
          <>
            <Box marginY={1} flexDirection="column">
              <Box>
                <Text color={domainInputStep === 'title' ? 'cyan' : 'gray'}>
                  {t('domain.name_label', language)}{' '}
                </Text>
              </Box>
              {domainInputStep === 'title' ? (
                <TextInput
                  value={domainTitle}
                  onChange={setDomainTitle}
                  placeholder={t('domain.name_placeholder', language)}
                />
              ) : (
                <Text>{domainTitle}</Text>
              )}
            </Box>

            {domainInputStep === 'content' && (
              <Box marginY={1} flexDirection="column">
                <Box>
                  <Text color="cyan">{t('domain.content_label', language)} </Text>
                </Box>
                <TextInput
                  value={domainContent}
                  onChange={setDomainContent}
                  placeholder={t('domain.content_placeholder', language)}
                />
              </Box>
            )}

            {error && (
              <Box marginY={1}>
                <ErrorText error={error} language={language} />
              </Box>
            )}

            <Box marginTop={1}>
              <Text color="gray" dimColor>
                {t('domain.hint_form', language)}
              </Text>
            </Box>
          </>
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
