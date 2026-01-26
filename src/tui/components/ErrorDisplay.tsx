import React from 'react';
import { Box, Text, useInput } from 'ink';
import { isMCHError, type MCHError, ERROR_RECOVERY } from '../../types/errors.js';

interface ErrorDisplayProps {
  /** The error to display - can be string, Error, or MCHError */
  error: string | Error | MCHError;
  /** Language for recovery message */
  language?: 'ko' | 'en';
  /** Callback when user presses R to retry */
  onRetry?: () => void;
  /** Custom hint text (overrides default) */
  hint?: string;
}

/**
 * User-friendly error display component
 *
 * Features:
 * - Red error message
 * - Error code (for MCHError)
 * - Recovery guidance (bilingual)
 * - Retry option for recoverable errors
 */
export function ErrorDisplay({
  error,
  language = 'ko',
  onRetry,
  hint,
}: ErrorDisplayProps): React.ReactElement {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  const isMCH = isMCHError(errorObj);
  const mchError = isMCH ? (errorObj as MCHError) : null;

  // Get recovery message
  const recoveryMessage = mchError
    ? ERROR_RECOVERY[mchError.code]?.[language] ?? ''
    : '';

  // Determine if retry is available
  const canRetry = onRetry && (mchError ? mchError.recoverable : true);

  // Handle retry key
  useInput((input) => {
    if (canRetry && input.toLowerCase() === 'r') {
      onRetry?.();
    }
  });

  // Build default hint
  const defaultHint = canRetry
    ? language === 'ko'
      ? 'R: 다시 시도 | ESC: 돌아가기'
      : 'R: Retry | ESC: Go back'
    : language === 'ko'
      ? 'ESC: 돌아가기'
      : 'ESC: Go back';

  return (
    <Box flexDirection="column">
      {/* Error message */}
      <Box>
        <Text color="red" bold>
          {errorObj.message}
        </Text>
      </Box>

      {/* Error code (for MCHError) */}
      {mchError && (
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            [{mchError.code}]
          </Text>
        </Box>
      )}

      {/* Recovery guidance */}
      {recoveryMessage && (
        <Box marginTop={1}>
          <Text color="yellow">{recoveryMessage}</Text>
        </Box>
      )}

      {/* Hint */}
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          {hint ?? defaultHint}
        </Text>
      </Box>
    </Box>
  );
}

/**
 * Inline error text for forms (simpler version)
 */
export function ErrorText({
  error,
  language = 'ko',
}: {
  error: string | Error | MCHError;
  language?: 'ko' | 'en';
}): React.ReactElement {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  const isMCH = isMCHError(errorObj);
  const mchError = isMCH ? (errorObj as MCHError) : null;

  const recoveryMessage = mchError
    ? ERROR_RECOVERY[mchError.code]?.[language] ?? ''
    : '';

  return (
    <Box flexDirection="column">
      <Text color="red">{errorObj.message}</Text>
      {recoveryMessage && (
        <Text color="yellow" dimColor>
          {recoveryMessage}
        </Text>
      )}
    </Box>
  );
}
