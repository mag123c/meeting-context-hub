import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { Header } from '../components/Header.js';
import { Spinner } from '../components/Spinner.js';
import type { GetContextUseCase } from '../../core/usecases/get-context.usecase.js';
import type { ManageProjectUseCase } from '../../core/usecases/manage-project.usecase.js';
import type { SearchContextUseCase } from '../../core/usecases/search-context.usecase.js';
import type { Context, Project, SearchResult } from '../../types/index.js';

interface DetailScreenProps {
  contextId: string;
  getContextUseCase: GetContextUseCase;
  manageProjectUseCase: ManageProjectUseCase;
  searchContextUseCase?: SearchContextUseCase;
  onNavigateToContext?: (contextId: string) => void;
  goBack: () => void;
}

export function DetailScreen({
  contextId,
  getContextUseCase,
  manageProjectUseCase,
  searchContextUseCase,
  onNavigateToContext,
  goBack,
}: DetailScreenProps): React.ReactElement {
  const [context, setContext] = useState<Context | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [relatedContexts, setRelatedContexts] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRelated, setShowRelated] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const ctx = await getContextUseCase.execute(contextId);
        if (!ctx) {
          setError('Context not found');
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
  }, [contextId, getContextUseCase, manageProjectUseCase, searchContextUseCase]);

  useInput((input, key) => {
    if (key.escape) {
      if (showRelated) {
        setShowRelated(false);
      } else {
        goBack();
      }
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
        <Spinner message="Loading context..." />
      </Box>
    );
  }

  if (error || !context) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title="Error" />
        <Text color="red">{error || 'Context not found'}</Text>
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Press ESC to go back
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Header
        title={context.title}
        subtitle={`Project: ${project?.name || 'Uncategorized'} | ${new Date(context.createdAt).toLocaleString()}`}
      />

      {/* Summary */}
      <Box marginY={1} flexDirection="column">
        <Text bold color="cyan">Summary</Text>
        <Text>{context.summary}</Text>
      </Box>

      {/* Decisions */}
      {context.decisions.length > 0 && (
        <Box marginY={1} flexDirection="column">
          <Text bold color="green">Decisions ({context.decisions.length})</Text>
          {context.decisions.map((decision, i) => (
            <Text key={i}>  • {decision}</Text>
          ))}
        </Box>
      )}

      {/* Action Items */}
      {context.actionItems.length > 0 && (
        <Box marginY={1} flexDirection="column">
          <Text bold color="yellow">Action Items ({context.actionItems.length})</Text>
          {context.actionItems.map((item, i) => (
            <Box key={i} flexDirection="column">
              <Text>  • {item.task}</Text>
              {item.assignee && <Text color="gray">    Assignee: {item.assignee}</Text>}
              {item.dueDate && <Text color="gray">    Due: {item.dueDate}</Text>}
            </Box>
          ))}
        </Box>
      )}

      {/* Policies */}
      {context.policies.length > 0 && (
        <Box marginY={1} flexDirection="column">
          <Text bold color="blue">Policies ({context.policies.length})</Text>
          {context.policies.map((policy, i) => (
            <Text key={i}>  • {policy}</Text>
          ))}
        </Box>
      )}

      {/* Open Questions */}
      {context.openQuestions.length > 0 && (
        <Box marginY={1} flexDirection="column">
          <Text bold color="magenta">Open Questions ({context.openQuestions.length})</Text>
          {context.openQuestions.map((question, i) => (
            <Text key={i}>  • {question}</Text>
          ))}
        </Box>
      )}

      {/* Tags */}
      {context.tags.length > 0 && (
        <Box marginY={1}>
          <Text bold>Tags: </Text>
          <Text color="magenta">#{context.tags.join(' #')}</Text>
        </Box>
      )}

      {/* Related Contexts */}
      {relatedContexts.length > 0 && !showRelated && (
        <Box marginY={1} flexDirection="column">
          <Text bold color="cyan">
            Related Contexts ({relatedContexts.length})
          </Text>
          <Text color="gray" dimColor>
            Press 'r' to view related contexts
          </Text>
        </Box>
      )}

      {showRelated && relatedContexts.length > 0 && (
        <Box marginY={1} flexDirection="column">
          <Text bold color="cyan">Related Contexts</Text>
          <Box marginTop={1}>
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
          </Box>
        </Box>
      )}

      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="gray" dimColor>
          {showRelated ? 'Enter to view | ' : ''}
          {relatedContexts.length > 0 && !showRelated ? "r for related | " : ''}
          ESC to go back
        </Text>
      </Box>
    </Box>
  );
}
