import { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { Header, Menu, Spinner, ErrorBanner, KeyHintBar, ContextList, type MenuItem } from "../components/index.js";
import type { NavigationContext } from "../App.js";
import type { AppServices } from "../../core/factories.js";
import type { Context } from "../../types/context.types.js";
import type { SearchResult } from "../../core/search-context.usecase.js";
import { useTranslation } from "../../i18n/index.js";

interface SearchScreenProps {
  navigation: NavigationContext;
  services: AppServices;
  onSelectContext: (context: Context) => void;
}

type Step = "mode" | "query" | "searching" | "results";
type SearchMode = "semantic" | "exact" | "tag";

export function SearchScreen({ navigation, services, onSelectContext }: SearchScreenProps) {
  const { t } = useTranslation();

  const modeItems: MenuItem[] = [
    { label: t.search.modes.semantic, value: "semantic" },
    { label: t.search.modes.exact, value: "exact" },
    { label: t.search.modes.tag, value: "tag" },
  ];
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
            <Text bold>{t.search.selectMode}</Text>
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
                ? t.search.enterQuery
                : mode === "exact"
                ? t.search.enterExactText
                : t.search.enterTag}
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
        return <Spinner message={t.search.searching} />;

      case "results":
        if (error) {
          return (
            <Box flexDirection="column">
              <ErrorBanner message={error} />
              <Text dimColor>{t.common.pressEscToGoBack}</Text>
            </Box>
          );
        }

        if (results.length === 0) {
          return (
            <Box flexDirection="column">
              <Text>{t.search.noResults.replace("{query}", query)}</Text>
              <Box marginTop={1}>
                <Text dimColor>{t.search.newSearchHint}</Text>
              </Box>
            </Box>
          );
        }

        return (
          <Box flexDirection="column">
            <Text bold>
              {t.search.foundResults
                .replace("{count}", String(results.length))
                .replace("{plural}", results.length > 1 ? "s" : "")
                .replace("{query}", query)}
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
        { key: "Enter", description: t.search.keyHints.select },
        { key: "Esc", description: t.search.keyHints.back },
      ];
    }
    if (step === "searching") {
      return [];
    }
    if (step === "results") {
      return [
        { key: "↑↓", description: t.search.keyHints.navigate },
        { key: "Enter", description: t.search.keyHints.view },
        { key: "n", description: t.search.keyHints.newSearch },
        { key: "Esc", description: t.search.keyHints.back },
      ];
    }
    return [
      { key: "Enter", description: t.search.keyHints.search },
      { key: "Esc", description: t.search.keyHints.back },
    ];
  };

  return (
    <Box flexDirection="column">
      <Header title={t.search.title} breadcrumb={t.search.breadcrumb} />
      {renderStep()}
      {step !== "searching" && <KeyHintBar bindings={getKeyBindings()} />}
    </Box>
  );
}
