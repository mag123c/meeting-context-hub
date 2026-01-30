import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { Header } from '../components/Header.js';
import { Spinner } from '../components/Spinner.js';
import { ContextCard } from '../components/ContextCard.js';
import { ErrorDisplay } from '../components/ErrorDisplay.js';
import { t } from '../../i18n/index.js';
import type { RecordContextUseCase } from '../../core/usecases/record-context.usecase.js';
import type { ManageProjectUseCase } from '../../core/usecases/manage-project.usecase.js';
import type { Project, Context, SearchResult } from '../../types/index.js';

interface RecordScreenProps {
  recordContextUseCase: RecordContextUseCase;
  manageProjectUseCase: ManageProjectUseCase;
  onNavigateToContext?: (contextId: string) => void;
  goBack: () => void;
  language?: 'ko' | 'en';
  contextLanguage?: 'ko' | 'en';
}

type Step =
  | 'select-project'
  | 'ready'
  | 'recording'
  | 'transcribing'
  | 'extracting'
  | 'result'
  | 'error';

export function RecordScreen({
  recordContextUseCase,
  manageProjectUseCase,
  onNavigateToContext,
  goBack,
  language = 'en',
  contextLanguage = 'en',
}: RecordScreenProps): React.ReactElement {
  const [step, setStep] = useState<Step>('select-project');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [result, setResult] = useState<Context | null>(null);
  const [relatedContexts, setRelatedContexts] = useState<SearchResult[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  // Load projects on mount
  useEffect(() => {
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

  // Update duration while recording
  useEffect(() => {
    if (step !== 'recording') return;

    const interval = setInterval(() => {
      setDuration(recordContextUseCase.getRecordingDuration());
    }, 1000);

    return () => clearInterval(interval);
  }, [step, recordContextUseCase]);

  const handleProjectSelect = useCallback((item: { value: string }) => {
    setSelectedProjectId(item.value === 'none' ? null : item.value);
    setStep('ready');
  }, []);

  const startRecording = useCallback(() => {
    try {
      recordContextUseCase.startRecording({
        onStart: () => {
          setStep('recording');
          setDuration(0);
        },
        onError: (err) => {
          setError(err);
          setStep('error');
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to start recording'));
      setStep('error');
    }
  }, [recordContextUseCase]);

  const stopAndProcess = useCallback(async () => {
    setStep('transcribing');
    setError(null);

    try {
      const filePath = recordContextUseCase.stopRecording();
      if (!filePath) {
        throw new Error('No recording to process');
      }

      const text = await recordContextUseCase.transcribe(filePath);
      setStep('extracting');

      const { context, relatedContexts: related } = await recordContextUseCase.processTranscription(
        text,
        selectedProjectId,
        { language: contextLanguage }
      );
      setResult(context);
      setRelatedContexts(related);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to process recording'));
      setStep('error');
    }
  }, [selectedProjectId, recordContextUseCase, contextLanguage]);

  const handleRetry = useCallback(() => {
    setError(null);
    setStep('ready');
  }, []);

  useInput((input, key) => {
    if (key.escape) {
      if (step === 'recording') {
        // Cancel recording
        recordContextUseCase.stopRecording();
        setStep('ready');
      } else if (step === 'result' || step === 'error') {
        goBack();
      } else if (step === 'ready') {
        setStep('select-project');
      } else {
        goBack();
      }
      return;
    }

    // Space to start/stop recording
    if (input === ' ' && step === 'ready') {
      startRecording();
      return;
    }

    if (input === ' ' && step === 'recording') {
      stopAndProcess();
      return;
    }
  });

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('record.title', language)} />
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
        <Header title={t('record.title', language)} subtitle={t('record.select_project', language)} />
        <SelectInput items={projectItems} onSelect={handleProjectSelect} />
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            {t('hint.esc_back', language)}
          </Text>
        </Box>
      </Box>
    );
  }

  if (step === 'ready') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title={t('record.title', language)}
          subtitle={selectedProjectId ? `${t('add.project_prefix', language)} ${projects.find(p => p.id === selectedProjectId)?.name}` : t('add.no_project', language)}
        />

        <Box marginY={2} flexDirection="column" alignItems="center">
          <Text color="cyan" bold>
            {t('record.ready', language)}
          </Text>
          <Box marginTop={1}>
            <Text>{t('record.start_hint', language)}</Text>
          </Box>
        </Box>

        <Box marginTop={1}>
          <Text color="gray" dimColor>
            {t('record.ready_hint', language)}
          </Text>
        </Box>
      </Box>
    );
  }

  if (step === 'recording') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('record.recording', language)} subtitle={t('record.recording_subtitle', language)} />

        <Box marginY={2} flexDirection="column" alignItems="center">
          <Text color="red" bold>
            {t('record.recording', language)}
          </Text>
          <Box marginTop={1}>
            <Text bold color="yellow">
              {formatDuration(duration)}
            </Text>
          </Box>
        </Box>

        <Box marginTop={1}>
          <Text color="gray" dimColor>
            {t('record.stop_hint', language)}
          </Text>
        </Box>
      </Box>
    );
  }

  if (step === 'transcribing') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('record.processing', language)} />
        <Spinner message={t('record.transcribing', language)} />
      </Box>
    );
  }

  if (step === 'extracting') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('record.processing', language)} />
        <Spinner message={t('record.extracting', language)} />
      </Box>
    );
  }

  if (step === 'result' && result) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('record.success_title', language)} subtitle={t('record.success_subtitle', language)} />
        <ContextCard context={result} />
        <Box marginTop={1}>
          <Text color="green">{t('record.saved', language)}</Text>
        </Box>

        {/* Related Contexts */}
        {relatedContexts.length > 0 && (
          <Box marginTop={1} flexDirection="column">
            <Text bold color="cyan">
              {t('add.related_contexts', language)} ({relatedContexts.length})
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

  // Fallback
  return (
    <Box flexDirection="column" padding={1}>
      <Header title={t('record.title', language)} />
      <Text color="gray">{t('common.loading', language)}</Text>
    </Box>
  );
}
