import { useState, useCallback, useEffect, useRef } from "react";
import { Box, Text, useInput } from "ink";
import clipboardy from "clipboardy";

export interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  getSuggestions: (input: string) => Promise<string[]> | string[];
  placeholder?: string;
  prefix?: string;
  maxSuggestions?: number;
}

export function AutocompleteInput({
  value,
  onChange,
  onSubmit,
  getSuggestions,
  placeholder = "",
  prefix = "@",
  maxSuggestions = 5,
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(value.length);
  const [isLoading, setIsLoading] = useState(false);

  // Track last fetched value to avoid duplicate fetches
  const lastFetchedValue = useRef<string>("");

  // Check if autocomplete should be active
  // Support: @, /, ~, ./, ../
  const isAutocompleteActive =
    value.startsWith(prefix) ||
    value.startsWith("/") ||
    value.startsWith("~") ||
    value.startsWith("./") ||
    value.startsWith("../");

  // Fetch suggestions for a given path
  const fetchSuggestions = useCallback(async (path: string) => {
    if (lastFetchedValue.current === path) return;
    lastFetchedValue.current = path;

    setIsLoading(true);
    try {
      const results = await getSuggestions(path);
      setSuggestions(results.slice(0, maxSuggestions));
      setSelectedIndex(0);
      setShowSuggestions(results.length > 0);
    } finally {
      setIsLoading(false);
    }
  }, [getSuggestions, maxSuggestions]);

  // Update suggestions when value changes
  useEffect(() => {
    if (isAutocompleteActive && value.length > 0) {
      void fetchSuggestions(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      lastFetchedValue.current = "";
    }
  }, [value, fetchSuggestions, isAutocompleteActive]);

  // Handle paste from clipboard (Ctrl+V detection via rapid input)
  const handlePaste = useCallback(async () => {
    try {
      const clipboardContent = await clipboardy.read();
      if (clipboardContent) {
        const normalizedPath = normalizePath(clipboardContent.trim());
        onChange(normalizedPath);
        setCursorPosition(normalizedPath.length);
      }
    } catch {
      // Clipboard access failed, ignore
    }
  }, [onChange]);

  useInput((input, key) => {
    // Handle Ctrl+V for paste
    if (input === "\x16" || (key.ctrl && input === "v")) {
      void handlePaste();
      return;
    }

    // Handle Tab - select current suggestion
    if (key.tab && showSuggestions && suggestions.length > 0) {
      const selected = suggestions[selectedIndex];
      onChange(selected);
      setCursorPosition(selected.length);

      // For directories, immediately fetch new suggestions
      if (selected.endsWith("/")) {
        lastFetchedValue.current = ""; // Reset to force fetch
        void fetchSuggestions(selected);
      } else {
        setShowSuggestions(false);
      }
      return;
    }

    // Handle Tab without suggestions - try to trigger autocomplete
    if (key.tab && !showSuggestions && value.length > 0) {
      lastFetchedValue.current = ""; // Reset to force fetch
      void fetchSuggestions(value);
      return;
    }

    // Handle arrow keys for navigation
    if (key.upArrow && showSuggestions) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      return;
    }

    if (key.downArrow && showSuggestions) {
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      return;
    }

    // Handle Escape - close suggestions
    if (key.escape && showSuggestions) {
      setShowSuggestions(false);
      return;
    }

    // Handle Enter - submit file, navigate into directory
    if (key.return) {
      // If showing suggestions, use selected item
      if (showSuggestions && suggestions.length > 0) {
        const selected = suggestions[selectedIndex];
        if (selected.endsWith("/")) {
          // Directory: navigate into it
          onChange(selected);
          setCursorPosition(selected.length);
          lastFetchedValue.current = ""; // Reset to force fetch
          void fetchSuggestions(selected);
          return;
        } else {
          // File: submit it
          setShowSuggestions(false);
          onSubmit(selected);
          return;
        }
      }

      // If value is a directory path, fetch its contents
      if (value.endsWith("/")) {
        lastFetchedValue.current = ""; // Reset to force fetch
        void fetchSuggestions(value);
        return;
      }

      // Submit the current value
      setShowSuggestions(false);
      onSubmit(value);
      return;
    }

    // Handle Backspace
    if (key.backspace || key.delete) {
      if (cursorPosition > 0) {
        const newValue = value.slice(0, cursorPosition - 1) + value.slice(cursorPosition);
        onChange(newValue);
        setCursorPosition(cursorPosition - 1);
      }
      return;
    }

    // Handle left/right arrows (when not navigating suggestions)
    if (key.leftArrow && !showSuggestions) {
      setCursorPosition((prev) => Math.max(0, prev - 1));
      return;
    }

    if (key.rightArrow && !showSuggestions) {
      setCursorPosition((prev) => Math.min(value.length, prev + 1));
      return;
    }

    // Handle regular character input (no normalization - preserve @ prefix)
    if (input && !key.ctrl && !key.meta) {
      const newValue = value.slice(0, cursorPosition) + input + value.slice(cursorPosition);
      onChange(newValue);
      setCursorPosition(cursorPosition + input.length);
    }
  });

  // Keep cursor position in sync when value changes externally
  useEffect(() => {
    if (cursorPosition > value.length) {
      setCursorPosition(value.length);
    }
  }, [value, cursorPosition]);

  const displayValue = value || placeholder;
  const isPlaceholder = !value && !!placeholder;

  return (
    <Box flexDirection="column">
      {/* Input line */}
      <Box>
        <Text color="cyan">{"> "}</Text>
        <Text dimColor={isPlaceholder}>
          {displayValue.slice(0, cursorPosition)}
        </Text>
        <Text inverse>{value[cursorPosition] || " "}</Text>
        <Text dimColor={isPlaceholder}>
          {displayValue.slice(cursorPosition + 1)}
        </Text>
      </Box>

      {/* Loading indicator */}
      {isLoading && (
        <Box marginLeft={2}>
          <Text dimColor>Loading...</Text>
        </Box>
      )}

      {/* Suggestions dropdown */}
      {!isLoading && showSuggestions && suggestions.length > 0 && (
        <Box flexDirection="column" marginTop={0} marginLeft={2}>
          <Box>
            <Text dimColor>{"┌" + "─".repeat(Math.max(...suggestions.map(s => s.length), 20) + 2) + "┐"}</Text>
          </Box>
          {suggestions.map((suggestion, index) => {
            const isDir = suggestion.endsWith("/");
            return (
              <Box key={suggestion}>
                <Text dimColor>│ </Text>
                <Text
                  backgroundColor={index === selectedIndex ? "blue" : undefined}
                  color={index === selectedIndex ? "white" : isDir ? "cyan" : undefined}
                >
                  {suggestion.padEnd(Math.max(...suggestions.map(s => s.length), 20))}
                </Text>
                <Text dimColor> │</Text>
              </Box>
            );
          })}
          <Box>
            <Text dimColor>{"└" + "─".repeat(Math.max(...suggestions.map(s => s.length), 20) + 2) + "┘"}</Text>
          </Box>
          <Box gap={2} marginTop={0}>
            <Text dimColor>
              <Text color="yellow">[Tab/Enter]</Text> Select{" "}
              <Text color="yellow">[↑↓]</Text> Navigate{" "}
              <Text color="yellow">[Esc]</Text> Cancel
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}

/**
 * Normalize a path string
 * - Remove surrounding quotes
 * - Handle escaped spaces
 * - Expand ~ to home directory
 */
function normalizePath(path: string): string {
  let normalized = path.trim();

  // Remove surrounding quotes (single or double)
  if ((normalized.startsWith('"') && normalized.endsWith('"')) ||
      (normalized.startsWith("'") && normalized.endsWith("'"))) {
    normalized = normalized.slice(1, -1);
  }

  // Remove @ prefix if present (for autocomplete trigger)
  if (normalized.startsWith("@")) {
    normalized = normalized.slice(1);
  }

  // Handle escaped spaces (common in drag and drop)
  normalized = normalized.replace(/\\ /g, " ");

  return normalized;
}
