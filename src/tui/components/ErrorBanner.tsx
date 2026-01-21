import { Box, Text } from "ink";

interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <Box marginY={1}>
      <Text color="red" bold>
        Error: {message}
      </Text>
    </Box>
  );
}
