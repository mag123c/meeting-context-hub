import { spawnSync } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Open an external text editor for input
 * This is useful for Korean IME support, as terminal-based TUI
 * cannot properly handle IME composition events.
 *
 * @param initialContent - Initial content to populate the editor with
 * @returns The edited content, or null if editing was cancelled
 */
export function openExternalEditor(initialContent: string = ''): string | null {
  // Get editor from environment
  const editor = process.env.EDITOR || process.env.VISUAL || getDefaultEditor();

  // Create temporary file
  const tmpFile = join(tmpdir(), `mch-edit-${Date.now()}.txt`);

  try {
    // Write initial content to temp file
    writeFileSync(tmpFile, initialContent, 'utf-8');

    // Open editor synchronously
    const result = spawnSync(editor, [tmpFile], {
      stdio: 'inherit',
      shell: true,
    });

    // Check if editor exited successfully
    if (result.status !== 0) {
      return null;
    }

    // Read edited content
    const content = readFileSync(tmpFile, 'utf-8');
    return content;
  } catch {
    return null;
  } finally {
    // Clean up temp file
    try {
      if (existsSync(tmpFile)) {
        unlinkSync(tmpFile);
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Get the default editor based on platform
 */
function getDefaultEditor(): string {
  // On macOS, use nano as it's available by default
  // On other platforms, try common editors
  if (process.platform === 'darwin') {
    return 'nano';
  }

  // Try to find a common editor
  const editors = ['nano', 'vim', 'vi'];
  for (const ed of editors) {
    try {
      const result = spawnSync('which', [ed], { encoding: 'utf-8' });
      if (result.status === 0 && result.stdout.trim()) {
        return ed;
      }
    } catch {
      continue;
    }
  }

  // Fallback to nano
  return 'nano';
}

/**
 * Check if an external editor is available
 */
export function isEditorAvailable(): boolean {
  const editor = process.env.EDITOR || process.env.VISUAL || getDefaultEditor();

  try {
    // Try to find the editor
    const result = spawnSync('which', [editor.split(' ')[0]], { encoding: 'utf-8' });
    return result.status === 0 && !!result.stdout.trim();
  } catch {
    return false;
  }
}

/**
 * Get the name of the configured editor
 */
export function getEditorName(): string {
  const editor = process.env.EDITOR || process.env.VISUAL || getDefaultEditor();
  // Return just the command name, not any arguments
  return editor.split(' ')[0].split('/').pop() || 'editor';
}
