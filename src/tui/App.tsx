import React, { useCallback, useState } from 'react';
import { Box, Text } from 'ink';
import { useServices, cleanup, reinitializeServices } from './hooks/useServices.js';
import { useNavigation } from './hooks/useNavigation.js';
import { Spinner } from './components/Spinner.js';
import { MainMenu } from './screens/MainMenu.js';
import { AddContext } from './screens/AddContext.js';
import { ListScreen } from './screens/ListScreen.js';
import { DetailScreen } from './screens/DetailScreen.js';
import { ProjectScreen } from './screens/ProjectScreen.js';
import { SettingsScreen } from './screens/SettingsScreen.js';
import { SearchScreen } from './screens/SearchScreen.js';
import { RecordScreen } from './screens/RecordScreen.js';
import { RequiresOpenAI } from './components/RequiresOpenAI.js';

interface AppProps {
  onExit: () => void;
}

export function App({ onExit }: AppProps): React.ReactElement {
  const { services, config, error, loading, needsConfig } = useServices();
  const { screen, params, navigate, goBack } = useNavigation();
  const [reinitializing, setReinitializing] = useState(false);

  // Get language from config, default to 'en'
  const language = config?.language || 'en';

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
  if (error && !needsConfig) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red" bold>
          Initialization Error
        </Text>
        <Text color="red">{error.message}</Text>
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

  // Route to appropriate screen
  switch (screen) {
    case 'main':
      return <MainMenu navigate={navigate} onExit={handleExit} language={language} />;

    case 'add':
      return (
        <AddContext
          addContextUseCase={services.addContext}
          manageProjectUseCase={services.manageProject}
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
          searchContextUseCase={services.searchContext}
          onNavigateToContext={(contextId) => navigate('detail', { contextId })}
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
