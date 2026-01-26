import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { Header } from '../components/Header.js';
import { Spinner } from '../components/Spinner.js';
import { SectionBox } from '../components/SectionBox.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';
import { GroupSelector } from '../components/GroupSelector.js';
import { t } from '../../i18n/index.js';
import type { GetContextUseCase } from '../../core/usecases/get-context.usecase.js';
import type { ManageProjectUseCase } from '../../core/usecases/manage-project.usecase.js';
import type { ManageContextUseCase } from '../../core/usecases/manage-context.usecase.js';
import type { SearchContextUseCase } from '../../core/usecases/search-context.usecase.js';
import type { Context, Project, SearchResult } from '../../types/index.js';

interface DetailScreenProps {
  contextId: string;
  getContextUseCase: GetContextUseCase;
  manageProjectUseCase: ManageProjectUseCase;
  manageContextUseCase: ManageContextUseCase;
  searchContextUseCase?: SearchContextUseCase;
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

  useInput((input, key) => {
    // Ignore inputs when dialogs are shown
    if (showDeleteConfirm || showGroupSelector) return;

    if (key.escape) {
      if (showRelated) {
        setShowRelated(false);
      } else {
        goBack();
      }
      return;
    }

    // Delete context with 'd'
    if (input === 'd') {
      setShowDeleteConfirm(true);
      return;
    }

    // Change group with 'g'
    if (input === 'g') {
      loadProjects();
      setShowGroupSelector(true);
      return;
    }

    // Toggle related contexts view with 'r'
    if (input === 'r' && relatedContexts.length > 0) {
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
