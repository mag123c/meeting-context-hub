import { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { Header, Spinner, ErrorBanner, KeyHintBar, ContextList } from "../components/index.js";
import type { NavigationContext } from "../App.js";
import type { AppServices } from "../../core/factories.js";
import type { Context } from "../../types/context.types.js";

interface DetailScreenProps {
  navigation: NavigationContext;
  services: AppServices;
  context: Context | null;
}

type View = "detail" | "similar-loading" | "similar";

function formatDate(date: Date): string {
  return new Date(date).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DetailScreen({ navigation, services, context }: DetailScreenProps) {
  const [view, setView] = useState<View>("detail");
  const [similarContexts, setSimilarContexts] = useState<Context[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadSimilar = useCallback(async () => {
    if (!context) return;

    setView("similar-loading");
    setError(null);

    try {
      const searchResult = await services.searchContextUseCase.searchSimilar(context.id);
      setSimilarContexts(searchResult.contexts);
      setSelectedIndex(0);
      setView("similar");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to find similar contexts");
      setView("detail");
    }
  }, [context, services.searchContextUseCase]);

  useInput((input, key) => {
    if (key.escape) {
      if (view === "similar") {
        setView("detail");
        setSimilarContexts([]);
      } else {
        navigation.goBack();
      }
      return;
    }

    if (view === "detail") {
      if (input === "s") {
        loadSimilar();
      }
    }

    if (view === "similar" && similarContexts.length > 0) {
      if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(similarContexts.length - 1, prev + 1));
      }
    }
  });

  if (!context) {
    return (
      <Box flexDirection="column">
        <Header title="Context Detail" breadcrumb={["Main", "Detail"]} />
        <Text color="red">No context selected</Text>
        <KeyHintBar bindings={[{ key: "Esc", description: "Back" }]} />
      </Box>
    );
  }

  const renderDetail = () => (
    <Box flexDirection="column" gap={1}>
      <Box>
        <Text bold color="cyan">ID: </Text>
        <Text>{context.id}</Text>
      </Box>

      <Box>
        <Text bold color="cyan">Type: </Text>
        <Text>{context.type}</Text>
      </Box>

      <Box flexDirection="column">
        <Text bold color="cyan">Summary:</Text>
        <Box paddingLeft={2}>
          <Text>{context.summary}</Text>
        </Box>
      </Box>

      <Box>
        <Text bold color="cyan">Tags: </Text>
        <Text>{context.tags.length > 0 ? context.tags.join(", ") : "(none)"}</Text>
      </Box>

      {context.project && (
        <Box>
          <Text bold color="cyan">Project: </Text>
          <Text>{context.project}</Text>
        </Box>
      )}

      {context.sprint && (
        <Box>
          <Text bold color="cyan">Sprint: </Text>
          <Text>{context.sprint}</Text>
        </Box>
      )}

      {context.source && (
        <Box>
          <Text bold color="cyan">Source: </Text>
          <Text>{context.source}</Text>
        </Box>
      )}

      <Box>
        <Text bold color="cyan">Created: </Text>
        <Text>{formatDate(context.createdAt)}</Text>
      </Box>

      <Box>
        <Text bold color="cyan">Updated: </Text>
        <Text>{formatDate(context.updatedAt)}</Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text bold color="cyan">Content:</Text>
        <Box paddingLeft={2} flexDirection="column">
          <Text>
            {context.content.length > 500
              ? context.content.slice(0, 500) + "..."
              : context.content}
          </Text>
        </Box>
      </Box>

      {error && <ErrorBanner message={error} />}
    </Box>
  );

  const renderSimilar = () => {
    if (view === "similar-loading") {
      return <Spinner message="Finding similar contexts..." />;
    }

    if (similarContexts.length === 0) {
      return (
        <Box flexDirection="column">
          <Text>No similar contexts found.</Text>
        </Box>
      );
    }

    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>
            Similar Contexts ({similarContexts.length}):
          </Text>
        </Box>
        <ContextList
          contexts={similarContexts}
          selectedIndex={selectedIndex}
          showSimilarity
        />
      </Box>
    );
  };

  const getKeyBindings = () => {
    if (view === "similar-loading") {
      return [];
    }
    if (view === "similar") {
      return [
        { key: "↑↓", description: "Navigate" },
        { key: "Esc", description: "Back to detail" },
      ];
    }
    return [
      { key: "s", description: "Similar" },
      { key: "Esc", description: "Back" },
    ];
  };

  return (
    <Box flexDirection="column">
      <Header
        title="Context Detail"
        breadcrumb={view === "similar" ? ["Main", "Detail", "Similar"] : ["Main", "Detail"]}
      />
      {view === "detail" ? renderDetail() : renderSimilar()}
      {view !== "similar-loading" && <KeyHintBar bindings={getKeyBindings()} />}
    </Box>
  );
}
