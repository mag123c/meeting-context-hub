import { Box, Text } from "ink";

interface HeaderProps {
  title: string;
  breadcrumb?: string[];
}

export function Header({ title, breadcrumb }: HeaderProps) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text bold color="cyan">
          {title}
        </Text>
      </Box>
      {breadcrumb && breadcrumb.length > 0 && (
        <Box>
          <Text dimColor>
            {breadcrumb.join(" > ")}
          </Text>
        </Box>
      )}
      <Box>
        <Text dimColor>{"─".repeat(40)}</Text>
      </Box>
    </Box>
  );
}
