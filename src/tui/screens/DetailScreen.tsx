import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput } from '../components/TextInput.js';
import SelectInput from 'ink-select-input';
import { Header } from '../components/Header.js';
import { Spinner } from '../components/Spinner.js';
import { SectionBox } from '../components/SectionBox.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';
import { GroupSelector } from '../components/GroupSelector.js';
import { StringListEditor } from '../components/StringListEditor.js';
import { MultilineInput } from '../components/MultilineInput.js';
import { ErrorText } from '../components/ErrorDisplay.js';
import { useExternalEditor } from '../hooks/useExternalEditor.js';
import { t } from '../../i18n/index.js';
import type { GetContextUseCase } from '../../core/usecases/get-context.usecase.js';
import type { ManageProjectUseCase } from '../../core/usecases/manage-project.usecase.js';
import type { ManageContextUseCase } from '../../core/usecases/manage-context.usecase.js';
import type { SearchContextUseCase } from '../../core/usecases/search-context.usecase.js';
import type { TranslateContextUseCase, TranslatePreview } from '../../core/usecases/translate-context.usecase.js';
import type { Context, Project, SearchResult } from '../../types/index.js';

type EditableField = 'title' | 'summary' | 'decisions' | 'policies' | 'tags';

interface DetailScreenProps {
  contextId: string;
  getContextUseCase: GetContextUseCase;
  manageProjectUseCase: ManageProjectUseCase;
  manageContextUseCase: ManageContextUseCase;
  searchContextUseCase?: SearchContextUseCase;
  translateContextUseCase?: TranslateContextUseCase;
  onNavigateToContext?: (contextId: string) => void;
  onDeleted?: () => void;
  goBack: () => void;
  language?: 'ko' | 'en';
}

