import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

interface TextInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  onOpenEditor?: () => void;
  placeholder?: string;
  focus?: boolean;
}

export function TextInput({
  label,
  value,
  onChange,
  onSubmit,
  onOpenEditor,
  placeholder,
  focus = true,
}: TextInputProps): React.ReactElement {
  const [cursorPos, setCursorPos] = useState(value.length);

  // Sync cursor position with value changes
  useEffect(() => {
    setCursorPos(value.length);
  }, [value]);

  useInput(
    (input, key) => {
      if (!focus) return;

      // Ctrl+E: open external editor
      if (key.ctrl && input === 'e') {
        onOpenEditor?.();
        return;
      }

      // Submit on Enter
      if (key.return) {
        onSubmit?.(value);
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

      // Backspace
      if (key.backspace || key.delete) {
        if (cursorPos > 0) {
          const newValue = value.slice(0, cursorPos - 1) + value.slice(cursorPos);
          onChange(newValue);
          setCursorPos(cursorPos - 1);
        }
        return;
      }

      // Regular character input (guard against ctrl/meta)
      if (input && !key.ctrl && !key.meta) {
        const newValue = value.slice(0, cursorPos) + input + value.slice(cursorPos);
        onChange(newValue);
        setCursorPos(cursorPos + input.length);
      }
    },
    { isActive: focus }
  );

  const isEmpty = value === '';

  return (
    <Box flexDirection="column">
      {label && (
        <Text color="cyan" bold>
          {label}
        </Text>
      )}
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
    </Box>
  );
}
