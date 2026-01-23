import { Box, Text, useStdout } from "ink";

interface BannerProps {
  version?: string;
}

const ASCII_LOGO = [
  "███╗   ███╗ ██████╗██╗  ██╗",
  "████╗ ████║██╔════╝██║  ██║",
  "██╔████╔██║██║     ███████║",
  "██║╚██╔╝██║██║     ██╔══██║",
  "██║ ╚═╝ ██║╚██████╗██║  ██║",
  "╚═╝     ╚═╝ ╚═════╝╚═╝  ╚═╝",
];

export function Banner({ version }: BannerProps) {
  const { stdout } = useStdout();
  const terminalWidth = stdout?.columns || 80;

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color="cyan" bold>{ASCII_LOGO[0]}</Text>
        <Text>   Meeting Context Hub</Text>
      </Box>
      <Box>
        <Text color="cyan" bold>{ASCII_LOGO[1]}</Text>
        <Text dimColor>   ─────────────────────</Text>
      </Box>
      <Box>
        <Text color="cyan" bold>{ASCII_LOGO[2]}</Text>
        <Text>   </Text>
        {version && <Text dimColor>v{version}</Text>}
      </Box>
      <Box>
        <Text color="cyan" bold>{ASCII_LOGO[3]}</Text>
      </Box>
      <Box>
        <Text color="cyan" bold>{ASCII_LOGO[4]}</Text>
      </Box>
      <Box>
        <Text color="cyan" bold>{ASCII_LOGO[5]}</Text>
      </Box>
      <Box>
        <Text dimColor>{"─".repeat(terminalWidth - 2)}</Text>
      </Box>
    </Box>
  );
}
