import SelectInput from "ink-select-input";

export interface MenuItem {
  label: string;
  value: string;
}

interface MenuProps {
  items: MenuItem[];
  onSelect: (item: MenuItem) => void;
}

export function Menu({ items, onSelect }: MenuProps) {
  return (
    <SelectInput
      items={items}
      onSelect={onSelect}
    />
  );
}
