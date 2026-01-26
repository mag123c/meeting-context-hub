import updateNotifier from 'update-notifier';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

interface UpdateInfo {
  current: string;
  latest: string;
  type: 'major' | 'minor' | 'patch' | 'prerelease' | 'build' | 'latest';
}

/**
 * Check for updates and return update info if available
 */
export function checkForUpdates(): UpdateInfo | null {
  try {
    // Load package.json dynamically for ESM compatibility
    const pkg = require('../../package.json');

    const notifier = updateNotifier({
      pkg,
      updateCheckInterval: 1000 * 60 * 60 * 24, // Check once per day
    });

    if (notifier.update && notifier.update.latest !== pkg.version) {
      return {
        current: pkg.version as string,
        latest: notifier.update.latest,
        type: notifier.update.type as UpdateInfo['type'],
      };
    }
  } catch {
    // Silently fail - update check is not critical
  }

  return null;
}

/**
 * Get the update command for the user
 */
export function getUpdateCommand(): string {
  return 'npm install -g meeting-context-hub@latest';
}
