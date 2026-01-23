import { Box, Text, useStdout } from "ink";
import { useTranslation } from "../../i18n/index.js";

interface HeaderProps {
  title: string;
  breadcrumb?: string[];
  version?: string;
  updateAvailable?: boolean;
  latestVersion?: string;
}

export function Header({ title, breadcrumb, version, updateAvailable, latestVersion }: HeaderProps) {
  const { t } = useTranslation();
  const { stdout } = useStdout();
  const terminalWidth = stdout?.columns || 80;

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text bold color="cyan">
          {title}
        </Text>
        {version && (
          <Text dimColor> v{version}</Text>
        )}
        {updateAvailable && latestVersion && (
          <Text color="yellow">
            {" "}({t.update.newVersionAvailable.replace("{version}", latestVersion)})
          </Text>
        )}
      </Box>
      {breadcrumb && breadcrumb.length > 0 && (
        <Box>
          <Text dimColor>
            {breadcrumb.join(" > ")}
          </Text>
        </Box>
      )}
      <Box>
        <Text dimColor>{"─".repeat(terminalWidth - 2)}</Text>
      </Box>
    </Box>
  );
}
