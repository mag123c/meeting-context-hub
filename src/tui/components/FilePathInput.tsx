import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

interface FilePathInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onCancel?: () => void;
  onTabComplete?: () => void;
  placeholder?: string;
  focus?: boolean;
  completions?: string[];
  selectedCompletion?: number;
}

export function FilePathInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  onTabComplete,
  placeholder = '',
  focus = true,
  completions = [],
  selectedCompletion = 0,
}: FilePathInputProps): React.ReactElement {
  const [cursorPos, setCursorPos] = useState(value.length);

  // Sync cursor position with value changes
  useEffect(() => {
    setCursorPos(value.length);
  }, [value]);

  useInput(
    (input, key) => {
      if (!focus) return;

      // Submit: Ctrl+D
      if (key.ctrl && input === 'd') {
        onSubmit?.();
        return;
      }

      // Cancel: ESC
      if (key.escape) {
        onCancel?.();
        return;
      }

      // Tab: Autocomplete
      if (key.tab) {
        onTabComplete?.();
        return;
      }

      // Navigation
      if (key.leftArrow) {
        setCursorPos(Math.max(0, cursorPos - 1));
        return;
      }
      if (key.rightArrow) {
        setCursorPos(Math.min(value.length, cursorPos + 1));
        return;
      }

      // Home
      if (key.ctrl && input === 'a') {
        setCursorPos(0);
        return;
      }
      // End
      if (key.ctrl && input === 'e') {
        setCursorPos(value.length);
        return;
      }

      // Backspace
      if (key.backspace || key.delete) {
        if (cursorPos > 0) {
          const newValue = value.slice(0, cursorPos - 1) + value.slice(cursorPos);
          onChange(newValue);
          setCursorPos(cursorPos - 1);
        }
        return;
      }

      // Regular character input
      if (input && !key.ctrl && !key.meta && !key.return) {
        const newValue = value.slice(0, cursorPos) + input + value.slice(cursorPos);
        onChange(newValue);
        setCursorPos(cursorPos + input.length);
      }
    },
    { isActive: focus }
  );

  const isEmpty = value === '';
  const hasCompletions = completions.length > 0;

  return (
    <Box flexDirection="column">
      {/* Input line */}
      <Box>
        <Text color="gray">&gt; </Text>
        {isEmpty && !focus ? (
          <Text color="gray" dimColor>
            {placeholder}
          </Text>
        ) : isEmpty && focus ? (
          <Text>
            <Text color="gray" dimColor>
              {placeholder}
            </Text>
            <Text backgroundColor="white" color="black">
              {' '}
            </Text>
          </Text>
        ) : (
          <Text>
            <Text>{value.slice(0, cursorPos)}</Text>
            {focus && (
              <Text backgroundColor="white" color="black">
                {value[cursorPos] || ' '}
              </Text>
            )}
            <Text>{value.slice(cursorPos + 1)}</Text>
          </Text>
        )}
      </Box>

      {/* Completions list */}
      {hasCompletions && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="cyan" dimColor>
            Completions:
          </Text>
          {completions.slice(0, 5).map((completion, idx) => (
            <Box key={completion}>
              <Text color={idx === selectedCompletion ? 'cyan' : 'gray'}>
                {idx === selectedCompletion ? '▸ ' : '  '}
                {completion}
              </Text>
            </Box>
          ))}
          {completions.length > 5 && (
            <Text color="gray" dimColor>
              ... and {completions.length - 5} more
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
}
