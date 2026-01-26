import React from 'react';
import { Box, Text } from 'ink';
import InkTextInput from 'ink-text-input';

interface TextInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  focus?: boolean;
}

export function TextInput({
  label,
  value,
  onChange,
  onSubmit,
  placeholder,
  focus = true,
}: TextInputProps): React.ReactElement {
  return (
    <Box flexDirection="column">
      {label && (
        <Text color="cyan" bold>
          {label}
        </Text>
      )}
      <Box>
        <Text color="gray">&gt; </Text>
        <InkTextInput
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          placeholder={placeholder}
          focus={focus}
        />
      </Box>
    </Box>
  );
}
