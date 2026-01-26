import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { Header } from '../components/Header.js';
import { TextInput } from '../components/TextInput.js';
import { Spinner } from '../components/Spinner.js';
import { ErrorText } from '../components/ErrorDisplay.js';
import { ConfigService } from '../../core/services/config.service.js';
import { t } from '../../i18n/index.js';
import type { ConfigStatus } from '../../adapters/config/index.js';

interface SettingsScreenProps {
  goBack: () => void;
  onConfigChange?: () => void;
  language?: 'ko' | 'en';
}

type Mode = 'view' | 'edit-anthropic' | 'edit-openai' | 'edit-language' | 'edit-dbpath';

const configService = new ConfigService();

export function SettingsScreen({
  goBack,
  onConfigChange,
  language = 'en',
}: SettingsScreenProps): React.ReactElement {
  const [mode, setMode] = useState<Mode>('view');
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [dbPathInput, setDbPathInput] = useState('');
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
      setError(new Error(t('settings.api_key_empty', language)));
      return;
    }

    setSaving(true);
    setError(null);

    const result = await configService.setApiKey(key, apiKeyInput);

    setSaving(false);

    if (result.success) {
      setSuccess(
        language === 'ko'
          ? `${key === 'anthropic' ? 'Anthropic' : 'OpenAI'} ${t('settings.api_key_saved', language)}`
          : `${key === 'anthropic' ? 'Anthropic' : 'OpenAI'} ${t('settings.api_key_saved', language)}`
      );
      setApiKeyInput('');
      setMode('view');
      loadStatus();
      onConfigChange?.();

      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(new Error(result.error || 'Failed to save API key'));
    }
  }, [apiKeyInput, loadStatus, onConfigChange, language]);

  const handleSaveLanguage = useCallback(async (newLanguage: 'ko' | 'en') => {
    setSaving(true);
    setError(null);

    const result = await configService.setConfigValue('language', newLanguage);

    setSaving(false);

    if (result.success) {
      setSuccess(t('settings.language_changed', newLanguage));
      setMode('view');
      loadStatus();
      onConfigChange?.();

      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(new Error(result.error || 'Failed to save language'));
    }
  }, [loadStatus, onConfigChange]);

  const handleSaveDbPath = useCallback(async () => {
    if (!dbPathInput.trim()) {
      setError(new Error(language === 'ko' ? '경로를 입력해주세요' : 'Path cannot be empty'));
      return;
    }

    setSaving(true);
    setError(null);

    const result = await configService.setConfigValue('dbPath', dbPathInput.trim());

    setSaving(false);

    if (result.success) {
      setSuccess(t('settings.db_path_saved', language));
      setDbPathInput('');
      setMode('view');
      loadStatus();
      onConfigChange?.();

      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(new Error(result.error || 'Failed to save database path'));
    }
  }, [dbPathInput, loadStatus, onConfigChange, language]);

  useInput((_, key) => {
    if (key.escape) {
      if (mode !== 'view') {
        setMode('view');
        setApiKeyInput('');
        setDbPathInput('');
        setError(null);
      } else {
        goBack();
      }
      return;
    }

    if (key.return) {
      if ((mode === 'edit-anthropic' || mode === 'edit-openai') && apiKeyInput.trim()) {
        handleSaveKey(mode === 'edit-anthropic' ? 'anthropic' : 'openai');
      } else if (mode === 'edit-dbpath' && dbPathInput.trim()) {
        handleSaveDbPath();
      }
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header title={t('settings.title', language)} />
        <Spinner message={t('settings.loading_config', language)} />
      </Box>
    );
  }

  // API Key edit modes
  if (mode === 'edit-anthropic' || mode === 'edit-openai') {
    const keyType = mode === 'edit-anthropic' ? 'Anthropic' : 'OpenAI';
    const placeholder = mode === 'edit-anthropic' ? 'sk-ant-...' : 'sk-...';

    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title={`${keyType} API Key`}
          subtitle={t('settings.enter_api_key', language)}
        />

        {saving ? (
          <Spinner message={t('settings.saving', language)} />
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
                {t('settings.hint_edit', language)}
              </Text>
            </Box>
          </>
        )}
      </Box>
    );
  }

  // Language selection mode
  if (mode === 'edit-language') {
    const languageItems = [
      { label: `${t('settings.korean', language)} (한국어)`, value: 'ko' as const },
      { label: `${t('settings.english', language)} (English)`, value: 'en' as const },
    ];

    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title={t('settings.change_language', language)}
          subtitle={t('settings.select_language', language)}
        />

        {saving ? (
          <Spinner message={t('settings.saving', language)} />
        ) : (
          <>
            <Box marginY={1}>
              <SelectInput
                items={languageItems}
                onSelect={(item) => handleSaveLanguage(item.value)}
              />
            </Box>

            {error && (
              <Box marginY={1}>
                <ErrorText error={error} language={language} />
              </Box>
            )}

            <Box marginTop={1}>
              <Text color="gray" dimColor>
                {t('hint.esc_cancel', language)}
              </Text>
            </Box>
          </>
        )}
      </Box>
    );
  }

  // DB Path edit mode
  if (mode === 'edit-dbpath') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title={t('settings.change_db_path', language)}
          subtitle={t('settings.db_path_label', language)}
        />

        {saving ? (
          <Spinner message={t('settings.saving', language)} />
        ) : (
          <>
            <Box marginY={1}>
              <TextInput
                value={dbPathInput}
                onChange={setDbPathInput}
                placeholder={status?.dbPath || '~/.mch/data.db'}
              />
            </Box>

            <Box marginY={1} borderStyle="single" borderColor="yellow" paddingX={1}>
              <Text color="yellow">{t('settings.db_path_warning', language)}</Text>
            </Box>

            {error && (
              <Box marginY={1}>
                <ErrorText error={error} language={language} />
              </Box>
            )}

            <Box marginTop={1}>
              <Text color="gray" dimColor>
                {t('settings.hint_edit', language)}
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
      label: `${t('settings.set_anthropic_key', language)} ${status?.anthropicKey.set ? `(${t('settings.configured', language)})` : `(${t('settings.required', language)})`}`,
      value: 'anthropic',
    },
    {
      label: `${t('settings.set_openai_key', language)} ${status?.openaiKey.set ? `(${t('settings.configured', language)})` : `(${t('settings.optional', language)})`}`,
      value: 'openai',
    },
    {
      label: `${t('settings.change_language', language)} (${status?.language === 'ko' ? '한국어' : 'English'})`,
      value: 'language',
    },
    {
      label: t('settings.change_db_path', language),
      value: 'dbpath',
    },
    { label: t('common.back', language), value: 'back' },
  ];

  return (
    <Box flexDirection="column" padding={1}>
      <Header title={t('settings.title', language)} subtitle={t('settings.subtitle', language)} />

      {/* Status Display */}
      <Box flexDirection="column" marginY={1} borderStyle="round" borderColor="gray" paddingX={1}>
        <Text bold>{t('settings.current_config', language)}</Text>
        <Box marginTop={1}>
          <Text>{t('settings.anthropic_key', language)}: </Text>
          <Text color={status?.anthropicKey.set ? 'green' : 'red'}>
            {status?.anthropicKey.set ? status.anthropicKey.masked : t('settings.not_set', language)}
          </Text>
          {status?.anthropicKey.set && (
            <Text color="gray" dimColor> ({status.anthropicKey.source})</Text>
          )}
        </Box>
        <Box>
          <Text>{t('settings.openai_key', language)}: </Text>
          <Text color={status?.openaiKey.set ? 'green' : 'yellow'}>
            {status?.openaiKey.set ? status.openaiKey.masked : t('settings.not_set', language)}
          </Text>
          {status?.openaiKey.set && (
            <Text color="gray" dimColor> ({status.openaiKey.source})</Text>
          )}
        </Box>
        <Box marginTop={1}>
          <Text color="gray">{t('settings.database', language)}: {status?.dbPath}</Text>
        </Box>
        <Box>
          <Text color="gray">{t('settings.language', language)}: {status?.language === 'ko' ? '한국어' : 'English'}</Text>
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
            } else if (item.value === 'language') {
              setMode('edit-language');
              setError(null);
            } else if (item.value === 'dbpath') {
              setMode('edit-dbpath');
              setDbPathInput(status?.dbPath || '');
              setError(null);
            }
          }}
        />
      </Box>

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          {t('hint.esc_back', language)}
        </Text>
      </Box>
    </Box>
  );
}
