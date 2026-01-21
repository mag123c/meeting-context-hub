import { Box } from "ink";
import { Header, Menu, KeyHintBar, type MenuItem } from "../components/index.js";
import type { NavigationContext, Screen } from "../App.js";
import { useTranslation } from "../../i18n/index.js";

interface MainMenuProps {
  navigation: NavigationContext;
  onExit: () => void;
}

export function MainMenu({ navigation, onExit }: MainMenuProps) {
  const { t } = useTranslation();

  const menuItems: MenuItem[] = [
    { label: t.mainMenu.addContext, value: "add" },
    { label: t.mainMenu.search, value: "search" },
    { label: t.mainMenu.listAll, value: "list" },
    { label: t.mainMenu.config, value: "config" },
    { label: t.mainMenu.exit, value: "exit" },
  ];

  const keyBindings = [
    { key: "Enter", description: t.mainMenu.keyHints.select },
    { key: "q", description: t.mainMenu.keyHints.quit },
  ];

  const handleSelect = (item: MenuItem) => {
    if (item.value === "exit") {
      onExit();
    } else {
      navigation.navigate(item.value as Screen);
    }
  };

  return (
    <Box flexDirection="column">
      <Header title={t.mainMenu.title} />
      <Menu items={menuItems} onSelect={handleSelect} />
      <KeyHintBar bindings={keyBindings} />
    </Box>
  );
}
