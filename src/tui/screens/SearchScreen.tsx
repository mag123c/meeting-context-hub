import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { Header } from '../components/Header.js';
import { TextInput } from '../components/TextInput.js';
import { Spinner } from '../components/Spinner.js';
import type { SearchContextUseCase } from '../../core/usecases/search-context.usecase.js';
import type { SearchResult } from '../../types/index.js';

interface SearchScreenProps {
  searchContextUseCase: SearchContextUseCase;
  onSelectContext: (contextId: string) => void;
  goBack: () => void;
}

type Mode = 'input' | 'results';

export function SearchScreen({
  searchContextUseCase,
  onSelectContext,
  goBack,
}: SearchScreenProps): React.ReactElement {
  const [mode, setMode] = useState<Mode>('input');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchMethod, setSearchMethod] = useState<'semantic' | 'keyword' | 'hybrid'>('keyword');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
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
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  }, [query, searchContextUseCase]);

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
        <Header title="Search" subtitle="Searching contexts..." />
        <Spinner message="Searching..." />
      </Box>
    );
  }

  if (mode === 'results') {
    if (results.length === 0) {
      return (
        <Box flexDirection="column" padding={1}>
          <Header
            title="Search Results"
            subtitle={`Query: "${query}" (${searchMethod})`}
          />

          <Box marginY={1}>
            <Text color="yellow">No results found</Text>
          </Box>

          <Box marginTop={1}>
            <Text color="gray" dimColor>
              Press ESC to search again
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
          title="Search Results"
          subtitle={`Query: "${query}" | ${results.length} results (${searchMethod})`}
        />

        <Box marginY={1} flexDirection="column">
          <SelectInput
            items={items}
            onSelect={(item) => onSelectContext(item.value)}
          />
        </Box>

        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Enter to view | ESC to search again
          </Text>
        </Box>
      </Box>
    );
  }

  // Input mode
  return (
    <Box flexDirection="column" padding={1}>
      <Header
        title="Search Contexts"
        subtitle="Enter keywords or a question to find related contexts"
      />

      <Box marginY={1} flexDirection="column">
        <Text bold>Search Query:</Text>
        <Box marginTop={1}>
          <TextInput
            value={query}
            onChange={setQuery}
            placeholder="e.g., payment API, authentication flow..."
          />
        </Box>
      </Box>

      {error && (
        <Box marginY={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          Enter to search | ESC to go back
        </Text>
      </Box>
    </Box>
  );
}
