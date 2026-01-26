import React from 'react';
import { Box, Text } from 'ink';
import type { Context } from '../../types/index.js';

interface ContextCardProps {
  context: Context;
  selected?: boolean;
}

export function ContextCard({ context, selected = false }: ContextCardProps): React.ReactElement {
  const borderColor = selected ? 'cyan' : 'gray';

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={borderColor}
      paddingX={1}
      marginBottom={1}
    >
      <Text bold color={selected ? 'cyan' : 'white'}>
        {context.title}
      </Text>
      <Text color="gray" wrap="truncate-end">
        {context.summary}
      </Text>
      <Box marginTop={1}>
        {context.decisions.length > 0 && (
          <Text color="green" dimColor>
            {context.decisions.length} decisions{' '}
          </Text>
        )}
        {context.actionItems.length > 0 && (
          <Text color="yellow" dimColor>
            {context.actionItems.length} actions{' '}
          </Text>
        )}
        {context.policies.length > 0 && (
          <Text color="blue" dimColor>
            {context.policies.length} policies
          </Text>
        )}
      </Box>
      <Box>
        <Text color="gray" dimColor>
          {new Date(context.createdAt).toLocaleDateString()}
        </Text>
        {context.tags.length > 0 && (
          <Text color="magenta" dimColor>
            {' '}
            #{context.tags.slice(0, 3).join(' #')}
          </Text>
        )}
      </Box>
    </Box>
  );
}