export function DetailScreen({
  contextId,
  getContextUseCase,
  manageProjectUseCase,
  manageContextUseCase,
  searchContextUseCase,
  translateContextUseCase,
  onNavigateToContext,
  onDeleted,
  goBack,
  language = 'en',
}: DetailScreenProps): React.ReactElement {
  const [context, setContext] = useState<Context | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [relatedContexts, setRelatedContexts] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRelated, setShowRelated] = useState(false);

  // Dialog states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit mode states
  const [showEditMode, setShowEditMode] = useState(false);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editStringValue, setEditStringValue] = useState('');
  const [editListValue, setEditListValue] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Translation states
  const [showTranslateSelector, setShowTranslateSelector] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatePreview, setTranslatePreview] = useState<TranslatePreview | null>(null);
  const [translateError, setTranslateError] = useState<Error | null>(null);
  const [applyingTranslation, setApplyingTranslation] = useState(false);

  // External editor
  const { handleOpenEditor, editorAvailable } = useExternalEditor({
    getValue: () => editStringValue,
    onResult: (content) => setEditStringValue(content),
  });

  // Load context data
  useEffect(() => {
    async function load() {
      try {
        const ctx = await getContextUseCase.execute(contextId);
        if (!ctx) {
          setError(t('detail.not_found', language));
          setLoading(false);
          return;
        }
        setContext(ctx);

        if (ctx.projectId) {
          const proj = await manageProjectUseCase.getProject(ctx.projectId);
          setProject(proj);
        }

        // Load related contexts if search service available
        if (searchContextUseCase && ctx.embedding) {
          try {
            const related = await searchContextUseCase.findRelated(contextId, { limit: 5 });
            setRelatedContexts(related);
          } catch {
            // Ignore errors loading related contexts
          }
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load context');
        setLoading(false);
      }
    }
    load();
  }, [contextId, getContextUseCase, manageProjectUseCase, searchContextUseCase, language]);

  // Load projects for group selector
  const loadProjects = useCallback(async () => {
    try {
      const projectList = await manageProjectUseCase.listProjects();
      setProjects(projectList);
    } catch {
      // Ignore errors
    }
  }, [manageProjectUseCase]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await manageContextUseCase.deleteContext(contextId);
      if (onDeleted) {
        onDeleted();
      } else {
        goBack();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [contextId, manageContextUseCase, onDeleted, goBack]);

  // Handle group change
  const handleGroupSelect = useCallback(
    async (projectId: string | null) => {
      try {
        await manageContextUseCase.changeGroup(contextId, projectId);

        // Update local state
        if (projectId === null) {
          setProject(null);
        } else {
          const newProject = await manageProjectUseCase.getProject(projectId);
          setProject(newProject);
        }

        // Also update context's projectId
        setContext((prev) => (prev ? { ...prev, projectId } : null));

        setShowGroupSelector(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to change group');
      }
    },
    [contextId, manageContextUseCase, manageProjectUseCase]
  );

  // Handle create new group
  const handleCreateGroup = useCallback(
    async (name: string) => {
      const newProject = await manageProjectUseCase.createProject(name);
      // After creating, select it
      await handleGroupSelect(newProject.id);
    },
    [manageProjectUseCase, handleGroupSelect]
  );

  // Handle field selection for editing
  const handleFieldSelect = useCallback(
    (field: EditableField) => {
      if (!context) return;
      setEditingField(field);

      switch (field) {
        case 'title':
          setEditStringValue(context.title);
          break;
        case 'summary':
          setEditStringValue(context.summary);
          break;
        case 'decisions':
          setEditListValue([...context.decisions]);
          break;
        case 'policies':
          setEditListValue([...context.policies]);
          break;
        case 'tags':
          setEditListValue([...context.tags]);
          break;
      }
    },
    [context]
  );

  // Handle save edit
  const handleSaveEdit = useCallback(async () => {
    if (!context || !editingField) return;

    setSaving(true);
    try {
      const updates: Record<string, unknown> = {};

      switch (editingField) {
        case 'title':
          updates.title = editStringValue;
          break;
        case 'summary':
          updates.summary = editStringValue;
          break;
        case 'decisions':
          updates.decisions = editListValue;
          break;
        case 'policies':
          updates.policies = editListValue;
          break;
        case 'tags':
          updates.tags = editListValue;
          break;
      }

      await manageContextUseCase.updateContext(contextId, updates);

      // Update local state
      setContext((prev) => (prev ? { ...prev, ...updates } : null));

      setEditingField(null);
      setEditStringValue('');
      setEditListValue([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [context, editingField, editStringValue, editListValue, contextId, manageContextUseCase]);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    if (editingField) {
      setEditingField(null);
      setEditStringValue('');
      setEditListValue([]);
    } else {
      setShowEditMode(false);
    }
  }, [editingField]);

  // Handle translation language selection
  const handleSelectTranslateLanguage = useCallback(
    async (targetLanguage: 'ko' | 'en') => {
      if (!translateContextUseCase) return;

      setTranslating(true);
      setTranslateError(null);
      setShowTranslateSelector(false);

      try {
        const preview = await translateContextUseCase.preview(contextId, targetLanguage);
        setTranslatePreview(preview);
      } catch (err) {
        setTranslateError(err instanceof Error ? err : new Error('Failed to generate preview'));
        setShowTranslateSelector(true);
      } finally {
        setTranslating(false);
      }
    },
    [translateContextUseCase, contextId]
  );

  // Handle apply translation
  const handleApplyTranslation = useCallback(async () => {
    if (!translateContextUseCase || !translatePreview) return;

    setApplyingTranslation(true);
    setTranslateError(null);

    try {
      await translateContextUseCase.apply(translatePreview);

      // Reload context to show updated data
      const updatedContext = await getContextUseCase.execute(contextId);
      if (updatedContext) {
        setContext(updatedContext);
      }

      setTranslatePreview(null);
    } catch (err) {
      setTranslateError(err instanceof Error ? err : new Error('Failed to apply translation'));
    } finally {
      setApplyingTranslation(false);
    }
  }, [translateContextUseCase, translatePreview, getContextUseCase, contextId]);

  // Handle cancel translation
  const handleCancelTranslation = useCallback(() => {
    setTranslatePreview(null);
    setTranslateError(null);
  }, []);

  useInput((input, key) => {
    // Ignore inputs when dialogs are shown
    if (showDeleteConfirm || showGroupSelector || showTranslateSelector) return;

    // Edit mode has its own input handling
    if (showEditMode && editingField) return;

    // Translation preview mode has its own input handling
    if (translatePreview) {
      if (input === 'y' || input === 'Y') {
        handleApplyTranslation();
        return;
      }
      if (input === 'n' || input === 'N' || key.escape) {
        handleCancelTranslation();
        return;
      }
      return;
    }

    if (key.escape) {
      if (showEditMode) {
        handleCancelEdit();
      } else if (showRelated) {
        setShowRelated(false);
      } else {
        goBack();
      }
      return;
    }

    // Edit context with 'e'
    if (input === 'e' && !showEditMode) {
      setShowEditMode(true);
      return;
    }

    // Delete context with 'd'
    if (input === 'd' && !showEditMode) {
      setShowDeleteConfirm(true);
      return;
    }

    // Change group with 'g'
    if (input === 'g' && !showEditMode) {
      loadProjects();
      setShowGroupSelector(true);
      return;
    }

    // Translate context with 't'
    if (input === 't' && !showEditMode && translateContextUseCase) {
      setShowTranslateSelector(true);
      setTranslateError(null);
      return;
    }

    // Toggle related contexts view with 'r'
    if (input === 'r' && relatedContexts.length > 0 && !showEditMode) {
      setShowRelated(!showRelated);
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Spinner message={t('detail.loading', language)} />
      </Box>
    );
  }

  if (error || !context) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('common.error', language)} />
        <Text color="red">{error || t('detail.not_found', language)}</Text>
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            {t('hint.esc_back', language)}
          </Text>
        </Box>
      </Box>
    );
  }

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
        <Header title={context.title} />
        <ConfirmDialog
          title={t('dialog.delete_context_title', language)}
          message={t('dialog.delete_context_message', language)}
          confirmLabel={t('common.delete', language)}
          cancelLabel={t('common.cancel', language)}
          destructive
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </Box>
    );
  }

  // Show group selector
  if (showGroupSelector) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title={context.title} />
        <GroupSelector
          projects={projects}
          currentProjectId={context.projectId}
          onSelect={handleGroupSelect}
          onCreate={handleCreateGroup}
          onCancel={() => setShowGroupSelector(false)}
          language={language}
        />
      </Box>
    );
  }

  // Show translation language selector
  if (showTranslateSelector) {
    const languageItems = [
      { label: t('translate.to_korean', language), value: 'ko' as const },
      { label: t('translate.to_english', language), value: 'en' as const },
    ];

    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title={t('translate.title', language)}
          subtitle={t('translate.select_language', language)}
        />

        <SectionBox title={t('translate.original', language)} color="gray">
          <Text bold>{context.title}</Text>
          <Text color="gray">{context.summary.substring(0, 100)}{context.summary.length > 100 ? '...' : ''}</Text>
        </SectionBox>

        {translateError && (
          <Box marginY={1}>
            <ErrorText error={translateError} language={language} />
          </Box>
        )}

        <Box marginY={1}>
          <SelectInput
            items={languageItems}
            onSelect={(item) => handleSelectTranslateLanguage(item.value)}
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

  // Show translating spinner
  if (translating) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('translate.title', language)} />
        <Spinner message={t('translate.generating_preview', language)} />
      </Box>
    );
  }

  // Show translation preview
  if (translatePreview) {
    if (applyingTranslation) {
      return (
        <Box flexDirection="column" padding={1}>
          <Header title={t('translate.title', language)} />
          <Spinner message={t('translate.applying', language)} />
        </Box>
      );
    }

    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title={t('translate.preview_title', language)}
          subtitle={t('translate.confirm_message', language)}
        />

        {translateError && (
          <Box marginY={1}>
            <ErrorText error={translateError} language={language} />
          </Box>
        )}

        {/* Original */}
        <SectionBox title={t('translate.original', language)} color="gray">
          <Text bold>{translatePreview.original.title}</Text>
          <Text>{translatePreview.original.summary}</Text>
          {translatePreview.original.decisions.length > 0 && (
            <Box marginTop={1} flexDirection="column">
              <Text color="green" bold>{t('detail.decisions', language)}:</Text>
              {translatePreview.original.decisions.map((d, i) => (
                <Text key={i} color="gray">  • {d}</Text>
              ))}
            </Box>
          )}
        </SectionBox>

        {/* Translated */}
        <SectionBox title={t('translate.translated', language)} color="cyan">
          <Text bold>{translatePreview.translated.title}</Text>
          <Text>{translatePreview.translated.summary}</Text>
          {translatePreview.translated.decisions.length > 0 && (
            <Box marginTop={1} flexDirection="column">
              <Text color="green" bold>{t('detail.decisions', language)}:</Text>
              {translatePreview.translated.decisions.map((d, i) => (
                <Text key={i} color="cyan">  • {d}</Text>
              ))}
            </Box>
          )}
        </SectionBox>

        <Box marginTop={1}>
          <Text color="gray" dimColor>
            {t('translate.hint_preview', language)}
          </Text>
        </Box>
      </Box>
    );
  }

  // Show edit mode
  if (showEditMode) {
    // Saving state
    if (saving) {
      return (
        <Box flexDirection="column" padding={1}>
          <Spinner message={t('edit.saving', language)} />
        </Box>
      );
    }

    // Editing a specific field
    if (editingField) {
      const isStringField = editingField === 'title' || editingField === 'summary';
      const fieldLabel =
        editingField === 'title'
          ? t('edit.field_title', language)
          : editingField === 'summary'
            ? t('edit.field_summary', language)
            : editingField === 'decisions'
              ? t('edit.field_decisions', language)
              : editingField === 'policies'
                ? t('edit.field_policies', language)
                : t('edit.field_tags', language);

      return (
        <Box flexDirection="column" padding={1}>
          <Header title={t('edit.title', language)} subtitle={fieldLabel} />

          {isStringField ? (
            editingField === 'summary' ? (
              <MultilineInput
                value={editStringValue}
                onChange={setEditStringValue}
                onSubmit={handleSaveEdit}
                onCancel={handleCancelEdit}
                onOpenEditor={editorAvailable ? handleOpenEditor : undefined}
                placeholder=""
                focus={true}
                maxDisplayLines={15}
              />
            ) : (
              <Box flexDirection="column">
                <TextInput
                  value={editStringValue}
                  onChange={setEditStringValue}
                  onSubmit={handleSaveEdit}
                  onOpenEditor={editorAvailable ? handleOpenEditor : undefined}
                />
                <Box marginTop={1}>
                  <Text color="gray" dimColor>
                    {t('edit.hint_editing', language)}
                  </Text>
                </Box>
              </Box>
            )
          ) : (
            <StringListEditor
              items={editListValue}
              onChange={setEditListValue}
              onDone={handleSaveEdit}
              language={language}
            />
          )}
        </Box>
      );
    }

    // Field selection
    const fieldItems = [
      { label: t('edit.field_title', language), value: 'title' as EditableField },
      { label: t('edit.field_summary', language), value: 'summary' as EditableField },
      { label: t('edit.field_decisions', language), value: 'decisions' as EditableField },
      { label: t('edit.field_policies', language), value: 'policies' as EditableField },
      { label: t('edit.field_tags', language), value: 'tags' as EditableField },
    ];

    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('edit.title', language)} subtitle={t('edit.select_field', language)} />
        <SectionBox color="cyan">
          <SelectInput
            items={fieldItems}
            onSelect={(item) => handleFieldSelect(item.value)}
          />
        </SectionBox>
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            {t('edit.hint_field_select', language)}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Header
        title={context.title}
        subtitle={`${t('list.project', language)} ${project?.name || t('list.uncategorized', language)} | ${new Date(context.createdAt).toLocaleString()}`}
      />

      {/* Summary */}
      <SectionBox title={t('detail.summary', language)} color="cyan">
        <Text>{context.summary}</Text>
      </SectionBox>

      {/* Decisions */}
      {context.decisions.length > 0 && (
        <SectionBox title={`${t('detail.decisions', language)} (${context.decisions.length})`} color="green">
          {context.decisions.map((decision, i) => (
            <Text key={i}>• {decision}</Text>
          ))}
        </SectionBox>
      )}

      {/* Action Items */}
      {context.actionItems.length > 0 && (
        <SectionBox title={`${t('detail.action_items', language)} (${context.actionItems.length})`} color="yellow">
          {context.actionItems.map((item, i) => (
            <Box key={i} flexDirection="column">
              <Text>• {item.task}</Text>
              {item.assignee && <Text color="gray">  {t('detail.assignee', language)} {item.assignee}</Text>}
              {item.dueDate && <Text color="gray">  {t('detail.due_date', language)} {item.dueDate}</Text>}
            </Box>
          ))}
        </SectionBox>
      )}

      {/* Policies */}
      {context.policies.length > 0 && (
        <SectionBox title={`${t('detail.policies', language)} (${context.policies.length})`} color="blue">
          {context.policies.map((policy, i) => (
            <Text key={i}>• {policy}</Text>
          ))}
        </SectionBox>
      )}

      {/* Open Questions */}
      {context.openQuestions.length > 0 && (
        <SectionBox title={`${t('detail.open_questions', language)} (${context.openQuestions.length})`} color="magenta">
          {context.openQuestions.map((question, i) => (
            <Text key={i}>• {question}</Text>
          ))}
        </SectionBox>
      )}

      {/* Tags */}
      {context.tags.length > 0 && (
        <Box marginY={1}>
          <Text bold>{t('detail.tags', language)} </Text>
          <Text color="magenta">#{context.tags.join(' #')}</Text>
        </Box>
      )}

      {/* Related Contexts */}
      {relatedContexts.length > 0 && !showRelated && (
        <SectionBox title={`${t('detail.related', language)} (${relatedContexts.length})`} color="cyan">
          <Text color="gray" dimColor>
            {t('detail.hint_related', language)}
          </Text>
        </SectionBox>
      )}

      {showRelated && relatedContexts.length > 0 && (
        <SectionBox title={t('detail.related', language)} color="cyan">
          <SelectInput
            items={relatedContexts.map((result, i) => ({
              label: `${i + 1}. ${result.context.title} (${(result.score * 100).toFixed(0)}%)`,
              value: result.context.id,
            }))}
            onSelect={(item) => {
              if (onNavigateToContext) {
                onNavigateToContext(item.value);
              }
            }}
          />
        </SectionBox>
      )}

      <SectionBox borderStyle="single" color="gray" marginY={1}>
        <Text color="gray" dimColor>
          {showRelated ? t('detail.hint_view_related', language) : ''}
          {relatedContexts.length > 0 && !showRelated ? t('detail.hint_r_related', language) : ''}
          {t('detail.hint', language)}
        </Text>
      </SectionBox>
    </Box>
  );
}
