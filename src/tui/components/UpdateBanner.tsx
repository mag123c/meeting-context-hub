import React from 'react';
import { Box, Text } from 'ink';

interface UpdateBannerProps {
  currentVersion: string;
  latestVersion: string;
  updateCommand: string;
}

/**
 * Banner component to display when a new version is available
 */
export function UpdateBanner({
  currentVersion,
  latestVersion,
  updateCommand,
}: UpdateBannerProps): React.ReactElement {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="yellow"
      paddingX={1}
      marginBottom={1}
    >
      <Box>
        <Text color="yellow" bold>
          Update available!
        </Text>
        <Text color="gray"> {currentVersion} → </Text>
        <Text color="green" bold>{latestVersion}</Text>
      </Box>
      <Box>
        <Text color="gray">Run: </Text>
        <Text color="cyan">{updateCommand}</Text>
      </Box>
    </Box>
  );
}
