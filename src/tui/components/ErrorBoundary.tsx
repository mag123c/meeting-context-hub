import { Component, type ReactNode } from "react";
import { Box, Text, useApp, useInput } from "ink";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error screen displayed when an unhandled error occurs
 */
function ErrorScreen({ error, onExit }: { error: Error; onExit: () => void }) {
  useInput((input) => {
    if (input === "q") {
      onExit();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="red" bold>
        Unexpected Error
      </Text>
      <Box marginTop={1}>
        <Text color="red">{error.message}</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Press [q] to exit</Text>
      </Box>
    </Box>
  );
}

/**
 * Wrapper component that provides app context to ErrorScreen
 */
function ErrorScreenWrapper({ error }: { error: Error }) {
  const { exit } = useApp();
  return <ErrorScreen error={error} onExit={exit} />;
}

/**
 * Error boundary component that catches unhandled errors
 * and displays a friendly error screen instead of crashing
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorScreenWrapper error={this.state.error} />;
    }
    return this.props.children;
  }
}
