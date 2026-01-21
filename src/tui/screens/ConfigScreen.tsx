import { useState, useCallback, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { Header, Menu, KeyHintBar, type MenuItem } from "../components/index.js";
import type { NavigationContext } from "../App.js";
import { getApiKeyFromKeychain, setApiKeyInKeychain } from "../../config/keychain.js";

interface ConfigScreenProps {
  navigation: NavigationContext;
  onConfigured: () => void;
}

type Step = "menu" | "input" | "success";
type ConfigKey = "ANTHROPIC_API_KEY" | "OPENAI_API_KEY";

interface KeyStatus {
  anthropic: boolean;
  openai: boolean;
}

export function ConfigScreen({ navigation, onConfigured }: ConfigScreenProps) {
  const [step, setStep] = useState<Step>("menu");
  const [selectedKey, setSelectedKey] = useState<ConfigKey | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [keyStatus, setKeyStatus] = useState<KeyStatus>({ anthropic: false, openai: false });
  const [error, setError] = useState<string | null>(null);

  // Check current key status
  useEffect(() => {
    const anthropic = getApiKeyFromKeychain("ANTHROPIC_API_KEY");
    const openai = getApiKeyFromKeychain("OPENAI_API_KEY");
    setKeyStatus({
      anthropic: !!anthropic,
      openai: !!openai,
    });
  }, [step]);

  useInput((_, key) => {
    if (key.escape) {
      if (step === "menu") {
        navigation.goBack();
      } else {
        setStep("menu");
        setSelectedKey(null);
        setInputValue("");
        setError(null);
      }
    }
  });

  const menuItems: MenuItem[] = [
    {
      label: `ANTHROPIC_API_KEY ${keyStatus.anthropic ? "(configured)" : "(not set)"}`,
      value: "ANTHROPIC_API_KEY",
    },
    {
      label: `OPENAI_API_KEY ${keyStatus.openai ? "(configured)" : "(not set)"}`,
      value: "OPENAI_API_KEY",
    },
    { label: "Back", value: "back" },
  ];

  const handleMenuSelect = useCallback((item: MenuItem) => {
    if (item.value === "back") {
      navigation.goBack();
    } else {
      setSelectedKey(item.value as ConfigKey);
      setStep("input");
      setInputValue("");
      setError(null);
    }
  }, [navigation]);

  const handleInputSubmit = useCallback((value: string) => {
    if (!value.trim() || !selectedKey) {
      setError("API key cannot be empty");
      return;
    }

    try {
      setApiKeyInKeychain(selectedKey, value.trim());
      setStep("success");
      // Notify parent that config changed
      setTimeout(() => {
        onConfigured();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save API key");
    }
  }, [selectedKey, onConfigured]);

  const renderContent = () => {
    switch (step) {
      case "menu":
        return (
          <Box flexDirection="column">
            <Box marginBottom={1}>
              <Text>Configure API keys (stored in macOS Keychain):</Text>
            </Box>
            <Menu items={menuItems} onSelect={handleMenuSelect} />
          </Box>
        );

      case "input":
        return (
          <Box flexDirection="column">
            <Text bold>Enter {selectedKey}:</Text>
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
              <Text dimColor>Input is masked for security</Text>
            </Box>
          </Box>
        );

      case "success":
        return (
          <Box flexDirection="column">
            <Text color="green" bold>
              {selectedKey} saved successfully!
            </Text>
            <Box marginTop={1}>
              <Text dimColor>Returning to menu...</Text>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  const getKeyBindings = () => {
    if (step === "success") return [];
    if (step === "input") {
      return [
        { key: "Enter", description: "Save" },
        { key: "Esc", description: "Cancel" },
      ];
    }
    return [
      { key: "Enter", description: "Select" },
      { key: "Esc", description: "Back" },
    ];
  };

  return (
    <Box flexDirection="column">
      <Header title="Configuration" breadcrumb={["Main", "Config"]} />
      {renderContent()}
      {step !== "success" && <KeyHintBar bindings={getKeyBindings()} />}
    </Box>
  );
}
