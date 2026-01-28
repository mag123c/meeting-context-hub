import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { Header } from '../components/Header.js';
import { TextInput } from '../components/TextInput.js';
import { Spinner } from '../components/Spinner.js';
import { ErrorText } from '../components/ErrorDisplay.js';
import { ConfigService } from '../../core/services/config.service.js';
import { DictionaryService } from '../../core/services/dictionary.service.js';
import { t, ti } from '../../i18n/index.js';
import type { ConfigStatus } from '../../adapters/config/index.js';
import type { DictionaryEntry } from '../../types/index.js';

interface SettingsScreenProps {
  goBack: () => void;
  onConfigChange?: () => void;
  language?: 'ko' | 'en';
  dictionaryService?: DictionaryService;
}

type Mode = 'view' | 'edit-anthropic' | 'edit-openai' | 'edit-language' | 'edit-dbpath' | 'dictionary-list' | 'dictionary-add' | 'dictionary-edit';

const configService = new ConfigService();

export function SettingsScreen({
  goBack,
  onConfigChange,
  language = 'en',
  dictionaryService,
}: SettingsScreenProps): React.ReactElement {
  const [mode, setMode] = useState<Mode>('view');
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [dbPathInput, setDbPathInput] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Dictionary state
  const [dictEntries, setDictEntries] = useState<DictionaryEntry[]>([]);
  const [dictSelectedIndex, setDictSelectedIndex] = useState(0);
  const [dictSource, setDictSource] = useState('');
  const [dictTarget, setDictTarget] = useState('');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [dictInputStep, setDictInputStep] = useState<'source' | 'target'>('source');

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

  const loadDictionaryEntries = useCallback(async () => {
    if (!dictionaryService) return;
    try {
      const entries = await dictionaryService.listEntries();
      setDictEntries(entries);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load dictionary'));
    }
  }, [dictionaryService]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (mode === 'dictionary-list') {
      loadDictionaryEntries();
    }
  }, [mode, loadDictionaryEntries]);

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

  const handleAddDictEntry = useCallback(async () => {
    if (!dictionaryService || !dictSource.trim() || !dictTarget.trim()) return;

    setSaving(true);
    setError(null);

    try {
      await dictionaryService.addEntry(dictSource.trim(), dictTarget.trim());
      setSuccess(t('dictionary.added', language));
      setDictSource('');
      setDictTarget('');
      setDictInputStep('source');
      setMode('dictionary-list');
      await loadDictionaryEntries();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add entry'));
    } finally {
      setSaving(false);
    }
  }, [dictionaryService, dictSource, dictTarget, language, loadDictionaryEntries]);

  const handleUpdateDictEntry = useCallback(async () => {
    if (!dictionaryService || !editingEntryId || !dictSource.trim() || !dictTarget.trim()) return;

    setSaving(true);
    setError(null);

    try {
      await dictionaryService.updateEntry(editingEntryId, {
        source: dictSource.trim(),
        target: dictTarget.trim(),
      });
      setSuccess(t('dictionary.updated', language));
      setDictSource('');
      setDictTarget('');
      setDictInputStep('source');
      setEditingEntryId(null);
      setMode('dictionary-list');
      await loadDictionaryEntries();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update entry'));
    } finally {
      setSaving(false);
    }
  }, [dictionaryService, editingEntryId, dictSource, dictTarget, language, loadDictionaryEntries]);

  const handleDeleteDictEntry = useCallback(async () => {
    if (!dictionaryService || dictEntries.length === 0) return;

    const entry = dictEntries[dictSelectedIndex];
    if (!entry) return;

    setSaving(true);
    setError(null);

    try {
      await dictionaryService.deleteEntry(entry.id);
      setSuccess(t('dictionary.deleted', language));
      await loadDictionaryEntries();
      setDictSelectedIndex((prev) => Math.max(0, prev - 1));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete entry'));
    } finally {
      setSaving(false);
    }
  }, [dictionaryService, dictEntries, dictSelectedIndex, language, loadDictionaryEntries]);

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

  useInput((input, key) => {
    if (key.escape) {
      if (mode === 'dictionary-add' || mode === 'dictionary-edit') {
        setMode('dictionary-list');
        setDictSource('');
        setDictTarget('');
        setDictInputStep('source');
        setEditingEntryId(null);
        setError(null);
      } else if (mode === 'dictionary-list') {
        setMode('view');
        setError(null);
      } else if (mode !== 'view') {
        setMode('view');
        setApiKeyInput('');
        setDbPathInput('');
        setError(null);
      } else {
        goBack();
      }
      return;
    }

    // Dictionary list mode navigation
    if (mode === 'dictionary-list' && !saving) {
      if (key.upArrow) {
        setDictSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setDictSelectedIndex((prev) => Math.min(dictEntries.length - 1, prev + 1));
      } else if (input === 'a') {
        setMode('dictionary-add');
        setDictSource('');
        setDictTarget('');
        setDictInputStep('source');
        setError(null);
      } else if (input === 'd' && dictEntries.length > 0) {
        handleDeleteDictEntry();
      } else if (key.return && dictEntries.length > 0) {
        const entry = dictEntries[dictSelectedIndex];
        if (entry) {
          setEditingEntryId(entry.id);
          setDictSource(entry.source);
          setDictTarget(entry.target);
          setDictInputStep('source');
          setMode('dictionary-edit');
          setError(null);
        }
      }
      return;
    }

    // Dictionary add/edit mode
    if ((mode === 'dictionary-add' || mode === 'dictionary-edit') && !saving) {
      if (key.return) {
        if (dictInputStep === 'source' && dictSource.trim()) {
          setDictInputStep('target');
        } else if (dictInputStep === 'target' && dictTarget.trim()) {
          if (mode === 'dictionary-add') {
            handleAddDictEntry();
          } else {
            handleUpdateDictEntry();
          }
        }
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

  // Dictionary list mode
  if (mode === 'dictionary-list') {
    return (
      <Box flexDirection="column" padding={1}>
        <Header
          title={t('dictionary.title', language)}
          subtitle={ti('dictionary.count', language, { count: dictEntries.length })}
        />

        {saving && <Spinner message={t('dictionary.deleting', language)} />}

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

        {!saving && (
          <>
            <Box flexDirection="column" marginY={1} borderStyle="round" borderColor="cyan" paddingX={1}>
              {dictEntries.length === 0 ? (
                <Text color="gray">{t('dictionary.empty', language)}</Text>
              ) : (
                dictEntries.map((entry, index) => (
                  <Box key={entry.id}>
                    <Text color={index === dictSelectedIndex ? 'cyan' : undefined}>
                      {index === dictSelectedIndex ? '> ' : '  '}
                      {entry.source} {t('dictionary.arrow', language)} {entry.target}
                    </Text>
                  </Box>
                ))
              )}
            </Box>

            <Box marginTop={1}>
              <Text color="gray" dimColor>
                {t('dictionary.hint_list', language)}
              </Text>
            </Box>
          </>
        )}
      </Box>
    );
  }

  // Dictionary add/edit mode
  if (mode === 'dictionary-add' || mode === 'dictionary-edit') {
    const isEdit = mode === 'dictionary-edit';
    const title = isEdit ? t('dictionary.edit_title', language) : t('dictionary.add_title', language);
    const spinnerMsg = isEdit ? t('dictionary.updating', language) : t('dictionary.adding', language);

    return (
      <Box flexDirection="column" padding={1}>
        <Header title={title} />

        {saving ? (
          <Spinner message={spinnerMsg} />
        ) : (
          <>
            <Box marginY={1} flexDirection="column">
              <Box>
                <Text color={dictInputStep === 'source' ? 'cyan' : 'gray'}>
                  {t('dictionary.source_label', language)}{' '}
                </Text>
              </Box>
              {dictInputStep === 'source' ? (
                <TextInput
                  value={dictSource}
                  onChange={setDictSource}
                  placeholder={t('dictionary.source_placeholder', language)}
                />
              ) : (
                <Text>{dictSource}</Text>
              )}
            </Box>

            {dictInputStep === 'target' && (
              <Box marginY={1} flexDirection="column">
                <Box>
                  <Text color="cyan">{t('dictionary.target_label', language)} </Text>
                </Box>
                <TextInput
                  value={dictTarget}
                  onChange={setDictTarget}
                  placeholder={t('dictionary.target_placeholder', language)}
                />
              </Box>
            )}

            {error && (
              <Box marginY={1}>
                <ErrorText error={error} language={language} />
              </Box>
            )}

            <Box marginTop={1}>
              <Text color="gray" dimColor>
                {t('dictionary.hint_form', language)}
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
    {
      label: t('dictionary.manage', language),
      value: 'dictionary',
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
            } else if (item.value === 'dictionary') {
              setMode('dictionary-list');
              setDictSelectedIndex(0);
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
