import { useState, useCallback, useEffect } from "react";
import { existsSync } from "fs";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { Header, Menu, KeyHintBar, type MenuItem } from "../components/index.js";
import type { NavigationContext } from "../App.js";
import { getApiKeyFromKeychain, setApiKeyInKeychain } from "../../config/keychain.js";
import { getStoredVaultPath, setStoredVaultPath, isVaultPathFromEnv, DEFAULT_OBSIDIAN_PATH } from "../../config/index.js";
import { useTranslation, LANGUAGE_OPTIONS, type SupportedLanguage } from "../../i18n/index.js";

interface ConfigScreenProps {
  navigation: NavigationContext;
  onConfigured: () => void;
}

type Step = "menu" | "input" | "language" | "vaultPath" | "success";
type ConfigKey = "ANTHROPIC_API_KEY" | "OPENAI_API_KEY";
type SuccessType = "apiKey" | "vaultPath";

interface KeyStatus {
  anthropic: boolean;
  openai: boolean;
}

export function ConfigScreen({ navigation, onConfigured }: ConfigScreenProps) {
  const { t, language, setLanguage } = useTranslation();
  const [step, setStep] = useState<Step>("menu");
  const [selectedKey, setSelectedKey] = useState<ConfigKey | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [keyStatus, setKeyStatus] = useState<KeyStatus>({ anthropic: false, openai: false });
  const [error, setError] = useState<string | null>(null);
  const [currentVaultPath, setCurrentVaultPath] = useState<string>("");
  const [successType, setSuccessType] = useState<SuccessType>("apiKey");

  // Check current key status and vault path
  useEffect(() => {
    const anthropic = getApiKeyFromKeychain("ANTHROPIC_API_KEY");
    const openai = getApiKeyFromKeychain("OPENAI_API_KEY");
    setKeyStatus({
      anthropic: !!anthropic,
      openai: !!openai,
    });

    // Get current vault path with priority: ENV > stored > default
    const envPath = process.env.OBSIDIAN_VAULT_PATH;
    const storedPath = getStoredVaultPath();
    setCurrentVaultPath(envPath ?? storedPath ?? DEFAULT_OBSIDIAN_PATH);
  }, [step]);

  useInput((_, key) => {
    if (key.escape) {
      if (step === "menu") {
        navigation.goBack();
      } else if (step === "vaultPath" || step === "input" || step === "language") {
        setStep("menu");
        setSelectedKey(null);
        setInputValue("");
        setError(null);
      }
    }
  });

  // Get current language display name
  const currentLanguageLabel = LANGUAGE_OPTIONS.find((opt) => opt.code === language)?.nativeLabel ?? language;

  // Truncate vault path for display
  const displayVaultPath = currentVaultPath.length > 40
    ? "..." + currentVaultPath.slice(-37)
    : currentVaultPath;

  const menuItems: MenuItem[] = [
    {
      label: `ANTHROPIC_API_KEY (${keyStatus.anthropic ? t.config.configured : t.config.notSet})`,
      value: "ANTHROPIC_API_KEY",
    },
    {
      label: `OPENAI_API_KEY (${keyStatus.openai ? t.config.configured : t.config.notSet})`,
      value: "OPENAI_API_KEY",
    },
    {
      label: `${t.config.vaultPath}: ${displayVaultPath}`,
      value: "vaultPath",
    },
    {
      label: `${t.config.languageLabel}: ${currentLanguageLabel}`,
      value: "language",
    },
    { label: t.common.back, value: "back" },
  ];

  const languageItems: MenuItem[] = LANGUAGE_OPTIONS.map((opt) => ({
    label: opt.nativeLabel,
    value: opt.code,
  }));

  const handleMenuSelect = useCallback((item: MenuItem) => {
    if (item.value === "back") {
      navigation.goBack();
    } else if (item.value === "language") {
      setStep("language");
    } else if (item.value === "vaultPath") {
      if (isVaultPathFromEnv()) {
        // Can't edit when set via environment variable
        setError("Vault path is set via OBSIDIAN_VAULT_PATH environment variable");
        return;
      }
      setStep("vaultPath");
      setInputValue(currentVaultPath);
      setError(null);
    } else {
      setSelectedKey(item.value as ConfigKey);
      setStep("input");
      setInputValue("");
      setError(null);
    }
  }, [navigation, currentVaultPath]);

  const handleLanguageSelect = useCallback((item: MenuItem) => {
    setLanguage(item.value as SupportedLanguage);
    setStep("menu");
  }, [setLanguage]);

  const handleInputSubmit = useCallback((value: string) => {
    if (!value.trim() || !selectedKey) {
      setError("API key cannot be empty");
      return;
    }

    try {
      setApiKeyInKeychain(selectedKey, value.trim());
      setSuccessType("apiKey");
      setStep("success");
      // Notify parent that config changed
      setTimeout(() => {
        onConfigured();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save API key");
    }
  }, [selectedKey, onConfigured]);

  const handleVaultPathSubmit = useCallback((value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      setError("Path cannot be empty");
      return;
    }

    // Expand ~ to home directory
    const expandedPath = trimmedValue.startsWith("~")
      ? trimmedValue.replace("~", process.env.HOME || "")
      : trimmedValue;

    // Validate path exists
    if (!existsSync(expandedPath)) {
      setError(t.config.vaultPathInvalid);
      return;
    }

    try {
      setStoredVaultPath(expandedPath);
      setSuccessType("vaultPath");
      setStep("success");
      setTimeout(() => {
        onConfigured();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save vault path");
    }
  }, [t.config.vaultPathInvalid, onConfigured]);

  const renderContent = () => {
    switch (step) {
      case "menu":
        return (
          <Box flexDirection="column">
            <Box marginBottom={1}>
              <Text>{t.config.configureApiKeys}</Text>
            </Box>
            <Menu items={menuItems} onSelect={handleMenuSelect} />
          </Box>
        );

      case "input":
        return (
          <Box flexDirection="column">
            <Text bold>{t.config.enterKey} {selectedKey}:</Text>
            <Box marginTop={1}>
              <Text color="cyan">{"> "}</Text>
              <TextInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleInputSubmit}
                mask="*"
              />
            </Box>
            {error && (
              <Box marginTop={1}>
                <Text color="red">{error}</Text>
              </Box>
            )}
            <Box marginTop={1}>
              <Text dimColor>{t.config.inputMasked}</Text>
            </Box>
          </Box>
        );

      case "language":
        return (
          <Box flexDirection="column">
            <Box marginBottom={1}>
              <Text bold>{t.config.selectLanguage}</Text>
            </Box>
            <Menu items={languageItems} onSelect={handleLanguageSelect} />
          </Box>
        );

      case "vaultPath":
        return (
          <Box flexDirection="column">
            <Text bold>{t.config.enterVaultPath}</Text>
            <Box marginTop={1}>
              <Text dimColor>{t.config.currentVaultPath} {currentVaultPath}</Text>
            </Box>
            <Box marginTop={1}>
              <Text color="cyan">{"> "}</Text>
              <TextInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleVaultPathSubmit}
              />
            </Box>
            {error && (
              <Box marginTop={1}>
                <Text color="red">{error}</Text>
              </Box>
            )}
            <Box marginTop={1}>
              <Text dimColor>{t.config.vaultPathHint}</Text>
            </Box>
          </Box>
        );

      case "success":
        return (
          <Box flexDirection="column">
            <Text color="green" bold>
              {successType === "apiKey" ? `${selectedKey} ${t.config.savedSuccess}` : t.config.vaultPathSaved}
            </Text>
            <Box marginTop={1}>
              <Text dimColor>{t.config.returningToMenu}</Text>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  const getKeyBindings = () => {
    if (step === "success") return [];
    if (step === "input" || step === "vaultPath") {
      return [
        { key: "Enter", description: t.config.keyHints.save },
        { key: "Esc", description: t.config.keyHints.cancel },
      ];
    }
    if (step === "language") {
      return [
        { key: "Enter", description: t.config.keyHints.select },
        { key: "Esc", description: t.config.keyHints.back },
      ];
    }
    return [
      { key: "Enter", description: t.config.keyHints.select },
      { key: "Esc", description: t.config.keyHints.back },
    ];
  };

  return (
    <Box flexDirection="column">
      <Header title={t.config.title} breadcrumb={t.config.breadcrumb} />
      {renderContent()}
      {step !== "success" && <KeyHintBar bindings={getKeyBindings()} />}
    </Box>
  );
}
