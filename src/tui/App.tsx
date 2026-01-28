import React, { useCallback, useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useServices, cleanup, reinitializeServices } from './hooks/useServices.js';
import { useNavigation } from './hooks/useNavigation.js';
import { Spinner } from './components/Spinner.js';
import { UpdateBanner } from './components/UpdateBanner.js';
import { MainMenu } from './screens/MainMenu.js';
import { AddContext } from './screens/AddContext.js';
import { ListScreen } from './screens/ListScreen.js';
import { DetailScreen } from './screens/DetailScreen.js';
import { ProjectScreen } from './screens/ProjectScreen.js';
import { SettingsScreen } from './screens/SettingsScreen.js';
import { SearchScreen } from './screens/SearchScreen.js';
import { RecordScreen } from './screens/RecordScreen.js';
import { RequiresOpenAI } from './components/RequiresOpenAI.js';
import { checkForUpdates } from '../utils/update-notifier.js';

interface UpdateInfo {
  current: string;
  latest: string;
}

interface AppProps {
  onExit: () => void;
}

export function App({ onExit }: AppProps): React.ReactElement {
  const { services, config, error, loading, needsConfig } = useServices();
  const { screen, params, navigate, goBack } = useNavigation();
  const [reinitializing, setReinitializing] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [checkingForUpdates, setCheckingForUpdates] = useState(true);
  const [updateDismissed, setUpdateDismissed] = useState(false);

  // Get language from config, default to 'en'
  const language = config?.language || 'en';

  // Check for updates on mount
  // update-notifier spawns background process on first call, so we poll until ready
  useEffect(() => {
    const update = checkForUpdates();
    if (update) {
      setUpdateInfo({ current: update.current, latest: update.latest });
      setCheckingForUpdates(false);
      return;
    }

    // First call may return null (background check in progress)
    // Poll every 1 second until update info is available (max 10 seconds)
    let attempts = 0;
    const maxAttempts = 10;
    const timer = setInterval(() => {
      attempts++;
      const retryUpdate = checkForUpdates();
      if (retryUpdate) {
        setUpdateInfo({ current: retryUpdate.current, latest: retryUpdate.latest });
        setCheckingForUpdates(false);
        clearInterval(timer);
      } else if (attempts >= maxAttempts) {
        setCheckingForUpdates(false);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleExit = useCallback(() => {
    cleanup();
    onExit();
  }, [onExit]);

  const handleConfigChange = useCallback(async () => {
    setReinitializing(true);
    await reinitializeServices();
    setReinitializing(false);
  }, []);

  if (loading || reinitializing) {
    return (
      <Box flexDirection="column" padding={1}>
        <Spinner message="Initializing Meeting Context Hub..." />
      </Box>
    );
  }

  // If config is missing, show settings screen
  if (needsConfig) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box flexDirection="column" marginBottom={1}>
          <Text color="yellow" bold>
            Welcome to Meeting Context Hub!
          </Text>
          <Text color="gray">
            Please configure your API keys to get started.
          </Text>
        </Box>
        <SettingsScreen
          goBack={handleExit}
          onConfigChange={handleConfigChange}
          language={language}
        />
      </Box>
    );
  }

  // If there's an error other than config, show it
  // If update is available, show update banner only (update might fix the issue)
  if (error && !needsConfig) {
    if (updateInfo) {
      return (
        <Box flexDirection="column" padding={1}>
          <Box
            flexDirection="column"
            borderStyle="double"
            borderColor="yellow"
            paddingX={2}
            paddingY={1}
          >
            <Text color="yellow" bold>
              Update Available: {updateInfo.current} → {updateInfo.latest}
            </Text>
            <Box marginY={1}>
              <Text color="gray">
                An error occurred during initialization. Updating may resolve this issue.
              </Text>
            </Box>
            <UpdateBanner
              currentVersion={updateInfo.current}
              latestVersion={updateInfo.latest}
                          />
          </Box>
          <Box marginTop={1} flexDirection="column">
            <Text color="red" dimColor>Error: {error.message.split('\n')[0]}</Text>
          </Box>
        </Box>
      );
    }

    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red" bold>
          Initialization Error
        </Text>
        <Text color="red">{error.message}</Text>
        {checkingForUpdates && (
          <Box marginTop={1}>
            <Spinner message="Checking for updates..." />
          </Box>
        )}
      </Box>
    );
  }

  if (!services) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red">Failed to initialize services</Text>
      </Box>
    );
  }

  // Show update-only screen on first launch if update is available
  if (updateInfo && !updateDismissed) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box
          flexDirection="column"
          borderStyle="double"
          borderColor="yellow"
          paddingX={2}
          paddingY={1}
        >
          <Text color="yellow" bold>
            Update Available: {updateInfo.current} → {updateInfo.latest}
          </Text>
          <Box marginTop={1}>
            <UpdateBanner
              currentVersion={updateInfo.current}
              latestVersion={updateInfo.latest}
                            onDismiss={() => setUpdateDismissed(true)}
            />
          </Box>
        </Box>
      </Box>
    );
  }

  // Route to appropriate screen
  switch (screen) {
    case 'main':
      return (
        <Box flexDirection="column">
          {updateInfo && (
            <UpdateBanner
              currentVersion={updateInfo.current}
              latestVersion={updateInfo.latest}
                          />
          )}
          <MainMenu navigate={navigate} onExit={handleExit} language={language} />
        </Box>
      );

    case 'add':
      return (
        <AddContext
          addContextUseCase={services.addContext}
          manageProjectUseCase={services.manageProject}
          recordContextUseCase={services.recordContext}
          onNavigateToContext={(contextId) => navigate('detail', { contextId })}
          goBack={goBack}
          language={language}
        />
      );

    case 'list':
      return (
        <ListScreen
          listContextsUseCase={services.listContexts}
          manageProjectUseCase={services.manageProject}
          navigate={navigate}
          goBack={goBack}
          language={language}
        />
      );

    case 'detail':
      return (
        <DetailScreen
          contextId={params.contextId as string}
          getContextUseCase={services.getContext}
          manageProjectUseCase={services.manageProject}
          manageContextUseCase={services.manageContext}
          searchContextUseCase={services.searchContext}
          onNavigateToContext={(contextId) => navigate('detail', { contextId })}
          onDeleted={goBack}
          goBack={goBack}
          language={language}
        />
      );

    case 'projects':
      return (
        <ProjectScreen
          manageProjectUseCase={services.manageProject}
          listContextsUseCase={services.listContexts}
          goBack={goBack}
          language={language}
        />
      );

    case 'settings':
      return (
        <SettingsScreen
          goBack={goBack}
          onConfigChange={handleConfigChange}
          language={language}
        />
      );

    case 'search':
      return (
        <SearchScreen
          searchContextUseCase={services.searchContext}
          onSelectContext={(contextId) => navigate('detail', { contextId })}
          goBack={goBack}
          language={language}
        />
      );

    case 'record':
      if (!services.recordContext) {
        return <RequiresOpenAI feature="Recording" goBack={goBack} />;
      }
      return (
        <RecordScreen
          recordContextUseCase={services.recordContext}
          manageProjectUseCase={services.manageProject}
          onNavigateToContext={(contextId) => navigate('detail', { contextId })}
          goBack={goBack}
          language={language}
        />
      );

    default:
      return <MainMenu navigate={navigate} onExit={handleExit} language={language} />;
  }
}
