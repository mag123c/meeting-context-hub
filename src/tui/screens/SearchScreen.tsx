import { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { Header, Menu, Spinner, ErrorBanner, KeyHintBar, ContextList, type MenuItem } from "../components/index.js";
import type { NavigationContext } from "../App.js";
import type { AppServices } from "../../core/factories.js";
import type { Context } from "../../types/context.types.js";
import type { SearchResult } from "../../core/search-context.usecase.js";

interface SearchScreenProps {
  navigation: NavigationContext;
  services: AppServices;
  onSelectContext: (context: Context) => void;
}

type Step = "mode" | "query" | "searching" | "results";
type SearchMode = "semantic" | "exact" | "tag";

const modeItems: MenuItem[] = [
  { label: "Semantic Search (AI)", value: "semantic" },
  { label: "Exact Text Match", value: "exact" },
  { label: "Search by Tag", value: "tag" },
];

export function SearchScreen({ navigation, services, onSelectContext }: SearchScreenProps) {
  const [step, setStep] = useState<Step>("mode");
  const [mode, setMode] = useState<SearchMode>("semantic");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Context[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useInput((input, key) => {
    if (key.escape) {
      if (step === "mode") {
        navigation.goBack();
      } else if (step === "results" || step === "query") {
        setStep("mode");
        setResults([]);
        setSelectedIndex(0);
        setError(null);
      }
      return;
    }

    if (step === "results" && results.length > 0) {
      if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(results.length - 1, prev + 1));
      } else if (key.return) {
        onSelectContext(results[selectedIndex]);
      } else if (input === "n") {
        // New search
        setStep("query");
        setQuery("");
        setResults([]);
        setSelectedIndex(0);
      }
    }
  });

  const handleModeSelect = useCallback((item: MenuItem) => {
    setMode(item.value as SearchMode);
    setStep("query");
  }, []);

  const handleQuerySubmit = useCallback(async (value: string) => {
    if (!value.trim()) return;

    setQuery(value);
    setStep("searching");
    setError(null);

    try {
      let searchResult: SearchResult;

      if (mode === "semantic") {
        searchResult = await services.searchContextUseCase.searchByText(value);
      } else if (mode === "exact") {
        searchResult = await services.searchContextUseCase.searchByKeyword(value);
      } else {
        // Tag search
        searchResult = await services.searchContextUseCase.searchByTags([value]);
      }

      setResults(searchResult.contexts);
      setSelectedIndex(0);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setStep("results");
    }
  }, [mode, services.searchContextUseCase]);

  const renderStep = () => {
    switch (step) {
      case "mode":
        return (
          <Box flexDirection="column">
            <Text bold>Select search mode:</Text>
            <Box marginTop={1}>
              <Menu items={modeItems} onSelect={handleModeSelect} />
            </Box>
          </Box>
        );

      case "query":
        return (
          <Box flexDirection="column">
            <Text bold>
              {mode === "semantic"
                ? "Enter search query:"
                : mode === "exact"
                ? "Enter exact text to match:"
                : "Enter tag to search:"}
            </Text>
            <Box marginTop={1}>
              <Text color="cyan">{"> "}</Text>
              <TextInput
                value={query}
                onChange={setQuery}
                onSubmit={handleQuerySubmit}
              />
            </Box>
          </Box>
        );

      case "searching":
        return <Spinner message="Searching..." />;

      case "results":
        if (error) {
          return (
            <Box flexDirection="column">
              <ErrorBanner message={error} />
              <Text dimColor>Press Esc to go back</Text>
            </Box>
          );
        }

        if (results.length === 0) {
          return (
            <Box flexDirection="column">
              <Text>No results found for "{query}"</Text>
              <Box marginTop={1}>
                <Text dimColor>Press [n] for new search, [Esc] to go back</Text>
              </Box>
            </Box>
          );
        }

        return (
          <Box flexDirection="column">
            <Text bold>
              Found {results.length} result{results.length > 1 ? "s" : ""} for "{query}":
            </Text>
            <Box marginTop={1}>
              <ContextList
                contexts={results}
                selectedIndex={selectedIndex}
                showSimilarity={mode === "semantic"}
              />
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  const getKeyBindings = () => {
    if (step === "mode") {
      return [
        { key: "Enter", description: "Select" },
        { key: "Esc", description: "Back" },
      ];
    }
    if (step === "searching") {
      return [];
    }
    if (step === "results") {
      return [
        { key: "↑↓", description: "Navigate" },
        { key: "Enter", description: "View" },
        { key: "n", description: "New search" },
        { key: "Esc", description: "Back" },
      ];
    }
    return [
      { key: "Enter", description: "Search" },
      { key: "Esc", description: "Back" },
    ];
  };

  return (
    <Box flexDirection="column">
      <Header title="Search Contexts" breadcrumb={["Main", "Search"]} />
      {renderStep()}
      {step !== "searching" && <KeyHintBar bindings={getKeyBindings()} />}
    </Box>
  );
}
