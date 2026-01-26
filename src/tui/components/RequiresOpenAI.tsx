import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Header } from './Header.js';

interface RequiresOpenAIProps {
  feature: string;
  goBack: () => void;
}

export function RequiresOpenAI({ feature, goBack }: RequiresOpenAIProps): React.ReactElement {
  useInput(() => {
    goBack();
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Header title={feature} />
      <Box marginY={1} flexDirection="column">
        <Text color="yellow" bold>
          OpenAI API key required
        </Text>
        <Text color="gray">
          Please set your OpenAI API key in Settings to use {feature.toLowerCase()}.
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          Press any key to go back
        </Text>
      </Box>
    </Box>
  );
}
