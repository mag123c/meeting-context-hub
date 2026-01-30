import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { ScrollableList } from './ScrollableList.js';

interface FilePathInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onCancel?: () => void;
  onTabComplete?: () => void;
  onSelectCompletion?: (path: string) => void;
  placeholder?: string;
  focus?: boolean;
  completions?: string[];
}

export function FilePathInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  onTabComplete,
  onSelectCompletion,
  placeholder = '',
  focus = true,
  completions = [],
}: FilePathInputProps): React.ReactElement {
  const [cursorPos, setCursorPos] = useState(value.length);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Sync cursor position with value changes
  useEffect(() => {
    setCursorPos(value.length);
  }, [value]);

  // Reset selection when completions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [completions]);

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

      // ↑↓: Navigate completions
      if (key.upArrow && completions.length > 0) {
        setSelectedIndex(prev => Math.max(0, prev - 1));
        return;
      }
      if (key.downArrow && completions.length > 0) {
        setSelectedIndex(prev => Math.min(completions.length - 1, prev + 1));
        return;
      }

      // Tab: Select completion or fallback to tab complete
      if (key.tab) {
        if (completions.length > 0) {
          onSelectCompletion?.(completions[selectedIndex]);
        } else {
          onTabComplete?.();
        }
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
          <ScrollableList
            items={completions}
            selectedIndex={selectedIndex}
            maxVisible={10}
            renderItem={(item, _idx, isSelected) => (
              <Text color={isSelected ? 'cyan' : 'gray'}>
                {isSelected ? '▸ ' : '  '}{item}
              </Text>
            )}
          />
        </Box>
      )}
    </Box>
  );
}
