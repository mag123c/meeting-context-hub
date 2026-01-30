import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput } from './TextInput.js';
import { ScrollableList } from './ScrollableList.js';
import { t } from '../../i18n/index.js';

interface StringListEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
  onDone: () => void;
  language?: 'ko' | 'en';
  focus?: boolean;
}

type EditorMode = 'list' | 'edit' | 'add';

/**
 * Component for editing string[] arrays (decisions, policies, etc.)
 * Keyboard shortcuts:
 * - Arrow keys: Navigate items
 * - Enter: Edit selected item
 * - a: Add new item
 * - d: Delete selected item
 * - ESC: Done editing (or cancel current edit)
 */
export function StringListEditor({
  items,
  onChange,
  onDone,
  language = 'en',
  focus = true,
}: StringListEditorProps): React.ReactElement {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<EditorMode>('list');
  const [editValue, setEditValue] = useState('');

  const handleDelete = useCallback(() => {
    if (items.length === 0) return;
    const newItems = items.filter((_, i) => i !== selectedIndex);
    onChange(newItems);
    // Adjust selected index if necessary
    if (selectedIndex >= newItems.length && newItems.length > 0) {
      setSelectedIndex(newItems.length - 1);
    }
  }, [items, selectedIndex, onChange]);

  const handleEditSubmit = useCallback(() => {
    if (mode === 'edit') {
      const newItems = [...items];
      newItems[selectedIndex] = editValue;
      onChange(newItems);
      setMode('list');
    } else if (mode === 'add') {
      if (editValue.trim()) {
        onChange([...items, editValue.trim()]);
        setSelectedIndex(items.length); // Select the new item
      }
      setMode('list');
    }
    setEditValue('');
  }, [mode, items, selectedIndex, editValue, onChange]);

  useInput(
    (input, key) => {
      if (!focus) return;

      // In edit mode, only handle ESC
      if (mode === 'edit' || mode === 'add') {
        if (key.escape) {
          setMode('list');
          setEditValue('');
        }
        return;
      }

      // List mode
      if (key.escape) {
        onDone();
        return;
      }

      if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
        return;
      }

      if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (input === 'd' && items.length > 0) {
        handleDelete();
        return;
      }

      if (input === 'a') {
        setEditValue('');
        setMode('add');
        return;
      }

      if (key.return && items.length > 0) {
        setEditValue(items[selectedIndex]);
        setMode('edit');
        return;
      }
    },
    { isActive: focus }
  );

  // Edit or Add mode
  if (mode === 'edit' || mode === 'add') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="cyan">
            {mode === 'edit' ? `${t('common.edit', language)}:` : `${t('edit.add_item', language)}:`}
          </Text>
        </Box>
        <TextInput
          value={editValue}
          onChange={setEditValue}
          onSubmit={handleEditSubmit}
          placeholder={t('edit.new_item_placeholder', language)}
        />
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            {t('edit.hint_editing', language)}
          </Text>
        </Box>
      </Box>
    );
  }

  // List mode
  if (items.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color="gray" dimColor>
          ({t('edit.empty_list', language)})
        </Text>
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            {t('edit.hint_list_editing', language)}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <ScrollableList
        items={items}
        selectedIndex={selectedIndex}
        maxVisible={10}
        renderItem={(item, index, isSelected) => (
          <Text color={isSelected ? 'cyan' : undefined}>
            {isSelected ? '> ' : '  '}
            {index + 1}. {item}
          </Text>
        )}
      />
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          {t('edit.hint_list_editing', language)}
        </Text>
      </Box>
    </Box>
  );
}
