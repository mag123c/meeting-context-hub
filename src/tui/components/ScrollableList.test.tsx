import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { ScrollableList } from './ScrollableList.js';

describe('ScrollableList', () => {
  const createItems = (count: number) =>
    Array.from({ length: count }, (_, i) => `Item ${i + 1}`);

  const defaultRenderItem = (item: string, _index: number, isSelected: boolean) => (
    <Text color={isSelected ? 'cyan' : undefined}>
      {isSelected ? '> ' : '  '}{item}
    </Text>
  );

  it('should render all items when less than maxVisible', () => {
    const items = createItems(5);
    const { lastFrame } = render(
      <ScrollableList
        items={items}
        selectedIndex={0}
        renderItem={defaultRenderItem}
        maxVisible={10}
      />
    );

    expect(lastFrame()).toContain('Item 1');
    expect(lastFrame()).toContain('Item 5');
    expect(lastFrame()).not.toContain('▲');
    expect(lastFrame()).not.toContain('▼');
  });

  it('should show empty message when no items', () => {
    const { lastFrame } = render(
      <ScrollableList
        items={[]}
        selectedIndex={0}
        renderItem={defaultRenderItem}
        emptyMessage="No entries found"
      />
    );

    expect(lastFrame()).toContain('No entries found');
  });

  it('should show default empty message when no custom message provided', () => {
    const { lastFrame } = render(
      <ScrollableList
        items={[]}
        selectedIndex={0}
        renderItem={defaultRenderItem}
      />
    );

    expect(lastFrame()).toContain('No items');
  });

  it('should show down indicator when more items below', () => {
    const items = createItems(15);
    const { lastFrame } = render(
      <ScrollableList
        items={items}
        selectedIndex={0}
        renderItem={defaultRenderItem}
        maxVisible={10}
      />
    );

    expect(lastFrame()).toContain('Item 1');
    expect(lastFrame()).toContain('Item 10');
    expect(lastFrame()).not.toContain('Item 11');
    expect(lastFrame()).toContain('▼ 5 more');
    expect(lastFrame()).not.toContain('▲');
  });

  it('should scroll down when selection moves below viewport', () => {
    const items = createItems(15);
    // Start with selection at index 11 (Item 12) which is outside initial viewport
    const { lastFrame } = render(
      <ScrollableList
        items={items}
        selectedIndex={11}
        renderItem={defaultRenderItem}
        maxVisible={10}
      />
    );

    // Selection at index 11 should show items 2-11 (indices 1-10 visible, offset 2)
    expect(lastFrame()).toContain('Item 12');
    expect(lastFrame()).toContain('▲ 2 more');
    expect(lastFrame()).toContain('▼ 3 more');
  });

  it('should show items at start when selection is at beginning', () => {
    const items = createItems(15);
    // Start with selection at index 2 which is within the first viewport
    const { lastFrame } = render(
      <ScrollableList
        items={items}
        selectedIndex={2}
        renderItem={defaultRenderItem}
        maxVisible={10}
      />
    );

    // With selection at index 2, viewport should start at 0
    expect(lastFrame()).toContain('Item 3');
    expect(lastFrame()).toContain('Item 1');
    expect(lastFrame()).not.toContain('▲');
    expect(lastFrame()).toContain('▼ 5 more');
  });

  it('should hide indicators when showIndicator is false', () => {
    const items = createItems(15);
    const { lastFrame } = render(
      <ScrollableList
        items={items}
        selectedIndex={5}
        renderItem={defaultRenderItem}
        maxVisible={10}
        showIndicator={false}
      />
    );

    expect(lastFrame()).not.toContain('▲');
    expect(lastFrame()).not.toContain('▼');
  });

  it('should highlight the selected item', () => {
    const items = createItems(5);
    const { lastFrame } = render(
      <ScrollableList
        items={items}
        selectedIndex={2}
        renderItem={defaultRenderItem}
      />
    );

    // The renderItem function adds '> ' prefix for selected item
    expect(lastFrame()).toContain('> Item 3');
  });

  it('should handle edge case at end of list', () => {
    const items = createItems(15);
    const { lastFrame } = render(
      <ScrollableList
        items={items}
        selectedIndex={14}
        renderItem={defaultRenderItem}
        maxVisible={10}
      />
    );

    expect(lastFrame()).toContain('Item 15');
    expect(lastFrame()).toContain('▲ 5 more');
    expect(lastFrame()).not.toContain('▼');
  });

  it('should use custom maxVisible value', () => {
    const items = createItems(10);
    const { lastFrame } = render(
      <ScrollableList
        items={items}
        selectedIndex={0}
        renderItem={defaultRenderItem}
        maxVisible={5}
      />
    );

    expect(lastFrame()).toContain('Item 1');
    expect(lastFrame()).toContain('Item 5');
    expect(lastFrame()).not.toContain('Item 6');
    expect(lastFrame()).toContain('▼ 5 more');
  });
});
