/**
 * Update Prompt Component
 * Shows when a new version is available and handles the update process
 */

import { Box, Text, useInput, useApp } from "ink";
import { useTranslation } from "../../i18n/index.js";
import { KeyHintBar } from "./KeyHint.js";
import { Spinner } from "./Spinner.js";
import type { UpdateState } from "../hooks/useUpdate.js";

interface UpdatePromptProps {
  currentVersion: string;
  latestVersion: string;
  updateState: UpdateState;
  updateError: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  onClose: () => void;
}

// Compact banner for top of screen
interface UpdateBannerProps {
  latestVersion: string;
  onUpdate: () => void;
}

export function UpdateBanner({ latestVersion, onUpdate }: UpdateBannerProps) {
  const { t } = useTranslation();

  useInput((input) => {
    if (input === "u" || input === "U") {
      onUpdate();
    }
  });

  return (
    <Box
      borderStyle="single"
      borderColor="yellow"
      paddingX={1}
      marginBottom={1}
    >
      <Text color="yellow" bold>
        ⬆ {t.update.newVersionAvailable.replace("{version}", latestVersion)}
      </Text>
      <Text dimColor>  {t.update.pressUToUpdate}</Text>
    </Box>
  );
}

export function UpdatePrompt({
  currentVersion,
  latestVersion,
  updateState,
  updateError,
  onConfirm,
  onCancel,
  onClose,
}: UpdatePromptProps) {
  const { t } = useTranslation();
  const { exit } = useApp();

  useInput((input, key) => {
    if (updateState === "success") {
      // After successful update, exit app so user restarts with new version
      if (key.return) {
        exit();
      }
      return;
    }

    if (updateState === "error") {
      if (key.return) {
        onClose();
      }
      return;
    }

    if (updateState === "updating") {
      // Don't allow input while updating
      return;
    }

    // idle state: Y/n prompt
    if (key.return || input === "y" || input === "Y") {
      onConfirm();
    } else if (key.escape || input === "n" || input === "N") {
      onCancel();
    }
  });

  const renderContent = () => {
    if (updateState === "updating") {
      return (
        <Box marginTop={1}>
          <Spinner message={t.update.updating} />
        </Box>
      );
    }

    if (updateState === "success") {
      return (
        <Box marginTop={1} flexDirection="column">
          <Text color="green" bold>
            ✓ {t.update.updateSuccess}
          </Text>
          <Box marginTop={1}>
            <Text dimColor>{t.update.pressEnterToExit}</Text>
          </Box>
        </Box>
      );
    }

    if (updateState === "error") {
      return (
        <Box marginTop={1} flexDirection="column">
          <Text color="red" bold>
            ✗ {t.update.updateFailed.replace("{error}", updateError || "Unknown error")}
          </Text>
          <Box marginTop={1}>
            <Text dimColor>{t.update.pressEnterToClose}</Text>
          </Box>
        </Box>
      );
    }

    // idle state - show version info and prompt
    return (
      <>
        <Box marginTop={1} flexDirection="column">
          <Text>
            {t.update.currentVersion} <Text color="yellow">{currentVersion}</Text>
          </Text>
          <Text>
            {t.update.latestVersion} <Text color="green" bold>{latestVersion}</Text>
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text color="cyan">{t.update.updateQuestion}</Text>
        </Box>
      </>
    );
  };

  const renderKeyHints = () => {
    if (updateState === "success") {
      return (
        <KeyHintBar
          bindings={[{ key: "Enter", description: t.update.pressEnterToExit }]}
        />
      );
    }

    if (updateState === "error") {
      return (
        <KeyHintBar
          bindings={[{ key: "Enter", description: t.update.pressEnterToClose }]}
        />
      );
    }

    if (updateState === "updating") {
      return null;
    }

    return (
      <KeyHintBar
        bindings={[
          { key: "Y/Enter", description: "Update" },
          { key: "N/Esc", description: t.common.cancel },
        ]}
      />
    );
  };

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
          {t.update.updatePromptTitle}
        </Text>
        {renderContent()}
      </Box>
      {renderKeyHints()}
    </Box>
  );
}
