import { Box, Text } from "ink";

interface BannerProps {
  version?: string;
  updateAvailable?: boolean;
  latestVersion?: string;
}

const ASCII_LOGO = [
  "███╗   ███╗ ██████╗██╗  ██╗",
  "████╗ ████║██╔════╝██║  ██║",
  "██╔████╔██║██║     ███████║",
  "██║╚██╔╝██║██║     ██╔══██║",
  "██║ ╚═╝ ██║╚██████╗██║  ██║",
  "╚═╝     ╚═╝ ╚═════╝╚═╝  ╚═╝",
];

export function Banner({ version, updateAvailable, latestVersion }: BannerProps) {
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
        {updateAvailable && latestVersion && (
          <Text color="yellow"> (v{latestVersion} available)</Text>
        )}
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
        <Text dimColor>{"─".repeat(50)}</Text>
      </Box>
    </Box>
  );
}
