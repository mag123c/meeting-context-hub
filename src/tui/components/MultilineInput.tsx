import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface MultilineInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  onTabComplete?: () => void;
  placeholder?: string;
  focus?: boolean;
  maxDisplayLines?: number;
}

export function MultilineInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  onTabComplete,
  placeholder = '',
  focus = true,
  maxDisplayLines = 10,
}: MultilineInputProps): React.ReactElement {
  const [cursorRow, setCursorRow] = useState(0);
  const [cursorCol, setCursorCol] = useState(0);

  const lines = value.split('\n');
  const totalLines = lines.length;

  useInput(
    (input, key) => {
      if (!focus) return;

      // Submit: Ctrl+D
      if (key.ctrl && input === 'd') {
        onSubmit();
        return;
      }

      // Cancel: ESC
      if (key.escape) {
        onCancel?.();
        return;
      }

      // Tab: mode switch or autocomplete
      if (key.tab) {
        onTabComplete?.();
        return;
      }

      // Navigation
      if (key.upArrow) {
        setCursorRow(Math.max(0, cursorRow - 1));
        setCursorCol(Math.min(cursorCol, lines[Math.max(0, cursorRow - 1)]?.length || 0));
        return;
      }
      if (key.downArrow) {
        setCursorRow(Math.min(totalLines - 1, cursorRow + 1));
        setCursorCol(Math.min(cursorCol, lines[Math.min(totalLines - 1, cursorRow + 1)]?.length || 0));
        return;
      }
      if (key.leftArrow) {
        if (cursorCol > 0) {
          setCursorCol(cursorCol - 1);
        } else if (cursorRow > 0) {
          setCursorRow(cursorRow - 1);
          setCursorCol(lines[cursorRow - 1]?.length || 0);
        }
        return;
      }
      if (key.rightArrow) {
        const currentLineLength = lines[cursorRow]?.length || 0;
        if (cursorCol < currentLineLength) {
          setCursorCol(cursorCol + 1);
        } else if (cursorRow < totalLines - 1) {
          setCursorRow(cursorRow + 1);
          setCursorCol(0);
        }
        return;
      }

      // New line
      if (key.return) {
        const currentLine = lines[cursorRow] || '';
        const before = currentLine.slice(0, cursorCol);
        const after = currentLine.slice(cursorCol);
        const newLines = [
          ...lines.slice(0, cursorRow),
          before,
          after,
          ...lines.slice(cursorRow + 1),
        ];
        onChange(newLines.join('\n'));
        setCursorRow(cursorRow + 1);
        setCursorCol(0);
        return;
      }

      // Backspace
      if (key.backspace || key.delete) {
        if (cursorCol > 0) {
          const currentLine = lines[cursorRow] || '';
          const newLine = currentLine.slice(0, cursorCol - 1) + currentLine.slice(cursorCol);
          const newLines = [...lines.slice(0, cursorRow), newLine, ...lines.slice(cursorRow + 1)];
          onChange(newLines.join('\n'));
          setCursorCol(cursorCol - 1);
        } else if (cursorRow > 0) {
          // Merge with previous line
          const prevLine = lines[cursorRow - 1] || '';
          const currentLine = lines[cursorRow] || '';
          const mergedLine = prevLine + currentLine;
          const newLines = [
            ...lines.slice(0, cursorRow - 1),
            mergedLine,
            ...lines.slice(cursorRow + 1),
          ];
          onChange(newLines.join('\n'));
          setCursorRow(cursorRow - 1);
          setCursorCol(prevLine.length);
        }
        return;
      }

      // Regular character input (including pasted text)
      if (input && !key.ctrl && !key.meta) {
        const currentLine = lines[cursorRow] || '';
        const before = currentLine.slice(0, cursorCol);
        const after = currentLine.slice(cursorCol);

        // Insert input at cursor position
        const newText = before + input + after;
        const newLines = [
          ...lines.slice(0, cursorRow),
          ...newText.split('\n'),
          ...lines.slice(cursorRow + 1),
        ];

        // Remove trailing empty line if original was empty
        if (lines.length === 1 && lines[0] === '' && newLines[newLines.length - 1] === '') {
          newLines.pop();
        }

        onChange(newLines.join('\n'));

        // Update cursor position
        const insertedLines = (before + input).split('\n');
        setCursorRow(cursorRow + insertedLines.length - 1);
        setCursorCol(insertedLines[insertedLines.length - 1].length);
      }
    },
    { isActive: focus }
  );

  // Calculate visible lines (scroll if needed)
  const startLine = Math.max(0, cursorRow - maxDisplayLines + 1);
  const visibleLines = lines.slice(startLine, startLine + maxDisplayLines);
  const showScrollIndicator = totalLines > maxDisplayLines;

  const isEmpty = value === '';

  return (
    <Box flexDirection="column">
      {/* Header with line count */}
      <Box>
        <Text color="cyan">[</Text>
        <Text color="gray">
          {' '}
          {totalLines} {totalLines === 1 ? 'line' : 'lines'}
          {showScrollIndicator && ` (${startLine + 1}-${Math.min(startLine + maxDisplayLines, totalLines)}/${totalLines})`}
          {' '}
        </Text>
        <Text color="cyan">]</Text>
      </Box>

      {/* Input area */}
      <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
        {isEmpty && !focus ? (
          <Text color="gray" dimColor>
            {placeholder}
          </Text>
        ) : isEmpty && focus ? (
          <Box>
            <Text color="gray" dimColor>
              {'  1 '}
            </Text>
            <Text backgroundColor="white" color="black">
              {' '}
            </Text>
          </Box>
        ) : (
          visibleLines.map((line, idx) => {
            const actualLineNum = startLine + idx;
            const isCurrentLine = actualLineNum === cursorRow;
            const lineNum = String(actualLineNum + 1).padStart(3, ' ');

            return (
              <Box key={actualLineNum}>
                <Text color="gray" dimColor>
                  {lineNum}{' '}
                </Text>
                {isCurrentLine && focus ? (
                  <Text>
                    <Text>{line.slice(0, cursorCol)}</Text>
                    <Text backgroundColor="white" color="black">
                      {line[cursorCol] || ' '}
                    </Text>
                    <Text>{line.slice(cursorCol + 1)}</Text>
                  </Text>
                ) : (
                  <Text>{line || ' '}</Text>
                )}
              </Box>
            );
          })
        )}
      </Box>

      {/* Hint */}
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          Ctrl+D to submit | ESC to cancel
        </Text>
      </Box>
    </Box>
  );
}
