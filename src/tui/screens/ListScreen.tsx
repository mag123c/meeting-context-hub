import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Header } from '../components/Header.js';
import { Spinner } from '../components/Spinner.js';
import { ContextCard } from '../components/ContextCard.js';
import type { ListContextsUseCase } from '../../core/usecases/list-contexts.usecase.js';
import type { ManageProjectUseCase } from '../../core/usecases/manage-project.usecase.js';
import type { Context, Project } from '../../types/index.js';
import type { Screen } from '../hooks/useNavigation.js';

interface ListScreenProps {
  listContextsUseCase: ListContextsUseCase;
  manageProjectUseCase: ManageProjectUseCase;
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
}

const PAGE_SIZE = 5;

export function ListScreen({
  listContextsUseCase,
  manageProjectUseCase,
  navigate,
  goBack,
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
        <Header title="Contexts" />
        <Spinner message="Loading contexts..." />
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title="Error" />
        <Text color="red">{error}</Text>
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Press ESC to go back
          </Text>
        </Box>
      </Box>
    );
  }

  const getProjectName = (projectId: string | null): string => {
    if (!projectId) return 'Uncategorized';
    return projects.find(p => p.id === projectId)?.name || 'Unknown';
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Header
        title="Contexts"
        subtitle={`${total} total | Page ${page + 1} of ${Math.ceil(total / PAGE_SIZE) || 1}`}
      />

      {contexts.length === 0 ? (
        <Box marginY={1}>
          <Text color="gray">No contexts yet. Add one from the main menu!</Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          {contexts.map((context, index) => (
            <Box key={context.id} flexDirection="column">
              {index === selectedIndex && <Text color="cyan">&gt; </Text>}
              <ContextCard context={context} selected={index === selectedIndex} />
              <Text color="gray" dimColor>
                Project: {getProjectName(context.projectId)}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      <Box marginTop={1} flexDirection="column">
        <Text color="gray" dimColor>
          ↑/↓ Navigate | Enter: View details | n: Next page | p: Previous page | ESC: Back
        </Text>
      </Box>
    </Box>
  );
}
