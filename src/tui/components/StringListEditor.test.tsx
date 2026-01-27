import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import { StringListEditor } from './StringListEditor.js';

describe('StringListEditor', () => {
  const defaultProps = {
    items: ['Item 1', 'Item 2', 'Item 3'],
    onChange: vi.fn(),
    onDone: vi.fn(),
    language: 'en' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all items', () => {
    const { lastFrame } = render(<StringListEditor {...defaultProps} />);
    expect(lastFrame()).toContain('Item 1');
    expect(lastFrame()).toContain('Item 2');
    expect(lastFrame()).toContain('Item 3');
  });

  it('should show empty state when no items', () => {
    const { lastFrame } = render(<StringListEditor {...defaultProps} items={[]} />);
    expect(lastFrame()).toContain('No items');
  });

  it('should highlight selected item', () => {
    const { lastFrame } = render(<StringListEditor {...defaultProps} />);
    // First item should be selected by default (cyan color)
    expect(lastFrame()).toContain('Item 1');
  });

  it('should render with Korean language', () => {
    const { lastFrame } = render(<StringListEditor {...defaultProps} items={[]} language="ko" />);
    expect(lastFrame()).toContain('항목 없음');
  });

  it('should call onDone when ESC is pressed', () => {
    const { stdin } = render(<StringListEditor {...defaultProps} />);
    stdin.write('\u001B'); // ESC key
    expect(defaultProps.onDone).toHaveBeenCalled();
  });

  it('should call onChange when deleting an item', () => {
    const { stdin } = render(<StringListEditor {...defaultProps} />);
    stdin.write('d'); // Delete key
    expect(defaultProps.onChange).toHaveBeenCalledWith(['Item 2', 'Item 3']);
  });

  it('should navigate down with arrow key', () => {
    const { stdin, lastFrame } = render(<StringListEditor {...defaultProps} />);
    stdin.write('\u001B[B'); // Down arrow
    // After pressing down, Item 2 should be selected
    const frame = lastFrame();
    expect(frame).toContain('Item 2');
  });

  it('should navigate up with arrow key', () => {
    const { stdin, lastFrame } = render(<StringListEditor {...defaultProps} />);
    stdin.write('\u001B[B'); // Down arrow (go to Item 2)
    stdin.write('\u001B[A'); // Up arrow (go back to Item 1)
    const frame = lastFrame();
    expect(frame).toContain('Item 1');
  });
});
