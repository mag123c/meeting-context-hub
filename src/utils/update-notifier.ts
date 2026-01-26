import updateNotifier from 'update-notifier';
import { VERSION, PACKAGE_NAME } from '../version.js';

// Construct pkg object for update-notifier
const pkg = {
  name: PACKAGE_NAME,
  version: VERSION,
};

interface UpdateInfo {
  current: string;
  latest: string;
  type: 'major' | 'minor' | 'patch' | 'prerelease' | 'build' | 'latest';
}

/**
 * Check for updates and return update info if available
 * Shows banner in App.tsx if update is available
 */
export function checkForUpdates(): UpdateInfo | null {
  try {
    const notifier = updateNotifier({
      pkg,
      updateCheckInterval: 1000 * 60 * 60, // Check once per hour
    });

    if (notifier.update && notifier.update.latest !== VERSION) {
      return {
        current: VERSION,
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
