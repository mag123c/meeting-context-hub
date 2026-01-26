import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { Header } from '../components/Header.js';
import { TextInput } from '../components/TextInput.js';
import { Spinner } from '../components/Spinner.js';
import { ContextCard } from '../components/ContextCard.js';
import type { AddContextUseCase } from '../../core/usecases/add-context.usecase.js';
import type { ManageProjectUseCase } from '../../core/usecases/manage-project.usecase.js';
import type { Project, Context, SearchResult } from '../../types/index.js';

interface AddContextProps {
  addContextUseCase: AddContextUseCase;
  manageProjectUseCase: ManageProjectUseCase;
  onNavigateToContext?: (contextId: string) => void;
  goBack: () => void;
}

type Step = 'select-project' | 'input' | 'extracting' | 'result' | 'error';

export function AddContext({
  addContextUseCase,
  manageProjectUseCase,
  onNavigateToContext,
  goBack,
}: AddContextProps): React.ReactElement {
  const [step, setStep] = useState<Step>('select-project');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<Context | null>(null);
  const [relatedContexts, setRelatedContexts] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load projects on mount
  React.useEffect(() => {
    async function loadProjects() {
      try {
        const projectList = await manageProjectUseCase.listProjects();
        setProjects(projectList);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load projects');
        setStep('error');
        setLoading(false);
      }
    }
    loadProjects();
  }, [manageProjectUseCase]);

  const handleProjectSelect = useCallback((item: { value: string }) => {
    setSelectedProjectId(item.value === 'none' ? null : item.value);
    setStep('input');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) return;

    setStep('extracting');

    try {
      const { context, relatedContexts: related } = await addContextUseCase.execute({
        rawInput: input,
        projectId: selectedProjectId,
      });
      setResult(context);
      setRelatedContexts(related);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract context');
      setStep('error');
    }
  }, [input, selectedProjectId, addContextUseCase]);

  useInput((_, key) => {
    if (key.escape) {
      if (step === 'result' || step === 'error') {
        goBack();
      } else if (step === 'input') {
        setStep('select-project');
      } else {
        goBack();
      }
    }

    // Submit on Ctrl+Enter for multiline input
    if (key.ctrl && key.return && step === 'input') {
      handleSubmit();
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title="Add Context" />
        <Spinner message="Loading projects..." />
      </Box>
    );
  }

  if (step === 'select-project') {
    const projectItems = [
      { label: '(No Project)', value: 'none' },
      ...projects.map(p => ({ label: p.name, value: p.id })),
    ];

    return (
      <Box flexDirection="column" padding={1}>
        <Header title="Add Context" subtitle="Select a project (or none)" />
        <SelectInput items={projectItems} onSelect={handleProjectSelect} />
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            ESC to go back
          </Text>
        </Box>
      </Box>
    );
  }

  if (step === 'input') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title="Add Context"
          subtitle={selectedProjectId ? `Project: ${projects.find(p => p.id === selectedProjectId)?.name}` : 'No project'}
        />
        <Box marginBottom={1}>
          <Text color="gray">
            Enter your meeting notes or discussion (Ctrl+Enter to submit):
          </Text>
        </Box>
        <TextInput
          value={input}
          onChange={setInput}
          placeholder="Type your meeting notes here..."
        />
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Ctrl+Enter to extract | ESC to go back
          </Text>
        </Box>
      </Box>
    );
  }

  if (step === 'extracting') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title="Add Context" />
        <Spinner message="Extracting insights with AI..." />
      </Box>
    );
  }

  if (step === 'result' && result) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title="Context Added!" subtitle="Successfully extracted and saved" />
        <ContextCard context={result} />
        <Box marginTop={1}>
          <Text color="green">Context saved successfully!</Text>
        </Box>

        {/* Related Contexts */}
        {relatedContexts.length > 0 && (
          <Box marginTop={1} flexDirection="column">
            <Text bold color="cyan">
              Related Contexts ({relatedContexts.length})
            </Text>
            {onNavigateToContext ? (
              <Box marginTop={1}>
                <SelectInput
                  items={relatedContexts.map((r, i) => ({
                    label: `${i + 1}. ${r.context.title} (${(r.score * 100).toFixed(0)}%)`,
                    value: r.context.id,
                  }))}
                  onSelect={(item) => onNavigateToContext(item.value)}
                />
              </Box>
            ) : (
              relatedContexts.map((r, i) => (
                <Text key={r.context.id} color="gray">
                  {i + 1}. {r.context.title} ({(r.score * 100).toFixed(0)}%)
                </Text>
              ))
            )}
          </Box>
        )}

        <Box marginTop={1}>
          <Text color="gray" dimColor>
            {relatedContexts.length > 0 && onNavigateToContext
              ? 'Enter to view related | '
              : ''}
            Press ESC to return to menu
          </Text>
        </Box>
      </Box>
    );
  }

  if (step === 'error') {
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

  // Fallback (should never reach here)
  return (
    <Box flexDirection="column" padding={1}>
      <Header title="Add Context" />
      <Text color="gray">Loading...</Text>
    </Box>
  );
}
