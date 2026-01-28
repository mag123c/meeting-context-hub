import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/**
 * Service for path expansion and autocompletion
 */
export class PathCompletionService {
  /**
   * Expand ~ to home directory
   */
  expandPath(inputPath: string): string {
    if (!inputPath) return inputPath;
    if (inputPath.startsWith('~')) {
      return path.join(os.homedir(), inputPath.slice(1));
    }
    return inputPath;
  }

  /**
   * Get completion suggestions for a partial path
   */
  getCompletions(partial: string): string[] {
    if (!partial) return [];

    const expanded = this.expandPath(partial);
    const dir = path.dirname(expanded);
    const basename = path.basename(expanded);

    // Check if path ends with / (user wants to list directory contents)
    const isDirectoryListing = partial.endsWith('/') || partial.endsWith(path.sep);

    try {
      // For directory listing, use the expanded path as the directory
      const targetDir = isDirectoryListing ? expanded : dir;

      if (!fs.existsSync(targetDir)) {
        return [];
      }

      const entries = fs.readdirSync(targetDir, { withFileTypes: true });
      const prefix = isDirectoryListing ? '' : basename;

      return entries
        .filter((entry) => entry.name.startsWith(prefix))
        .map((entry) => {
          const fullPath = path.join(targetDir, entry.name);
          return entry.isDirectory() ? `${fullPath}/` : fullPath;
        })
        .sort();
    } catch {
      return [];
    }
  }

  /**
   * Find the longest common prefix among paths
   */
  findCommonPrefix(paths: string[]): string {
    if (paths.length === 0) return '';
    if (paths.length === 1) return paths[0];

    const sorted = [...paths].sort();
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    let i = 0;
    while (i < first.length && first[i] === last[i]) {
      i++;
    }

    return first.slice(0, i);
  }
}
