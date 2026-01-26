import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { Header } from '../components/Header.js';
import { TextInput } from '../components/TextInput.js';
import { Spinner } from '../components/Spinner.js';
import { ErrorText } from '../components/ErrorDisplay.js';
import { ConfigService } from '../../core/services/config.service.js';
import type { ConfigStatus } from '../../adapters/config/index.js';

interface SettingsScreenProps {
  goBack: () => void;
  onConfigChange?: () => void;
  language?: 'ko' | 'en';
}

type Mode = 'view' | 'edit-anthropic' | 'edit-openai';

const configService = new ConfigService();

export function SettingsScreen({
  goBack,
  onConfigChange,
  language = 'ko',
}: SettingsScreenProps): React.ReactElement {
  const [mode, setMode] = useState<Mode>('view');
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadStatus = useCallback(() => {
    try {
      const s = configService.getConfigStatus();
      setStatus(s);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load config'));
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleSaveKey = useCallback(async (key: 'anthropic' | 'openai') => {
    if (!apiKeyInput.trim()) {
      setError(new Error(language === 'ko' ? 'API 키를 입력해주세요' : 'API key cannot be empty'));
      return;
    }

    setSaving(true);
    setError(null);

    const result = await configService.setApiKey(key, apiKeyInput);

    setSaving(false);

    if (result.success) {
      setSuccess(
        language === 'ko'
          ? `${key === 'anthropic' ? 'Anthropic' : 'OpenAI'} API 키가 저장되었습니다!`
          : `${key === 'anthropic' ? 'Anthropic' : 'OpenAI'} API key saved successfully!`
      );
      setApiKeyInput('');
      setMode('view');
      loadStatus();
      onConfigChange?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(new Error(result.error || 'Failed to save API key'));
    }
  }, [apiKeyInput, loadStatus, onConfigChange, language]);

  useInput((_, key) => {
    if (key.escape) {
      if (mode !== 'view') {
        setMode('view');
        setApiKeyInput('');
        setError(null);
      } else {
        goBack();
      }
      return;
    }

    if (key.return && mode !== 'view' && apiKeyInput.trim()) {
      handleSaveKey(mode === 'edit-anthropic' ? 'anthropic' : 'openai');
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title="Settings" />
        <Spinner message="Loading configuration..." />
      </Box>
    );
  }

  if (mode === 'edit-anthropic' || mode === 'edit-openai') {
    const keyType = mode === 'edit-anthropic' ? 'Anthropic' : 'OpenAI';
    const placeholder = mode === 'edit-anthropic' ? 'sk-ant-...' : 'sk-...';

    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title={`Set ${keyType} API Key`}
          subtitle="Enter your API key below"
        />

        {saving ? (
          <Spinner message="Saving..." />
        ) : (
          <>
            <Box marginY={1}>
              <TextInput
                value={apiKeyInput}
                onChange={setApiKeyInput}
                placeholder={placeholder}
              />
            </Box>

            {error && (
              <Box marginY={1}>
                <ErrorText error={error} language={language} />
              </Box>
            )}

            <Box marginTop={1}>
              <Text color="gray" dimColor>
                Enter to save | ESC to cancel
              </Text>
            </Box>
          </>
        )}
      </Box>
    );
  }

  // View mode
  const menuItems = [
    {
      label: `Set Anthropic API Key ${status?.anthropicKey.set ? '(configured)' : '(required)'}`,
      value: 'anthropic',
    },
    {
      label: `Set OpenAI API Key ${status?.openaiKey.set ? '(configured)' : '(optional)'}`,
      value: 'openai',
    },
    { label: 'Back', value: 'back' },
  ];

  return (
    <Box flexDirection="column" padding={1}>
      <Header title="Settings" subtitle="Configure API keys and preferences" />

      {/* Status Display */}
      <Box flexDirection="column" marginY={1} borderStyle="round" borderColor="gray" paddingX={1}>
        <Text bold>Current Configuration</Text>
        <Box marginTop={1}>
          <Text>Anthropic API Key: </Text>
          <Text color={status?.anthropicKey.set ? 'green' : 'red'}>
            {status?.anthropicKey.masked}
          </Text>
          {status?.anthropicKey.set && (
            <Text color="gray" dimColor> ({status.anthropicKey.source})</Text>
          )}
        </Box>
        <Box>
          <Text>OpenAI API Key: </Text>
          <Text color={status?.openaiKey.set ? 'green' : 'yellow'}>
            {status?.openaiKey.masked}
          </Text>
          {status?.openaiKey.set && (
            <Text color="gray" dimColor> ({status.openaiKey.source})</Text>
          )}
        </Box>
        <Box marginTop={1}>
          <Text color="gray">Database: {status?.dbPath}</Text>
        </Box>
        <Box>
          <Text color="gray">Language: {status?.language}</Text>
        </Box>
      </Box>

      {success && (
        <Box marginY={1}>
          <Text color="green">{success}</Text>
        </Box>
      )}

      {error && (
        <Box marginY={1}>
          <ErrorText error={error} language={language} />
        </Box>
      )}

      {/* Menu */}
      <Box marginTop={1}>
        <SelectInput
          items={menuItems}
          onSelect={(item) => {
            if (item.value === 'back') {
              goBack();
            } else if (item.value === 'anthropic') {
              setMode('edit-anthropic');
              setError(null);
            } else if (item.value === 'openai') {
              setMode('edit-openai');
              setError(null);
            }
          }}
        />
      </Box>

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          ESC to go back
        </Text>
      </Box>
    </Box>
  );
}
