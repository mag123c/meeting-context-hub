import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

interface ScrollableListProps<T> {
  items: T[];
  selectedIndex: number;
  renderItem: (item: T, index: number, isSelected: boolean) => React.ReactNode;
  maxVisible?: number;
  showIndicator?: boolean;
  emptyMessage?: string;
}

// Calculate initial scroll offset to ensure selectedIndex is visible
function calculateInitialOffset(selectedIndex: number, maxVisible: number): number {
  if (selectedIndex >= maxVisible) {
    return selectedIndex - maxVisible + 1;
  }
  return 0;
}

export function ScrollableList<T>({
  items,
  selectedIndex,
  renderItem,
  maxVisible = 10,
  showIndicator = true,
  emptyMessage,
}: ScrollableListProps<T>): React.ReactElement {
  const [scrollOffset, setScrollOffset] = useState(() =>
    calculateInitialOffset(selectedIndex, maxVisible)
  );

  useEffect(() => {
    // Selection moved below viewport
    if (selectedIndex >= scrollOffset + maxVisible) {
      setScrollOffset(selectedIndex - maxVisible + 1);
    }
    // Selection moved above viewport
    if (selectedIndex < scrollOffset) {
      setScrollOffset(selectedIndex);
    }
  }, [selectedIndex, maxVisible, scrollOffset]);

  if (items.length === 0) {
    return <Text color="gray">{emptyMessage || 'No items'}</Text>;
  }

  const visibleItems = items.slice(scrollOffset, scrollOffset + maxVisible);
  const hasMore = scrollOffset + maxVisible < items.length;
  const hasPrev = scrollOffset > 0;

  return (
    <Box flexDirection="column">
      {showIndicator && hasPrev && (
        <Text color="gray" dimColor>▲ {scrollOffset} more</Text>
      )}
      {visibleItems.map((item, i) => {
        const actualIndex = scrollOffset + i;
        return (
          <Box key={actualIndex}>
            {renderItem(item, actualIndex, actualIndex === selectedIndex)}
          </Box>
        );
      })}
      {showIndicator && hasMore && (
        <Text color="gray" dimColor>▼ {items.length - scrollOffset - maxVisible} more</Text>
      )}
    </Box>
  );
}
