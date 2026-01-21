/**
 * API Key Missing Prompt
 * Shows when user tries to access a feature requiring unconfigured API keys
 */

import { Box, Text, useInput } from "ink";
import { useTranslation } from "../../i18n/index.js";
import type { ApiKeyProvider } from "../../config/api-key-check.js";
import { KeyHintBar } from "./KeyHint.js";

interface ApiKeyPromptProps {
  missingKeys: ApiKeyProvider[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function ApiKeyPrompt({ missingKeys, onConfirm, onCancel }: ApiKeyPromptProps) {
  const { t } = useTranslation();

  useInput((input, key) => {
    if (key.return || input === "y" || input === "Y") {
      onConfirm();
    } else if (key.escape || input === "n" || input === "N") {
      onCancel();
    }
  });

  const keyNames = missingKeys.map((k) =>
    k === "anthropic" ? "Anthropic (Claude)" : "OpenAI"
  );

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box
        borderStyle="round"
        borderColor="yellow"
        paddingX={2}
        paddingY={1}
        flexDirection="column"
      >
        <Text color="yellow" bold>
          {t.errors.apiKeysNotConfigured}
        </Text>
        <Box marginTop={1}>
          <Text>
            Missing: <Text color="red" bold>{keyNames.join(", ")}</Text>
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text>{t.errors.selectConfigHint}</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="cyan">Go to Config now? (Y/n)</Text>
        </Box>
      </Box>
      <KeyHintBar
        bindings={[
          { key: "Y/Enter", description: "Go to Config" },
          { key: "N/Esc", description: t.common.cancel },
        ]}
      />
    </Box>
  );
}
