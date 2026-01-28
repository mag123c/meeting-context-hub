import React, { useState, useCallback, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { Header } from '../components/Header.js';
import { MultilineInput } from '../components/MultilineInput.js';
import { FilePathInput } from '../components/FilePathInput.js';
import { Spinner } from '../components/Spinner.js';
import { ContextCard } from '../components/ContextCard.js';
import { ErrorDisplay } from '../components/ErrorDisplay.js';
import { SectionBox } from '../components/SectionBox.js';
import { t } from '../../i18n/index.js';
import { PathCompletionService } from '../../core/services/path-completion.service.js';
import { FileValidationService } from '../../core/services/file-validation.service.js';
import { InputError, ErrorCode } from '../../types/errors.js';
import type { AddContextUseCase } from '../../core/usecases/add-context.usecase.js';
import type { ManageProjectUseCase } from '../../core/usecases/manage-project.usecase.js';
import type { RecordContextUseCase } from '../../core/usecases/record-context.usecase.js';
import type { Project, Context, SearchResult } from '../../types/index.js';

interface AddContextProps {
  addContextUseCase: AddContextUseCase;
  manageProjectUseCase: ManageProjectUseCase;
  recordContextUseCase?: RecordContextUseCase | null;
  onNavigateToContext?: (contextId: string) => void;
  goBack: () => void;
  language?: 'ko' | 'en';
}

type InputMode = 'text' | 'file';
type Step = 'select-project' | 'input' | 'transcribing' | 'extracting' | 'result' | 'error';

export function AddContext({
  addContextUseCase,
  manageProjectUseCase,
  recordContextUseCase,
  onNavigateToContext,
  goBack,
  language = 'en',
}: AddContextProps): React.ReactElement {
  const [step, setStep] = useState<Step>('select-project');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [input, setInput] = useState('');
  const [filePath, setFilePath] = useState('');
  const [completions, setCompletions] = useState<string[]>([]);
  const [result, setResult] = useState<Context | null>(null);
  const [relatedContexts, setRelatedContexts] = useState<SearchResult[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  // Services for file path completion and validation
  const pathCompletionService = useMemo(() => new PathCompletionService(), []);
  const fileValidationService = useMemo(() => new FileValidationService(), []);

  // Whether file mode is available (requires OpenAI key for Whisper)
  const fileInputAvailable = !!recordContextUseCase;

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

  // Handle text mode submit
  const handleTextSubmit = useCallback(async () => {
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

  // Handle file mode submit
  const handleFileSubmit = useCallback(async () => {
    if (!filePath.trim() || !recordContextUseCase) return;

    // Expand path and validate
    const expandedPath = pathCompletionService.expandPath(filePath);
    const validation = fileValidationService.validateAudioFile(expandedPath);

    if (!validation.valid) {
      if (validation.errorCode === 'FILE_NOT_FOUND') {
        setError(
          new InputError(
            validation.error || 'File not found',
            ErrorCode.TRANSCRIPTION_FILE_NOT_FOUND
          )
        );
      } else {
        setError(
          new InputError(
            validation.error || 'Invalid file extension',
            ErrorCode.INVALID_FILE_EXTENSION
          )
        );
      }
      setStep('error');
      return;
    }

    setStep('transcribing');
    setError(null);

    try {
      // Transcribe audio file
      const transcription = await recordContextUseCase.transcribe(expandedPath);

      setStep('extracting');

      // Process transcription (extract, embed, chain, save)
      const { context, relatedContexts: related } =
        await recordContextUseCase.processTranscription(transcription, selectedProjectId);

      setResult(context);
      setRelatedContexts(related);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to process audio file'));
      setStep('error');
    }
  }, [filePath, selectedProjectId, recordContextUseCase, pathCompletionService, fileValidationService]);

  // Handle Tab for autocomplete or mode switch
  const handleTabComplete = useCallback(() => {
    if (!fileInputAvailable) return;

    // If input is empty, switch mode
    if (inputMode === 'text' && !input.trim()) {
      setInputMode('file');
      return;
    }
    if (inputMode === 'file' && !filePath.trim()) {
      setInputMode('text');
      return;
    }

    // In file mode, do autocomplete
    if (inputMode === 'file' && filePath.trim()) {
      const expanded = pathCompletionService.expandPath(filePath);
      const comps = pathCompletionService.getCompletions(expanded);
      setCompletions(comps);

      if (comps.length === 1) {
        // Single match - apply completion
        setFilePath(comps[0]);
        setCompletions([]);
      } else if (comps.length > 1) {
        // Multiple matches - apply common prefix
        const commonPrefix = pathCompletionService.findCommonPrefix(comps);
        if (commonPrefix.length > expanded.length) {
          setFilePath(commonPrefix);
        }
      }
    }
  }, [inputMode, input, filePath, fileInputAvailable, pathCompletionService]);

  // Handle file path changes
  const handleFilePathChange = useCallback((value: string) => {
    setFilePath(value);
    // Clear completions when user types
    if (completions.length > 0) {
      setCompletions([]);
    }
  }, [completions.length]);

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
  }, { isActive: step !== 'input' });

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
    const projectName = selectedProjectId
      ? `${t('add.project_prefix', language)} ${projects.find(p => p.id === selectedProjectId)?.name}`
      : t('add.no_project', language);

    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('add.title', language)} subtitle={projectName} />

        {/* Mode tabs (only show if file input is available) */}
        {fileInputAvailable && (
          <Box marginBottom={1}>
            <Text
              color={inputMode === 'text' ? 'cyan' : 'gray'}
              bold={inputMode === 'text'}
            >
              [{inputMode === 'text' ? '●' : '○'} {t('add.mode_text', language)}]
            </Text>
            <Text> </Text>
            <Text
              color={inputMode === 'file' ? 'cyan' : 'gray'}
              bold={inputMode === 'file'}
            >
              [{inputMode === 'file' ? '●' : '○'} {t('add.mode_file', language)}]
            </Text>
          </Box>
        )}

        {inputMode === 'text' ? (
          <MultilineInput
            value={input}
            onChange={setInput}
            onSubmit={handleTextSubmit}
            onCancel={() => setStep('select-project')}
            placeholder={t('add.placeholder', language)}
            focus={true}
          />
        ) : (
          <Box flexDirection="column">
            <FilePathInput
              value={filePath}
              onChange={handleFilePathChange}
              onSubmit={handleFileSubmit}
              onCancel={() => setStep('select-project')}
              onTabComplete={handleTabComplete}
              placeholder={t('add.file_placeholder', language)}
              focus={true}
              completions={completions}
            />
            <Box marginTop={1}>
              <Text color="gray" dimColor>
                {t('add.supported_formats', language)} {fileValidationService.formatSupportedExtensions()}
              </Text>
            </Box>
            <Box marginTop={1}>
              <Text color="gray" dimColor>
                {t('add.hint_file', language)}
              </Text>
            </Box>
          </Box>
        )}
      </Box>
    );
  }

  if (step === 'transcribing') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('add.title', language)} />
        <Spinner message={t('add.transcribing', language)} />
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
