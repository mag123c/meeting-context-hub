import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { spawn } from 'child_process';
import { performUpdate } from '../../utils/update-notifier.js';

interface UpdateBannerProps {
  currentVersion: string;
  latestVersion: string;
  onDismiss?: () => void;
}

/**
 * Banner component to display when a new version is available
 * Press 'u' to update, then restart manually
 */
export function UpdateBanner({
  currentVersion,
  latestVersion,
  onDismiss,
}: UpdateBannerProps): React.ReactElement {
  const { exit } = useApp();
  const [updating, setUpdating] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  useInput((input, key) => {
    if ((input === 'u' || input === 'U') && !updating && !updated && !error) {
      setUpdating(true);
      setError(null);
      setProgress('Installing...');
    }

    // Enter to dismiss (skip update)
    if (key.return && onDismiss && !updating && !updated) {
      onDismiss();
    }

    // Any key to restart after update
    if (updated) {
      const child = spawn('mch', [], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      exit();
    }
  });

  useEffect(() => {
    if (updating && progress === 'Installing...') {
      // Run update in next tick to allow UI to render
      const timer = setTimeout(() => {
        const result = performUpdate((step) => setProgress(step));
        if (result.success) {
          setUpdated(true);
        } else {
          setError(result.error || 'Update failed');
        }
        setUpdating(false);
        setProgress('');
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [updating, progress]);

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
          ✓ Updated to v{latestVersion}! Press any key to restart.
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
        <Text color="red" bold>Update failed. Run manually:</Text>
        <Text color="yellow" wrap="wrap">{error}</Text>
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
        <Text color="yellow">{progress || 'Updating...'}</Text>
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
