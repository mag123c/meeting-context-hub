import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { Header } from '../components/Header.js';
import { TextInput } from '../components/TextInput.js';
import { Spinner } from '../components/Spinner.js';
import { ContextCard } from '../components/ContextCard.js';
import { ErrorDisplay } from '../components/ErrorDisplay.js';
import { SectionBox } from '../components/SectionBox.js';
import { t } from '../../i18n/index.js';
import type { AddContextUseCase } from '../../core/usecases/add-context.usecase.js';
import type { ManageProjectUseCase } from '../../core/usecases/manage-project.usecase.js';
import type { Project, Context, SearchResult } from '../../types/index.js';

interface AddContextProps {
  addContextUseCase: AddContextUseCase;
  manageProjectUseCase: ManageProjectUseCase;
  onNavigateToContext?: (contextId: string) => void;
  goBack: () => void;
  language?: 'ko' | 'en';
}

type Step = 'select-project' | 'input' | 'extracting' | 'result' | 'error';

export function AddContext({
  addContextUseCase,
  manageProjectUseCase,
  onNavigateToContext,
  goBack,
  language = 'en',
}: AddContextProps): React.ReactElement {
  const [step, setStep] = useState<Step>('select-project');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<Context | null>(null);
  const [relatedContexts, setRelatedContexts] = useState<SearchResult[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  // Load projects on mount
  React.useEffect(() => {
    async function loadProjects() {
      try {
        const projectList = await manageProjectUseCase.listProjects();
        setProjects(projectList);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load projects'));
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
    setError(null);

    try {
      const { context, relatedContexts: related } = await addContextUseCase.execute({
        rawInput: input,
        projectId: selectedProjectId,
      });
      setResult(context);
      setRelatedContexts(related);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to extract context'));
      setStep('error');
    }
  }, [input, selectedProjectId, addContextUseCase]);

  const handleRetry = useCallback(() => {
    setError(null);
    setStep('input');
  }, []);

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
        <Header title={t('add.title', language)} />
        <Spinner message={t('add.loading_projects', language)} />
      </Box>
    );
  }

  if (step === 'select-project') {
    const projectItems = [
      { label: t('add.no_project', language), value: 'none' },
      ...projects.map(p => ({ label: p.name, value: p.id })),
    ];

    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('add.title', language)} subtitle={t('add.select_project', language)} />
        <SectionBox color="cyan">
          <SelectInput items={projectItems} onSelect={handleProjectSelect} />
        </SectionBox>
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            {t('hint.esc_back', language)}
          </Text>
        </Box>
      </Box>
    );
  }

  if (step === 'input') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title={t('add.title', language)}
          subtitle={selectedProjectId ? `${t('add.project_prefix', language)} ${projects.find(p => p.id === selectedProjectId)?.name}` : t('add.no_project', language)}
        />
        <SectionBox color="cyan" title={t('add.input_hint', language)}>
          <TextInput
            value={input}
            onChange={setInput}
            placeholder={t('add.placeholder', language)}
          />
        </SectionBox>
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            {t('add.hint', language)}
          </Text>
        </Box>
      </Box>
    );
  }

  if (step === 'extracting') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('add.title', language)} />
        <Spinner message={t('add.extracting', language)} />
      </Box>
    );
  }

  if (step === 'result' && result) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('add.success_title', language)} subtitle={t('add.success_subtitle', language)} />
        <SectionBox color="green">
          <ContextCard context={result} />
          <Box marginTop={1}>
            <Text color="green">{t('add.saved', language)}</Text>
          </Box>
        </SectionBox>

        {/* Related Contexts */}
        {relatedContexts.length > 0 && (
          <SectionBox title={`${t('add.related_contexts', language)} (${relatedContexts.length})`} color="cyan">
            {onNavigateToContext ? (
              <SelectInput
                items={relatedContexts.map((r, i) => ({
                  label: `${i + 1}. ${r.context.title} (${(r.score * 100).toFixed(0)}%)`,
                  value: r.context.id,
                }))}
                onSelect={(item) => onNavigateToContext(item.value)}
              />
            ) : (
              relatedContexts.map((r, i) => (
                <Text key={r.context.id} color="gray">
                  {i + 1}. {r.context.title} ({(r.score * 100).toFixed(0)}%)
                </Text>
              ))
            )}
          </SectionBox>
        )}

        <Box marginTop={1}>
          <Text color="gray" dimColor>
            {relatedContexts.length > 0 && onNavigateToContext
              ? t('add.hint_related', language)
              : ''}
            {t('add.hint_result', language)}
          </Text>
        </Box>
      </Box>
    );
  }

  if (step === 'error' && error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('common.error', language)} />
        <ErrorDisplay
          error={error}
          language={language}
          onRetry={handleRetry}
        />
      </Box>
    );
  }

  // Fallback (should never reach here)
  return (
    <Box flexDirection="column" padding={1}>
      <Header title={t('add.title', language)} />
      <Text color="gray">{t('common.loading', language)}</Text>
    </Box>
  );
}
