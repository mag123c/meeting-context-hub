import React from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { Header } from '../components/Header.js';
import type { Screen } from '../hooks/useNavigation.js';

interface MainMenuProps {
  navigate: (screen: Screen) => void;
  onExit: () => void;
}

interface MenuItem {
  label: string;
  value: Screen | 'exit';
}

const menuItems: MenuItem[] = [
  { label: '📝 Add Context', value: 'add' },
  { label: '🎙️ Record Meeting', value: 'record' },
  { label: '🔍 Search', value: 'search' },
  { label: '📋 List Contexts', value: 'list' },
  { label: '📁 Projects', value: 'projects' },
  { label: '⚙️  Settings', value: 'settings' },
  { label: '🚪 Exit', value: 'exit' },
];

export function MainMenu({ navigate, onExit }: MainMenuProps): React.ReactElement {
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
      <Header
        title="Meeting Context Hub"
        subtitle="Capture discussions, extract insights"
      />

      <Box marginY={1}>
        <SelectInput items={menuItems} onSelect={handleSelect} />
      </Box>

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          Use arrow keys to navigate, Enter to select, q to quit
        </Text>
      </Box>
    </Box>
  );
}
