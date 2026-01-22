import { useCallback } from "react";
import { readdir, stat } from "fs/promises";
import { resolve, dirname, basename, join } from "path";
import { homedir } from "os";

export interface UseFileCompletionOptions {
  basePath?: string;
  extensions?: string[];
  showHidden?: boolean;
}

export interface UseFileCompletionResult {
  getSuggestions: (input: string) => Promise<string[]>;
}

export function useFileCompletion(options: UseFileCompletionOptions = {}): UseFileCompletionResult {
  const { basePath = process.cwd(), extensions, showHidden = false } = options;

  const getSuggestions = useCallback(
    async (input: string): Promise<string[]> => {
      try {
        // Normalize input
        let normalizedInput = input.trim();

        // Remove @ prefix if present
        if (normalizedInput.startsWith("@")) {
          normalizedInput = normalizedInput.slice(1);
        }

        // Expand ~ to home directory
        if (normalizedInput.startsWith("~")) {
          normalizedInput = normalizedInput.replace(/^~/, homedir());
        }

        // Determine if input is absolute or relative
        const isAbsolute = normalizedInput.startsWith("/");
        const fullPath = isAbsolute ? normalizedInput : resolve(basePath, normalizedInput);

        // Parse directory and partial filename
        let searchDir: string;
        let partialName: string;

        // Check if the path ends with / or if it's an existing directory
        const endsWithSlash = normalizedInput.endsWith("/");
        let isDirectory = false;

        try {
          const stats = await stat(fullPath);
          isDirectory = stats.isDirectory();
        } catch {
          isDirectory = false;
        }

        if (endsWithSlash || isDirectory) {
          // Path points to a directory, list its contents
          searchDir = fullPath;
          partialName = "";
        } else {
          // Path has a partial filename
          searchDir = dirname(fullPath);
          partialName = basename(fullPath).toLowerCase();
        }

        // Read directory contents
        let entries: string[];
        try {
          entries = await readdir(searchDir);
        } catch {
          // Directory doesn't exist or not accessible
          return [];
        }

        // Filter entries
        const filtered = entries.filter((entry) => {
          // Filter hidden files
          if (!showHidden && entry.startsWith(".")) {
            return false;
          }

          // Filter by partial name match
          if (partialName && !entry.toLowerCase().startsWith(partialName)) {
            return false;
          }

          return true;
        });

        // Build full paths and check if directories
        const suggestions = await Promise.all(
          filtered.map(async (entry) => {
            const entryPath = join(searchDir, entry);
            let displayPath: string;

            // Keep the original format (relative or absolute)
            if (isAbsolute) {
              displayPath = entryPath;
            } else {
              // Make relative to basePath
              const relativePath = entryPath.startsWith(basePath)
                ? entryPath.slice(basePath.length).replace(/^\//, "")
                : entryPath;
              displayPath = relativePath;
            }

            // Add trailing slash for directories
            try {
              const stats = await stat(entryPath);
              if (stats.isDirectory()) {
                displayPath += "/";
              }
            } catch {
              // Ignore stat errors
            }

            // Filter by extension if specified
            if (extensions && extensions.length > 0) {
              const isDir = displayPath.endsWith("/");
              if (!isDir) {
                const ext = displayPath.split(".").pop()?.toLowerCase();
                if (!ext || !extensions.includes(ext)) {
                  return null;
                }
              }
            }

            return displayPath;
          })
        );

        // Filter out nulls and sort (directories first)
        return suggestions
          .filter((s): s is string => s !== null)
          .sort((a, b) => {
            const aIsDir = a.endsWith("/");
            const bIsDir = b.endsWith("/");
            if (aIsDir && !bIsDir) return -1;
            if (!aIsDir && bIsDir) return 1;
            return a.localeCompare(b);
          });
      } catch {
        return [];
      }
    },
    [basePath, extensions, showHidden]
  );

  return { getSuggestions };
}
