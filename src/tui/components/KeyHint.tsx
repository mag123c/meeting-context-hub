import { Box, Text } from "ink";

export interface KeyBinding {
  key: string;
  description: string;
}

interface KeyHintProps {
  bindings: KeyBinding[];
}

export function KeyHint({ bindings: _ }: KeyHintProps) {
  return (
    <Box marginTop={1}>
      <Text dimColor>{"─".repeat(40)}</Text>
    </Box>
  );
}

export function KeyHintBar({ bindings }: KeyHintProps) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box>
        <Text dimColor>{"─".repeat(40)}</Text>
      </Box>
      <Box gap={2}>
        {bindings.map((binding, index) => (
          <Box key={index}>
            <Text color="yellow">[{binding.key}]</Text>
            <Text> {binding.description}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
