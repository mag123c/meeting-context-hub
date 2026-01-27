import React from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { SectionBox } from '../components/SectionBox.js';
import { t } from '../../i18n/index.js';
import type { Screen } from '../hooks/useNavigation.js';
import { VERSION } from '../../version.js';

// ASCII Logo - Block style (no curves)
const LOGO = `
 █▀▄▀█ █▀▀ █▀▀ ▀█▀ █ █▄ █ █▀▀   █▀▀ █▀█ █▄ █ ▀█▀ █▀▀ █ █ ▀█▀   █ █ █ █ █▀▄
 █ ▀ █ █▀▀ █▀▀  █  █ █ ▀█ █ █   █   █ █ █ ▀█  █  █▀▀  █   █    █▀█ █ █ █▀▄
 ▀   ▀ ▀▀▀ ▀▀▀  ▀  ▀ ▀  ▀ ▀▀▀   ▀▀▀ ▀▀▀ ▀  ▀  ▀  ▀▀▀ ▀ ▀  ▀    ▀ ▀ ▀▀▀ ▀▀▀
`.trim();

interface MainMenuProps {
  navigate: (screen: Screen) => void;
  onExit: () => void;
  language?: 'ko' | 'en';
}

interface MenuItem {
  label: string;
  value: Screen | 'exit';
}

export function MainMenu({ navigate, onExit, language = 'en' }: MainMenuProps): React.ReactElement {
  const menuItems: MenuItem[] = [
    { label: `${t('menu.add_context', language)}`, value: 'add' },
    { label: `${t('menu.record_meeting', language)}`, value: 'record' },
    { label: `${t('menu.search', language)}`, value: 'search' },
    { label: `${t('menu.list_contexts', language)}`, value: 'list' },
    { label: `${t('menu.projects', language)}`, value: 'projects' },
    { label: `${t('menu.settings', language)}`, value: 'settings' },
    { label: `${t('menu.exit', language)}`, value: 'exit' },
  ];

  const handleSelect = (item: MenuItem) => {
    if (item.value === 'exit') {
      onExit();
    } else {
      navigate(item.value);
    }
  };

  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c')) {
      onExit();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      {/* Logo */}
      <Box flexDirection="column">
        <Text color="cyan">{LOGO}</Text>
        <Text color="gray">v{VERSION}</Text>
      </Box>

      <SectionBox color="cyan" marginY={1}>
        <SelectInput items={menuItems} onSelect={handleSelect} />
      </SectionBox>

      <Text color="gray" dimColor>{t('menu.hint', language)}</Text>
    </Box>
  );
}
