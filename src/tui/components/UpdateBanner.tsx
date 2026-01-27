import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { performUpdate } from '../../utils/update-notifier.js';

interface UpdateBannerProps {
  currentVersion: string;
  latestVersion: string;
  updateCommand: string;
  onDismiss?: () => void;
}

/**
 * Banner component to display when a new version is available
 * Press 'u' to update, then restart manually
 */
export function UpdateBanner({
  currentVersion,
  latestVersion,
  updateCommand,
  onDismiss,
}: UpdateBannerProps): React.ReactElement {
  const [updating, setUpdating] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useInput((input, key) => {
    if ((input === 'u' || input === 'U') && !updating && !updated) {
      setUpdating(true);
      setError(null);

      const result = performUpdate();
      if (result.success) {
        setUpdated(true);
      } else {
        setError(result.error || 'Update failed');
      }
      setUpdating(false);
    }

    // Enter to dismiss (skip update)
    if (key.return && onDismiss && !updating && !updated) {
      onDismiss();
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
          {onDismiss && (
            <>
              <Text color="gray"> | </Text>
              <Text color="cyan" bold>Enter</Text>
              <Text color="gray"> to skip</Text>
            </>
          )}
        </>
      )}
    </Box>
  );
}
