import { Box } from "ink";
import { Header, Menu, KeyHintBar, type MenuItem } from "../components/index.js";
import type { NavigationContext, Screen } from "../App.js";

interface MainMenuProps {
  navigation: NavigationContext;
  onExit: () => void;
}

const menuItems: MenuItem[] = [
  { label: "Add Context", value: "add" },
  { label: "Search", value: "search" },
  { label: "List All", value: "list" },
  { label: "Config", value: "config" },
  { label: "Exit", value: "exit" },
];

const keyBindings = [
  { key: "Enter", description: "Select" },
  { key: "q", description: "Quit" },
];

export function MainMenu({ navigation, onExit }: MainMenuProps) {
  const handleSelect = (item: MenuItem) => {
    if (item.value === "exit") {
      onExit();
    } else {
      navigation.navigate(item.value as Screen);
    }
  };

  return (
    <Box flexDirection="column">
      <Header title="Meeting Context Hub" />
      <Menu items={menuItems} onSelect={handleSelect} />
      <KeyHintBar bindings={keyBindings} />
    </Box>
  );
}
