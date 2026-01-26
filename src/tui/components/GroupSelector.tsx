import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import type { Project } from '../../types/index.js';
import { t } from '../../i18n/index.js';

export interface GroupSelectorProps {
  /** Available projects (groups) */
  projects: Project[];
  /** Currently selected project ID */
  currentProjectId: string | null;
  /** Called when a group is selected */
  onSelect: (projectId: string | null) => void;
  /** Called when a new group should be created */
  onCreate: (name: string) => Promise<void>;
  /** Called when user cancels */
  onCancel: () => void;
  /** Language for UI strings */
  language?: 'ko' | 'en';
}

type Mode = 'list' | 'create';

/**
 * Group selector modal for changing context's group
 *
 * Features:
 * - List existing groups with current selection highlighted
 * - "(Uncategorized)" option to remove from group
 * - "+ Create new group" option to create inline
 *
 * Key bindings:
 * - Up/Down: Navigate list
 * - Enter: Select/submit
 * - ESC: Cancel/go back
 */
export function GroupSelector({
  projects,
  currentProjectId,
  onSelect,
  onCreate,
  onCancel,
  language = 'en',
}: GroupSelectorProps): React.ReactElement {
  const [mode, setMode] = useState<Mode>('list');
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build list items
  const items = [
    {
      label: t('list.uncategorized', language),
      value: '__uncategorized__',
      indicator: currentProjectId === null ? '*' : ' ',
    },
    ...projects.map((p) => ({
      label: p.name,
      value: p.id,
      indicator: p.id === currentProjectId ? '*' : ' ',
    })),
    {
      label: t('dialog.create_new_group', language),
      value: '__create__',
      indicator: ' ',
    },
  ];

  const handleSelect = async (item: { value: string }) => {
    if (item.value === '__create__') {
      setMode('create');
      return;
    }

    if (item.value === '__uncategorized__') {
      onSelect(null);
      return;
    }

    onSelect(item.value);
  };

  const handleCreateSubmit = async () => {
    if (!newGroupName.trim()) {
      setError(language === 'ko' ? '이름을 입력하세요' : 'Please enter a name');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      await onCreate(newGroupName.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
      setCreating(false);
    }
  };

  useInput(
    (_input, key) => {
      if (key.escape) {
        if (mode === 'create') {
          setMode('list');
          setNewGroupName('');
          setError(null);
        } else {
          onCancel();
        }
      }
    },
    { isActive: mode === 'create' || mode === 'list' }
  );

  if (mode === 'create') {
    return (
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="cyan"
        paddingX={2}
        paddingY={1}
      >
        <Text bold color="cyan">
          {t('dialog.change_group_title', language)}
        </Text>

        <Box marginY={1} flexDirection="column">
          <Text>{t('dialog.new_group_name', language)}</Text>
          <Box marginTop={1}>
            {creating ? (
              <Text color="yellow">{t('dialog.creating_group', language)}</Text>
            ) : (
              <TextInput
                value={newGroupName}
                onChange={setNewGroupName}
                onSubmit={handleCreateSubmit}
                placeholder={t('project.name_placeholder', language)}
              />
            )}
          </Box>
          {error && (
            <Box marginTop={1}>
              <Text color="red">{error}</Text>
            </Box>
          )}
        </Box>

        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Enter: {t('common.confirm', language)} | ESC: {t('common.back', language)}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
    >
      <Text bold color="cyan">
        {t('dialog.change_group_title', language)}
      </Text>

      <Box marginY={1}>
        <Text color="gray">{t('dialog.select_group', language)}</Text>
      </Box>

      <SelectInput
        items={items.map((item) => ({
          label: `${item.indicator} ${item.label}`,
          value: item.value,
        }))}
        onSelect={handleSelect}
      />

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          {'↑/↓ Navigate | Enter: Select | ESC: Cancel'}
        </Text>
      </Box>
    </Box>
  );
}
