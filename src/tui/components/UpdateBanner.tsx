import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { execSync } from 'child_process';

interface UpdateBannerProps {
  currentVersion: string;
  latestVersion: string;
  updateCommand: string;
}

/**
 * Banner component to display when a new version is available
 * Press 'u' to update, then restart manually
 */
export function UpdateBanner({
  currentVersion,
  latestVersion,
  updateCommand,
}: UpdateBannerProps): React.ReactElement {
  const [updating, setUpdating] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useInput((input) => {
    if ((input === 'u' || input === 'U') && !updating && !updated) {
      setUpdating(true);
      setError(null);

      try {
        execSync(updateCommand, { stdio: 'pipe' });
        setUpdated(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Update failed');
      } finally {
        setUpdating(false);
      }
    }
  });

  if (updated) {
    return (
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="green"
        paddingX={1}
        marginBottom={1}
      >
        <Text color="green" bold>
          ✓ Updated to v{latestVersion}! Press Ctrl+C and run `mch` to restart.
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="red"
        paddingX={1}
        marginBottom={1}
      >
        <Text color="red" bold>Update failed.</Text>
        <Text color="gray">Run manually: {updateCommand}</Text>
      </Box>
    );
  }

  return (
    <Box
      borderStyle="round"
      borderColor="yellow"
      paddingX={1}
      marginBottom={1}
    >
      {updating ? (
        <Text color="yellow">Updating...</Text>
      ) : (
        <>
          <Text color="yellow" bold>Update: </Text>
          <Text color="gray">{currentVersion} → </Text>
          <Text color="green" bold>{latestVersion}</Text>
          <Text color="gray"> | Press </Text>
          <Text color="cyan" bold>U</Text>
          <Text color="gray"> to update</Text>
        </>
      )}
    </Box>
  );
}
