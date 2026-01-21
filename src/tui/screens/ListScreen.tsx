import { useState, useEffect, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { Header, Menu, Spinner, ErrorBanner, KeyHintBar, ContextList, type MenuItem } from "../components/index.js";
import type { NavigationContext } from "../App.js";
import type { AppServices } from "../../core/factories.js";
import type { Context, ContextType, ListOptions } from "../../types/context.types.js";

interface ListScreenProps {
  navigation: NavigationContext;
  services: AppServices;
  onSelectContext: (context: Context) => void;
}

type Step = "loading" | "list" | "filter";
type FilterType = "none" | "tag" | "type" | "project" | "sprint";

const PAGE_SIZE = 10;

const filterItems: MenuItem[] = [
  { label: "No Filter", value: "none" },
  { label: "Filter by Tag", value: "tag" },
  { label: "Filter by Type", value: "type" },
  { label: "Filter by Project", value: "project" },
  { label: "Filter by Sprint", value: "sprint" },
];

const typeItems: MenuItem[] = [
  { label: "Text", value: "text" },
  { label: "Image", value: "image" },
  { label: "Audio", value: "audio" },
  { label: "File", value: "file" },
];

export function ListScreen({ navigation, services, onSelectContext }: ListScreenProps) {
  const [step, setStep] = useState<Step>("loading");
  const [contexts, setContexts] = useState<Context[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterType, setFilterType] = useState<FilterType>("none");
  const [filterValue, setFilterValue] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const loadContexts = useCallback(async (options?: ListOptions) => {
    setStep("loading");
    setError(null);

    try {
      const results = await services.repository.findAll(options);
      setContexts(results);
      setSelectedIndex(0);
      setPage(0);
      setStep("list");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contexts");
      setStep("list");
    }
  }, [services.repository]);

  useEffect(() => {
    loadContexts();
  }, [loadContexts]);

  useInput((input, key) => {
    if (key.escape) {
      if (showFilterMenu || showTypeMenu) {
        setShowFilterMenu(false);
        setShowTypeMenu(false);
      } else if (step === "filter") {
        setStep("list");
      } else {
        navigation.goBack();
      }
      return;
    }

    if (showFilterMenu || showTypeMenu || step === "filter") {
      return;
    }

    if (step === "list" && contexts.length > 0) {
      const startIndex = page * PAGE_SIZE;
      const endIndex = Math.min(startIndex + PAGE_SIZE, contexts.length);
      const pageItems = endIndex - startIndex;

      if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(pageItems - 1, prev + 1));
      } else if (key.return) {
        const actualIndex = startIndex + selectedIndex;
        onSelectContext(contexts[actualIndex]);
      } else if (input === "n" || key.rightArrow) {
        // Next page
        const maxPage = Math.ceil(contexts.length / PAGE_SIZE) - 1;
        if (page < maxPage) {
          setPage((prev) => prev + 1);
          setSelectedIndex(0);
        }
      } else if (input === "p" || key.leftArrow) {
        // Previous page
        if (page > 0) {
          setPage((prev) => prev - 1);
          setSelectedIndex(0);
        }
      } else if (input === "f") {
        // Filter
        setShowFilterMenu(true);
      } else if (input === "r") {
        // Refresh / clear filter
        setFilterType("none");
        setFilterValue("");
        loadContexts();
      }
    }
  });

  const handleFilterSelect = useCallback((item: MenuItem) => {
    const type = item.value as FilterType;
    setFilterType(type);
    setShowFilterMenu(false);

    if (type === "none") {
      setFilterValue("");
      loadContexts();
    } else if (type === "type") {
      setShowTypeMenu(true);
    } else {
      setStep("filter");
    }
  }, [loadContexts]);

  const handleTypeSelect = useCallback((item: MenuItem) => {
    setFilterValue(item.value);
    setShowTypeMenu(false);
    loadContexts({ type: item.value as ContextType });
  }, [loadContexts]);

  const handleFilterSubmit = useCallback((value: string) => {
    if (!value.trim()) {
      setStep("list");
      return;
    }
    setFilterValue(value);
    setStep("list");

    const options: ListOptions = {};
    if (filterType === "tag") {
      options.tags = [value];
    } else if (filterType === "project") {
      options.project = value;
    } else if (filterType === "sprint") {
      options.sprint = value;
    }
    loadContexts(options);
  }, [filterType, loadContexts]);

  const renderContent = () => {
    if (showFilterMenu) {
      return (
        <Box flexDirection="column">
          <Text bold>Select filter:</Text>
          <Box marginTop={1}>
            <Menu items={filterItems} onSelect={handleFilterSelect} />
          </Box>
        </Box>
      );
    }

    if (showTypeMenu) {
      return (
        <Box flexDirection="column">
          <Text bold>Select type:</Text>
          <Box marginTop={1}>
            <Menu items={typeItems} onSelect={handleTypeSelect} />
          </Box>
        </Box>
      );
    }

    if (step === "loading") {
      return <Spinner message="Loading contexts..." />;
    }

    if (step === "filter") {
      return (
        <Box flexDirection="column">
          <Text bold>
            Enter {filterType} to filter:
          </Text>
          <Box marginTop={1}>
            <Text color="cyan">{"> "}</Text>
            <TextInput
              value={filterValue}
              onChange={setFilterValue}
              onSubmit={handleFilterSubmit}
            />
          </Box>
        </Box>
      );
    }

    if (error) {
      return (
        <Box flexDirection="column">
          <ErrorBanner message={error} />
          <Text dimColor>Press [r] to retry</Text>
        </Box>
      );
    }

    if (contexts.length === 0) {
      return (
        <Box flexDirection="column">
          <Text>No contexts found.</Text>
          {filterType !== "none" && (
            <Text dimColor>Press [r] to clear filter</Text>
          )}
        </Box>
      );
    }

    const startIndex = page * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, contexts.length);
    const pageContexts = contexts.slice(startIndex, endIndex);
    const totalPages = Math.ceil(contexts.length / PAGE_SIZE);

    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text>
            Showing {startIndex + 1}-{endIndex} of {contexts.length}
            {filterType !== "none" && (
              <Text dimColor> (filtered by {filterType}: {filterValue})</Text>
            )}
          </Text>
        </Box>
        <ContextList contexts={pageContexts} selectedIndex={selectedIndex} />
        {totalPages > 1 && (
          <Box marginTop={1}>
            <Text dimColor>
              Page {page + 1}/{totalPages}
            </Text>
          </Box>
        )}
      </Box>
    );
  };

  const getKeyBindings = () => {
    if (showFilterMenu || showTypeMenu) {
      return [
        { key: "Enter", description: "Select" },
        { key: "Esc", description: "Cancel" },
      ];
    }
    if (step === "filter") {
      return [
        { key: "Enter", description: "Apply" },
        { key: "Esc", description: "Cancel" },
      ];
    }
    if (step === "loading") {
      return [];
    }
    return [
      { key: "↑↓", description: "Navigate" },
      { key: "←→", description: "Page" },
      { key: "Enter", description: "View" },
      { key: "f", description: "Filter" },
      { key: "r", description: "Refresh" },
      { key: "Esc", description: "Back" },
    ];
  };

  return (
    <Box flexDirection="column">
      <Header title="List Contexts" breadcrumb={["Main", "List"]} />
      {renderContent()}
      {step !== "loading" && <KeyHintBar bindings={getKeyBindings()} />}
    </Box>
  );
}
