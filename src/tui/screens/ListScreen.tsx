import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Header } from '../components/Header.js';
import { Spinner } from '../components/Spinner.js';
import { ContextCard } from '../components/ContextCard.js';
import { t, ti } from '../../i18n/index.js';
import type { ListContextsUseCase } from '../../core/usecases/list-contexts.usecase.js';
import type { ManageProjectUseCase } from '../../core/usecases/manage-project.usecase.js';
import type { Context, Project } from '../../types/index.js';
import type { Screen } from '../hooks/useNavigation.js';

interface ListScreenProps {
  listContextsUseCase: ListContextsUseCase;
  manageProjectUseCase: ManageProjectUseCase;
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  language?: 'ko' | 'en';
}

const PAGE_SIZE = 5;

export function ListScreen({
  listContextsUseCase,
  manageProjectUseCase,
  navigate,
  goBack,
  language = 'ko',
}: ListScreenProps): React.ReactElement {
  const [contexts, setContexts] = useState<Context[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [projectList, result] = await Promise.all([
          manageProjectUseCase.listProjects(),
          listContextsUseCase.execute({ limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
        ]);
        setProjects(projectList);
        setContexts(result.contexts);
        setTotal(result.total);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contexts');
        setLoading(false);
      }
    }
    load();
  }, [listContextsUseCase, manageProjectUseCase, page]);

  useInput((input, key) => {
    if (key.escape) {
      goBack();
      return;
    }

    if (loading || contexts.length === 0) return;

    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => Math.min(contexts.length - 1, prev + 1));
    } else if (key.return) {
      const selected = contexts[selectedIndex];
      if (selected) {
        navigate('detail', { contextId: selected.id });
      }
    } else if (input === 'n' && (page + 1) * PAGE_SIZE < total) {
      setPage(prev => prev + 1);
      setSelectedIndex(0);
      setLoading(true);
    } else if (input === 'p' && page > 0) {
      setPage(prev => prev - 1);
      setSelectedIndex(0);
      setLoading(true);
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('list.title', language)} />
        <Spinner message={t('list.loading', language)} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('common.error', language)} />
        <Text color="red">{error}</Text>
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            {t('hint.esc_back', language)}
          </Text>
        </Box>
      </Box>
    );
  }

  const getProjectName = (projectId: string | null): string => {
    if (!projectId) return t('list.uncategorized', language);
    return projects.find(p => p.id === projectId)?.name || 'Unknown';
  };

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <Box flexDirection="column" padding={1}>
      <Header
        title={t('list.title', language)}
        subtitle={ti('list.subtitle', language, { total, page: page + 1, totalPages })}
      />

      {contexts.length === 0 ? (
        <Box marginY={1}>
          <Text color="gray">{t('list.empty', language)}</Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          {contexts.map((context, index) => (
            <Box key={context.id} flexDirection="column">
              {index === selectedIndex && <Text color="cyan">&gt; </Text>}
              <ContextCard context={context} selected={index === selectedIndex} />
              <Text color="gray" dimColor>
                {t('list.project', language)} {getProjectName(context.projectId)}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      <Box marginTop={1} flexDirection="column">
        <Text color="gray" dimColor>
          {t('list.hint', language)}
        </Text>
      </Box>
    </Box>
  );
}
