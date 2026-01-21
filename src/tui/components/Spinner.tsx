import { Box, Text } from "ink";
import InkSpinner from "ink-spinner";

interface SpinnerProps {
  message?: string;
}

export function Spinner({ message = "Loading..." }: SpinnerProps) {
  return (
    <Box>
      <Text color="cyan">
        <InkSpinner type="dots" />
      </Text>
      <Text> {message}</Text>
    </Box>
  );
}
