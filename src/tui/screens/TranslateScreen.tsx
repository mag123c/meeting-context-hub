import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { Header } from '../components/Header.js';
import { Spinner } from '../components/Spinner.js';
import { SectionBox } from '../components/SectionBox.js';
import { ErrorText } from '../components/ErrorDisplay.js';
import { t, ti } from '../../i18n/index.js';
import type { TranslateContextUseCase, TranslatePreview } from '../../core/usecases/translate-context.usecase.js';
import type { Context } from '../../types/index.js';

interface TranslateScreenProps {
  translateContextUseCase: TranslateContextUseCase;
  goBack: () => void;
  language?: 'ko' | 'en';
}

type Mode = 'select-context' | 'select-language' | 'generating' | 'preview' | 'applying' | 'success';

const PAGE_SIZE = 10;

export function TranslateScreen({
  translateContextUseCase,
  goBack,
  language = 'en',
}: TranslateScreenProps): React.ReactElement {
  const [mode, setMode] = useState<Mode>('select-context');
  const [contexts, setContexts] = useState<Context[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedContext, setSelectedContext] = useState<Context | null>(null);
  const [preview, setPreview] = useState<TranslatePreview | null>(null);

  const loadContexts = useCallback(async () => {
    try {
      setLoading(true);
      const result = await translateContextUseCase.listContextsForTranslation({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setContexts(result);
      // Estimate total - in real implementation this should come from the use case
      setTotal(result.length === PAGE_SIZE ? (page + 2) * PAGE_SIZE : (page * PAGE_SIZE) + result.length);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load contexts'));
      setLoading(false);
    }
  }, [translateContextUseCase, page]);

  useEffect(() => {
    if (mode === 'select-context') {
      loadContexts();
    }
  }, [mode, loadContexts]);

  const handleSelectLanguage = useCallback(async (targetLanguage: 'ko' | 'en') => {
    if (!selectedContext) return;

    setMode('generating');
    setError(null);

    try {
      const result = await translateContextUseCase.preview(selectedContext.id, targetLanguage);
      setPreview(result);
      setMode('preview');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to generate preview'));
      setMode('select-language');
    }
  }, [selectedContext, translateContextUseCase]);

  const handleApply = useCallback(async () => {
    if (!preview) return;

    setMode('applying');
    setError(null);

    try {
      await translateContextUseCase.apply(preview);
      setMode('success');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to apply translation'));
      setMode('preview');
    }
  }, [preview, translateContextUseCase]);

  useInput((input, key) => {
    if (key.escape) {
      if (mode === 'select-context') {
        goBack();
      } else if (mode === 'select-language') {
        setMode('select-context');
        setSelectedContext(null);
      } else if (mode === 'preview') {
        setMode('select-language');
        setPreview(null);
      } else if (mode === 'success') {
        goBack();
      }
      return;
    }

    if (mode === 'select-context' && !loading && contexts.length > 0) {
      if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(contexts.length - 1, prev + 1));
      } else if (key.return) {
        const selected = contexts[selectedIndex];
        if (selected) {
          setSelectedContext(selected);
          setMode('select-language');
        }
      } else if (input === 'n' && contexts.length === PAGE_SIZE) {
        setPage((prev) => prev + 1);
        setSelectedIndex(0);
      } else if (input === 'p' && page > 0) {
        setPage((prev) => prev - 1);
        setSelectedIndex(0);
      }
    }

    if (mode === 'preview') {
      if (input === 'y' || input === 'Y') {
        handleApply();
      } else if (input === 'n' || input === 'N') {
        setMode('select-language');
        setPreview(null);
      }
    }

    if (mode === 'success' && key.return) {
      goBack();
    }
  });

  // Select Context mode
  if (mode === 'select-context') {
    if (loading) {
      return (
        <Box flexDirection="column" padding={1}>
          <Header title={t('translate.title', language)} />
          <Spinner message={t('common.loading', language)} />
        </Box>
      );
    }

    if (error) {
      return (
        <Box flexDirection="column" padding={1}>
          <Header title={t('translate.title', language)} />
          <ErrorText error={error} language={language} />
          <Box marginTop={1}>
            <Text color="gray" dimColor>
              {t('hint.esc_back', language)}
            </Text>
          </Box>
        </Box>
      );
    }

    if (contexts.length === 0) {
      return (
        <Box flexDirection="column" padding={1}>
          <Header title={t('translate.title', language)} />
          <SectionBox color="gray">
            <Text color="gray">{t('translate.empty', language)}</Text>
          </SectionBox>
          <Box marginTop={1}>
            <Text color="gray" dimColor>
              {t('hint.esc_back', language)}
            </Text>
          </Box>
        </Box>
      );
    }

    const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title={t('translate.title', language)}
          subtitle={t('translate.select_context', language)}
        />

        <SectionBox color="cyan">
          {contexts.map((context, index) => (
            <Box key={context.id} flexDirection="column" marginBottom={index < contexts.length - 1 ? 1 : 0}>
              <Text color={index === selectedIndex ? 'cyan' : undefined}>
                {index === selectedIndex ? '> ' : '  '}
                {context.title}
              </Text>
              <Text color="gray" dimColor>
                {'  '}{context.summary.substring(0, 60)}{context.summary.length > 60 ? '...' : ''}
              </Text>
            </Box>
          ))}
        </SectionBox>

        <Box marginTop={1}>
          <Text color="gray" dimColor>
            {ti('list.subtitle', language, { total, page: page + 1, totalPages })}
          </Text>
        </Box>

        <Box marginTop={1}>
          <Text color="gray" dimColor>
            {t('translate.hint_select', language)}
          </Text>
        </Box>
      </Box>
    );
  }

  // Select Language mode
  if (mode === 'select-language') {
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

        {selectedContext && (
          <SectionBox title={t('translate.original', language)} color="gray">
            <Text bold>{selectedContext.title}</Text>
            <Text color="gray">{selectedContext.summary}</Text>
          </SectionBox>
        )}

        {error && (
          <Box marginY={1}>
            <ErrorText error={error} language={language} />
          </Box>
        )}

        <Box marginY={1}>
          <SelectInput
            items={languageItems}
            onSelect={(item) => handleSelectLanguage(item.value)}
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

  // Generating preview mode
  if (mode === 'generating') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('translate.title', language)} />
        <Spinner message={t('translate.generating_preview', language)} />
      </Box>
    );
  }

  // Preview mode
  if (mode === 'preview' && preview) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title={t('translate.preview_title', language)}
          subtitle={t('translate.confirm_message', language)}
        />

        {error && (
          <Box marginY={1}>
            <ErrorText error={error} language={language} />
          </Box>
        )}

        {/* Original */}
        <SectionBox title={t('translate.original', language)} color="gray">
          <Text bold>{preview.original.title}</Text>
          <Text>{preview.original.summary}</Text>
          {preview.original.decisions.length > 0 && (
            <Box marginTop={1} flexDirection="column">
              <Text color="green" bold>{t('detail.decisions', language)}:</Text>
              {preview.original.decisions.map((d, i) => (
                <Text key={i} color="gray">  • {d}</Text>
              ))}
            </Box>
          )}
        </SectionBox>

        {/* Translated */}
        <SectionBox title={t('translate.translated', language)} color="cyan">
          <Text bold>{preview.translated.title}</Text>
          <Text>{preview.translated.summary}</Text>
          {preview.translated.decisions.length > 0 && (
            <Box marginTop={1} flexDirection="column">
              <Text color="green" bold>{t('detail.decisions', language)}:</Text>
              {preview.translated.decisions.map((d, i) => (
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

  // Applying mode
  if (mode === 'applying') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('translate.title', language)} />
        <Spinner message={t('translate.applying', language)} />
      </Box>
    );
  }

  // Success mode
  if (mode === 'success') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('translate.title', language)} />
        <SectionBox color="green">
          <Text color="green">{t('translate.success', language)}</Text>
        </SectionBox>
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            {t('hint.enter_continue', language)} | {t('hint.esc_back', language)}
          </Text>
        </Box>
      </Box>
    );
  }

  // Default fallback
  return (
    <Box flexDirection="column" padding={1}>
      <Header title={t('translate.title', language)} />
      <Text color="gray">{t('common.loading', language)}</Text>
    </Box>
  );
}
