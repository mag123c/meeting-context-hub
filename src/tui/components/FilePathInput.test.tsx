import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'ink-testing-library';
import { FilePathInput } from './FilePathInput.js';

// Mock the services
vi.mock('../../core/services/path-completion.service.js', () => ({
  PathCompletionService: vi.fn().mockImplementation(() => ({
    expandPath: vi.fn((p: string) => p.replace('~', '/Users/test')),
    getCompletions: vi.fn().mockReturnValue([]),
    findCommonPrefix: vi.fn().mockReturnValue(''),
  })),
}));

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('FilePathInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render with placeholder when empty', () => {
    const { lastFrame } = render(
      <FilePathInput {...defaultProps} placeholder="Enter path..." />
    );
    expect(lastFrame()).toContain('Enter path...');
  });

  it('should render value with prompt', () => {
    const { lastFrame } = render(
      <FilePathInput {...defaultProps} value="/Users/test/file.mp3" />
    );
    expect(lastFrame()).toContain('/Users/test/file.mp3');
  });

  it('should display completions when available', () => {
    const { lastFrame } = render(
      <FilePathInput
        {...defaultProps}
        value="/Users/test/meet"
        completions={['/Users/test/meeting.mp3', '/Users/test/meeting2.wav']}
      />
    );
    expect(lastFrame()).toContain('meeting.mp3');
    expect(lastFrame()).toContain('meeting2.wav');
  });

  it('should call onChange when input changes', () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <FilePathInput {...defaultProps} onChange={onChange} focus={true} />
    );

    stdin.write('a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('should call onSubmit on Ctrl+D', () => {
    const onSubmit = vi.fn();
    const { stdin } = render(
      <FilePathInput {...defaultProps} onSubmit={onSubmit} focus={true} />
    );

    stdin.write('\x04'); // Ctrl+D
    expect(onSubmit).toHaveBeenCalled();
  });

  it('should call onCancel on Escape', () => {
    const onCancel = vi.fn();
    const { stdin } = render(
      <FilePathInput {...defaultProps} onCancel={onCancel} focus={true} />
    );

    stdin.write('\x1B'); // ESC
    expect(onCancel).toHaveBeenCalled();
  });

  it('should not show completions when no completions prop', () => {
    const { lastFrame } = render(
      <FilePathInput {...defaultProps} value="/Users/test/file" />
    );
    expect(lastFrame()).not.toContain('Completions:');
  });

  it('should highlight first completion by default', () => {
    const { lastFrame } = render(
      <FilePathInput
        {...defaultProps}
        value="/Users/test/"
        completions={['/Users/test/a.mp3', '/Users/test/b.mp3']}
        focus={true}
      />
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('▸ /Users/test/a.mp3');
  });

  it('should move selection down on ↓ key', async () => {
    const { stdin, lastFrame } = render(
      <FilePathInput
        {...defaultProps}
        value="/Users/test/"
        completions={['/Users/test/a.mp3', '/Users/test/b.mp3', '/Users/test/c.mp3']}
        focus={true}
      />
    );

    stdin.write('\x1B[B');
    await delay(50);

    const frame = lastFrame() ?? '';
    expect(frame).toContain('▸ /Users/test/b.mp3');
  });

  it('should move selection up on ↑ key', async () => {
    const { stdin, lastFrame } = render(
      <FilePathInput
        {...defaultProps}
        value="/Users/test/"
        completions={['/Users/test/a.mp3', '/Users/test/b.mp3', '/Users/test/c.mp3']}
        focus={true}
      />
    );

    stdin.write('\x1B[B');
    await delay(50);
    stdin.write('\x1B[B');
    await delay(50);
    stdin.write('\x1B[A');
    await delay(50);

    const frame = lastFrame() ?? '';
    expect(frame).toContain('▸ /Users/test/b.mp3');
  });

  it('should call onSelectCompletion with selected item on Tab when completions exist', async () => {
    const onSelectCompletion = vi.fn();
    const { stdin } = render(
      <FilePathInput
        {...defaultProps}
        value="/Users/test/"
        completions={['/Users/test/a.mp3', '/Users/test/b.mp3']}
        onSelectCompletion={onSelectCompletion}
        focus={true}
      />
    );

    stdin.write('\x1B[B');
    await delay(50);
    stdin.write('\t');
    await delay(50);

    expect(onSelectCompletion).toHaveBeenCalledWith('/Users/test/b.mp3');
  });

  it('should call onTabComplete on Tab when no completions', () => {
    const onTabComplete = vi.fn();
    const { stdin } = render(
      <FilePathInput
        {...defaultProps}
        value=""
        completions={[]}
        onTabComplete={onTabComplete}
        focus={true}
      />
    );

    stdin.write('\t');
    expect(onTabComplete).toHaveBeenCalled();
  });

  it('should not move selection below last item', async () => {
    const { stdin, lastFrame } = render(
      <FilePathInput
        {...defaultProps}
        value="/Users/test/"
        completions={['/Users/test/a.mp3', '/Users/test/b.mp3']}
        focus={true}
      />
    );

    for (let i = 0; i < 5; i++) {
      stdin.write('\x1B[B');
      await delay(50);
    }

    const frame = lastFrame() ?? '';
    expect(frame).toContain('▸ /Users/test/b.mp3');
  });

  it('should not move selection above first item', async () => {
    const { stdin, lastFrame } = render(
      <FilePathInput
        {...defaultProps}
        value="/Users/test/"
        completions={['/Users/test/a.mp3', '/Users/test/b.mp3']}
        focus={true}
      />
    );

    stdin.write('\x1B[A');
    await delay(50);
    stdin.write('\x1B[A');
    await delay(50);

    const frame = lastFrame() ?? '';
    expect(frame).toContain('▸ /Users/test/a.mp3');
  });
});
