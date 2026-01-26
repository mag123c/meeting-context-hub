import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { Header } from '../components/Header.js';
import { TextInput } from '../components/TextInput.js';
import { Spinner } from '../components/Spinner.js';
import { ErrorText } from '../components/ErrorDisplay.js';
import { SectionBox } from '../components/SectionBox.js';
import { t, ti } from '../../i18n/index.js';
import type { SearchContextUseCase } from '../../core/usecases/search-context.usecase.js';
import type { SearchResult } from '../../types/index.js';

interface SearchScreenProps {
  searchContextUseCase: SearchContextUseCase;
  onSelectContext: (contextId: string) => void;
  goBack: () => void;
  language?: 'ko' | 'en';
}

type Mode = 'input' | 'results';

export function SearchScreen({
  searchContextUseCase,
  onSelectContext,
  goBack,
  language = 'en',
}: SearchScreenProps): React.ReactElement {
  const [mode, setMode] = useState<Mode>('input');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchMethod, setSearchMethod] = useState<'semantic' | 'keyword' | 'hybrid'>('keyword');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setError(new Error(t('search.empty_query', language)));
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const result = await searchContextUseCase.execute({
        query: query.trim(),
        limit: 20,
      });

      setResults(result.results);
      setSearchMethod(result.method);
      setMode('results');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Search failed'));
    } finally {
      setSearching(false);
    }
  }, [query, searchContextUseCase, language]);

  useInput((_, key) => {
    if (key.escape) {
      if (mode === 'results') {
        setMode('input');
        setResults([]);
      } else {
        goBack();
      }
      return;
    }

    if (key.return && mode === 'input' && query.trim() && !searching) {
      handleSearch();
    }
  });

  if (searching) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('search.title', language)} subtitle={t('search.searching', language)} />
        <Spinner message={t('search.searching', language)} />
      </Box>
    );
  }

  if (mode === 'results') {
    if (results.length === 0) {
      return (
        <Box flexDirection="column" padding={1}>
          <Header
            title={t('search.results_title', language)}
            subtitle={ti('search.results_subtitle', language, { query, count: 0, method: searchMethod })}
          />

          <SectionBox color="yellow">
            <Text color="yellow">{t('search.no_results', language)}</Text>
          </SectionBox>

          <Box marginTop={1}>
            <Text color="gray" dimColor>
              {t('search.hint_results', language)}
            </Text>
          </Box>
        </Box>
      );
    }

    const items = results.map((result, index) => {
      const scoreText = searchMethod === 'semantic'
        ? ` (${(result.score * 100).toFixed(0)}%)`
        : '';
      return {
        label: `${index + 1}. ${result.context.title}${scoreText}`,
        value: result.context.id,
      };
    });

    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title={t('search.results_title', language)}
          subtitle={ti('search.results_subtitle', language, { query, count: results.length, method: searchMethod })}
        />

        <SectionBox color="cyan">
          <SelectInput
            items={items}
            onSelect={(item) => onSelectContext(item.value)}
          />
        </SectionBox>

        <Box marginTop={1}>
          <Text color="gray" dimColor>
            {t('search.hint_results', language)}
          </Text>
        </Box>
      </Box>
    );
  }

  // Input mode
  return (
    <Box flexDirection="column" padding={1}>
      <Header
        title={t('search.title', language)}
        subtitle={t('search.subtitle', language)}
      />

      <SectionBox color="cyan" title={t('search.label', language)}>
        <TextInput
          value={query}
          onChange={setQuery}
          placeholder={t('search.placeholder', language)}
        />
      </SectionBox>

      {error && (
        <Box marginY={1}>
          <ErrorText error={error} language={language} />
        </Box>
      )}

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          {t('search.hint_input', language)}
        </Text>
      </Box>
    </Box>
  );
}
