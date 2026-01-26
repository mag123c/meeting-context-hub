import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface ConfirmDialogProps {
  /** Dialog title */
  title: string;
  /** Dialog message (supports \n for newlines) */
  message: string;
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Called when user confirms */
  onConfirm: () => void;
  /** Called when user cancels */
  onCancel: () => void;
  /** Show destructive styling (red) */
  destructive?: boolean;
}

/**
 * Confirmation dialog with keyboard navigation
 *
 * Key bindings:
 * - Left/Right: Toggle between buttons
 * - Enter: Select current button
 * - ESC: Cancel
 *
 * Usage:
 * ```tsx
 * <ConfirmDialog
 *   title="Delete Context"
 *   message="Are you sure?\nThis cannot be undone."
 *   destructive
 *   onConfirm={() => handleDelete()}
 *   onCancel={() => setShowDialog(false)}
 * />
 * ```
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps): React.ReactElement {
  // 0 = cancel (default safe option), 1 = confirm
  const [selected, setSelected] = useState(0);

  useInput((_input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }

    if (key.leftArrow) {
      setSelected(0);
      return;
    }

    if (key.rightArrow) {
      setSelected(1);
      return;
    }

    if (key.return) {
      if (selected === 1) {
        onConfirm();
      } else {
        onCancel();
      }
      return;
    }
  });

  const borderColor = destructive ? 'red' : 'cyan';
  const confirmColor = destructive ? 'red' : 'green';

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={borderColor}
      paddingX={2}
      paddingY={1}
    >
      {/* Title */}
      <Text bold color={borderColor}>
        {title}
      </Text>

      {/* Message */}
      <Box marginY={1} flexDirection="column">
        {message.split('\n').map((line, i) => (
          <Text key={i}>{line}</Text>
        ))}
      </Box>

      {/* Buttons */}
      <Box gap={2}>
        {/* Cancel button */}
        <Box>
          <Text
            color={selected === 0 ? 'white' : 'gray'}
            backgroundColor={selected === 0 ? 'gray' : undefined}
          >
            {' '}
            {cancelLabel}{' '}
          </Text>
        </Box>

        {/* Confirm button */}
        <Box>
          <Text
            color={selected === 1 ? 'white' : confirmColor}
            backgroundColor={selected === 1 ? confirmColor : undefined}
          >
            {' '}
            {confirmLabel}{' '}
          </Text>
        </Box>
      </Box>

      {/* Hint */}
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          {'<-/-> Select | Enter: OK | ESC: Cancel'}
        </Text>
      </Box>
    </Box>
  );
}
