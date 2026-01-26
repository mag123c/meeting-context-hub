import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { Header } from '../components/Header.js';
import { TextInput } from '../components/TextInput.js';
import { Spinner } from '../components/Spinner.js';
import { ContextCard } from '../components/ContextCard.js';
import type { RecordContextUseCase } from '../../core/usecases/record-context.usecase.js';
import type { ManageProjectUseCase } from '../../core/usecases/manage-project.usecase.js';
import type { Project, Context, SearchResult } from '../../types/index.js';

interface RecordScreenProps {
  recordContextUseCase: RecordContextUseCase;
  manageProjectUseCase: ManageProjectUseCase;
  onNavigateToContext?: (contextId: string) => void;
  goBack: () => void;
}

type Step =
  | 'select-project'
  | 'ready'
  | 'recording'
  | 'transcribing'
  | 'review'
  | 'extracting'
  | 'result'
  | 'error';

export function RecordScreen({
  recordContextUseCase,
  manageProjectUseCase,
  onNavigateToContext,
  goBack,
}: RecordScreenProps): React.ReactElement {
  const [step, setStep] = useState<Step>('select-project');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [editedTranscription, setEditedTranscription] = useState('');
  const [result, setResult] = useState<Context | null>(null);
  const [relatedContexts, setRelatedContexts] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load projects on mount
  useEffect(() => {
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
          setError(err.message);
          setStep('error');
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setStep('error');
    }
  }, [recordContextUseCase]);

  const stopAndTranscribe = useCallback(async () => {
    setStep('transcribing');

    try {
      const filePath = recordContextUseCase.stopRecording();
      if (!filePath) {
        throw new Error('No recording to process');
      }

      const text = await recordContextUseCase.transcribe(filePath);
      setEditedTranscription(text);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transcribe');
      setStep('error');
    }
  }, [recordContextUseCase]);

  const processTranscription = useCallback(async () => {
    setStep('extracting');

    try {
      const { context, relatedContexts: related } = await recordContextUseCase.processTranscription(
        editedTranscription,
        selectedProjectId
      );
      setResult(context);
      setRelatedContexts(related);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract context');
      setStep('error');
    }
  }, [editedTranscription, selectedProjectId, recordContextUseCase]);

  useInput((input, key) => {
    if (key.escape) {
      if (step === 'recording') {
        // Cancel recording
        recordContextUseCase.stopRecording();
        setStep('ready');
      } else if (step === 'result' || step === 'error') {
        goBack();
      } else if (step === 'review') {
        setStep('ready');
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
      stopAndTranscribe();
      return;
    }

    // Ctrl+Enter to submit transcription
    if (key.ctrl && key.return && step === 'review' && editedTranscription.trim()) {
      processTranscription();
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
        <Header title="Record Meeting" />
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
        <Header title="Record Meeting" subtitle="Select a project (or none)" />
        <SelectInput items={projectItems} onSelect={handleProjectSelect} />
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            ESC to go back
          </Text>
        </Box>
      </Box>
    );
  }

  if (step === 'ready') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title="Record Meeting"
          subtitle={selectedProjectId ? `Project: ${projects.find(p => p.id === selectedProjectId)?.name}` : 'No project'}
        />

        <Box marginY={2} flexDirection="column" alignItems="center">
          <Text color="cyan" bold>
            🎙️ Ready to Record
          </Text>
          <Box marginTop={1}>
            <Text>Press SPACE to start recording</Text>
          </Box>
        </Box>

        <Box marginTop={1}>
          <Text color="gray" dimColor>
            SPACE to start | ESC to go back
          </Text>
        </Box>
      </Box>
    );
  }

  if (step === 'recording') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title="Recording..." subtitle="Speak clearly into your microphone" />

        <Box marginY={2} flexDirection="column" alignItems="center">
          <Text color="red" bold>
            🔴 Recording
          </Text>
          <Box marginTop={1}>
            <Text bold color="yellow">
              {formatDuration(duration)}
            </Text>
          </Box>
        </Box>

        <Box marginTop={1}>
          <Text color="gray" dimColor>
            SPACE to stop | ESC to cancel
          </Text>
        </Box>
      </Box>
    );
  }

  if (step === 'transcribing') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title="Processing" />
        <Spinner message="Transcribing audio with Whisper..." />
      </Box>
    );
  }

  if (step === 'review') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title="Review Transcription"
          subtitle="Edit if needed, then submit"
        />

        <Box marginY={1} flexDirection="column">
          <Text bold>Transcription:</Text>
          <Box marginTop={1} borderStyle="round" borderColor="gray" padding={1}>
            <TextInput
              value={editedTranscription}
              onChange={setEditedTranscription}
              placeholder="(transcription will appear here)"
            />
          </Box>
        </Box>

        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Ctrl+Enter to extract | ESC to re-record
          </Text>
        </Box>
      </Box>
    );
  }

  if (step === 'extracting') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title="Processing" />
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

  // Fallback
  return (
    <Box flexDirection="column" padding={1}>
      <Header title="Record Meeting" />
      <Text color="gray">Loading...</Text>
    </Box>
  );
}
