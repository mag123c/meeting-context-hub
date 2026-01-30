import { useCallback } from 'react';
import { openExternalEditor, isEditorAvailable, getEditorName } from '../utils/external-editor.js';

interface UseExternalEditorOptions {
  getValue: () => string;
  onResult: (content: string) => void;
  onError?: (error: Error) => void;
}

interface UseExternalEditorReturn {
  handleOpenEditor: () => void;
  editorAvailable: boolean;
  editorName: string;
}

export function useExternalEditor({
  getValue,
  onResult,
  onError,
}: UseExternalEditorOptions): UseExternalEditorReturn {
  const editorAvailable = isEditorAvailable();
  const editorName = editorAvailable ? getEditorName() : '';

  const handleOpenEditor = useCallback(() => {
    if (!editorAvailable) {
      onError?.(new Error('No editor available'));
      return;
    }

    const content = openExternalEditor(getValue());
    if (content !== null) {
      onResult(content);
    }
  }, [editorAvailable, getValue, onResult, onError]);

  return { handleOpenEditor, editorAvailable, editorName };
}
