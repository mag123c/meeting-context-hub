import { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { Header, Spinner, ErrorBanner, KeyHintBar, ContextList } from "../components/index.js";
import type { NavigationContext } from "../App.js";
import type { AppServices } from "../../core/factories.js";
import type { Context } from "../../types/context.types.js";
import { useTranslation } from "../../i18n/index.js";

interface DetailScreenProps {
  navigation: NavigationContext;
  services: AppServices;
  context: Context | null;
}

type View = "detail" | "similar-loading" | "similar";

export function DetailScreen({ navigation, services, context }: DetailScreenProps) {
  const { t, formatDateTime } = useTranslation();
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
        <Header title={t.detail.title} breadcrumb={t.detail.breadcrumb} />
        <Text color="red">{t.detail.noContextSelected}</Text>
        <KeyHintBar bindings={[{ key: "Esc", description: t.detail.keyHints.back }]} />
      </Box>
    );
  }

  const renderDetail = () => (
    <Box flexDirection="column" gap={1}>
      <Box>
        <Text bold color="cyan">{t.detail.labels.id} </Text>
        <Text>{context.id}</Text>
      </Box>

      <Box>
        <Text bold color="cyan">{t.detail.labels.type} </Text>
        <Text>{context.type}</Text>
      </Box>

      <Box flexDirection="column">
        <Text bold color="cyan">{t.detail.labels.summary}</Text>
        <Box paddingLeft={2}>
          <Text>{context.summary}</Text>
        </Box>
      </Box>

      <Box>
        <Text bold color="cyan">{t.detail.labels.tags} </Text>
        <Text>{context.tags.length > 0 ? context.tags.join(", ") : t.detail.noTags}</Text>
      </Box>

      {context.project && (
        <Box>
          <Text bold color="cyan">{t.detail.labels.project} </Text>
          <Text>{context.project}</Text>
        </Box>
      )}

      {context.sprint && (
        <Box>
          <Text bold color="cyan">{t.detail.labels.sprint} </Text>
          <Text>{context.sprint}</Text>
        </Box>
      )}

      {context.source && (
        <Box>
          <Text bold color="cyan">{t.detail.labels.source} </Text>
          <Text>{context.source}</Text>
        </Box>
      )}

      <Box>
        <Text bold color="cyan">{t.detail.labels.created} </Text>
        <Text>{formatDateTime(context.createdAt)}</Text>
      </Box>

      <Box>
        <Text bold color="cyan">{t.detail.labels.updated} </Text>
        <Text>{formatDateTime(context.updatedAt)}</Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text bold color="cyan">{t.detail.labels.content}</Text>
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
      return <Spinner message={t.detail.findingSimilar} />;
    }

    if (similarContexts.length === 0) {
      return (
        <Box flexDirection="column">
          <Text>{t.detail.noSimilarFound}</Text>
        </Box>
      );
    }

    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>
            {t.detail.similarContexts.replace("{count}", String(similarContexts.length))}
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
        { key: "↑↓", description: t.detail.keyHints.navigate },
        { key: "Esc", description: t.detail.keyHints.backToDetail },
      ];
    }
    return [
      { key: "s", description: t.detail.keyHints.similar },
      { key: "Esc", description: t.detail.keyHints.back },
    ];
  };

  return (
    <Box flexDirection="column">
      <Header
        title={t.detail.title}
        breadcrumb={view === "similar" ? t.detail.breadcrumbSimilar : t.detail.breadcrumb}
      />
      {view === "detail" ? renderDetail() : renderSimilar()}
      {view !== "similar-loading" && <KeyHintBar bindings={getKeyBindings()} />}
    </Box>
  );
}
