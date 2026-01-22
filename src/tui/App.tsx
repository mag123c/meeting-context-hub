import { useState, useCallback, useMemo } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { createServices, type AppServices } from "../core/factories.js";
import type { Context } from "../types/context.types.js";
import { I18nProvider, useTranslation } from "../i18n/index.js";

import { MainMenu } from "./screens/MainMenu.js";
import { AddScreen } from "./screens/AddScreen.js";
import { SearchScreen } from "./screens/SearchScreen.js";
import { ListScreen } from "./screens/ListScreen.js";
import { DetailScreen } from "./screens/DetailScreen.js";
import { ConfigScreen } from "./screens/ConfigScreen.js";
import { Header, KeyHintBar, ErrorBoundary, ApiKeyPrompt, UpdatePrompt } from "./components/index.js";
import { useApiKeyGuard, useUpdate } from "./hooks/index.js";

export type Screen = "main" | "add" | "search" | "list" | "detail" | "config";

export interface NavigationState {
  screen: Screen;
  params?: {
    contextId?: string;
    query?: string;
  };
  history: Screen[];
}

export interface NavigationContext {
  navigate: (screen: Screen, params?: NavigationState["params"]) => void;
  goBack: () => void;
  currentScreen: Screen;
  params?: NavigationState["params"];
}

interface AppContentProps {
  version: string;
  packageName: string;
}

function AppContent({ version, packageName }: AppContentProps) {
  const { exit } = useApp();
  const { t } = useTranslation();
  const [navigation, setNavigation] = useState<NavigationState>({
    screen: "main",
    history: [],
  });
  const [selectedContext, setSelectedContext] = useState<Context | null>(null);
  const [configVersion, setConfigVersion] = useState(0);

  // API key guard
  const apiKeyGuard = useApiKeyGuard();

  // Update checker
  const updateChecker = useUpdate({ packageName, version });

  // Services initialization (re-runs when configVersion changes)
  const { services, initError } = useMemo<{
    services: AppServices | null;
    initError: string | null;
  }>(() => {
    try {
      return { services: createServices(), initError: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to initialize services";
      return { services: null, initError: message };
    }
  }, [configVersion]);

  // Re-initialize services when config changes
  const handleConfigured = useCallback(() => {
    setConfigVersion((v) => v + 1);
    setNavigation({ screen: "main", history: [] });
    apiKeyGuard.resetGuard();
  }, [apiKeyGuard]);

  // Handle API key prompt confirmation - go to config
  const handleApiKeyConfirm = useCallback(() => {
    apiKeyGuard.confirmGoToConfig();
    setNavigation((prev) => ({
      screen: "config",
      params: undefined,
      history: [...prev.history, prev.screen],
    }));
  }, [apiKeyGuard]);

  const navigate = useCallback(
    (screen: Screen, params?: NavigationState["params"]) => {
      // Check API key requirements before navigating
      if (!apiKeyGuard.checkNavigation(screen)) {
        return; // Guard will show prompt
      }

      setNavigation((prev) => ({
        screen,
        params,
        history: [...prev.history, prev.screen],
      }));
    },
    [apiKeyGuard]
  );

  const goBack = useCallback(() => {
    setNavigation((prev) => {
      const history = [...prev.history];
      const previousScreen = history.pop() || "main";
      return {
        screen: previousScreen,
        history,
        params: undefined,
      };
    });
  }, []);

  // Global keyboard shortcuts
  useInput((input, key) => {
    // q = quit (only on main screen)
    if (input === "q" && navigation.screen === "main") {
      exit();
    }
    // Esc = go back
    if (key.escape && navigation.screen !== "main") {
      goBack();
    }
  });

  const handleSelectContext = useCallback(
    (context: Context) => {
      setSelectedContext(context);
      navigate("detail", { contextId: context.id });
    },
    [navigate]
  );

  const navigationContext: NavigationContext = {
    navigate,
    goBack,
    currentScreen: navigation.screen,
    params: navigation.params,
  };

  const renderScreen = () => {
    // Show update prompt if active
    if (updateChecker.showPrompt) {
      return (
        <Box flexDirection="column">
          <Header
            title={t.mainMenu.title}
            version={version}
          />
          <UpdatePrompt
            currentVersion={version}
            latestVersion={updateChecker.latestVersion!}
            updateState={updateChecker.updateState}
            updateError={updateChecker.updateError}
            onConfirm={updateChecker.confirmUpdate}
            onCancel={updateChecker.cancelUpdate}
            onClose={updateChecker.closeResult}
          />
        </Box>
      );
    }

    // Show API key prompt if guard is active
    if (apiKeyGuard.guardState.showPrompt) {
      return (
        <Box flexDirection="column">
          <Header title={t.mainMenu.title} version={version} />
          <ApiKeyPrompt
            missingKeys={apiKeyGuard.guardState.missingKeys}
            onConfirm={handleApiKeyConfirm}
            onCancel={apiKeyGuard.cancelPrompt}
          />
        </Box>
      );
    }

    // Config screen is always accessible
    if (navigation.screen === "config") {
      return (
        <ConfigScreen
          navigation={navigationContext}
          onConfigured={handleConfigured}
        />
      );
    }

    // Show config error for screens that require services
    if (!services && navigation.screen !== "main") {
      return (
        <Box flexDirection="column">
          <Header title={t.errors.configErrorTitle} />
          <Box flexDirection="column" gap={1}>
            <Text color="red" bold>
              {t.errors.servicesNotInitialized}
            </Text>
            <Text>{initError || t.errors.apiKeysNotConfigured}</Text>
            <Box marginTop={1} flexDirection="column">
              <Text bold>{t.errors.selectConfigHint}</Text>
            </Box>
          </Box>
          <KeyHintBar bindings={[{ key: "Esc", description: t.common.back }]} />
        </Box>
      );
    }

    switch (navigation.screen) {
      case "main":
        return (
          <MainMenu
            navigation={navigationContext}
            onExit={exit}
            version={version}
            updateAvailable={updateChecker.updateAvailable}
            latestVersion={updateChecker.latestVersion}
            onUpdate={updateChecker.promptUpdate}
          />
        );
      case "add":
        return <AddScreen navigation={navigationContext} services={services!} />;
      case "search":
        return (
          <SearchScreen
            navigation={navigationContext}
            services={services!}
            onSelectContext={handleSelectContext}
          />
        );
      case "list":
        return (
          <ListScreen
            navigation={navigationContext}
            services={services!}
            onSelectContext={handleSelectContext}
          />
        );
      case "detail":
        return (
          <DetailScreen
            navigation={navigationContext}
            services={services!}
            context={selectedContext}
          />
        );
      default:
        return <MainMenu navigation={navigationContext} onExit={exit} />;
    }
  };

  return <Box flexDirection="column">{renderScreen()}</Box>;
}

interface AppProps {
  version: string;
  packageName: string;
}

export function App({ version, packageName }: AppProps) {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <AppContent version={version} packageName={packageName} />
      </I18nProvider>
    </ErrorBoundary>
  );
}
