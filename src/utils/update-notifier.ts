import updateNotifier from 'update-notifier';
import { execSync } from 'child_process';
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
      updateCheckInterval: 0, // Always trigger background check
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

interface UpdateResult {
  success: boolean;
  error?: string;
}

/**
 * Perform update with automatic retry on ENOTEMPTY error
 * 1. Try npm install -g directly
 * 2. If failed, uninstall then reinstall
 * 3. Return result with error message if both attempts fail
 */
export function performUpdate(): UpdateResult {
  const pkg = 'meeting-context-hub';

  try {
    // First attempt: direct install
    execSync(`npm install -g ${pkg}@latest`, { stdio: 'pipe' });
    return { success: true };
  } catch {
    // Second attempt: uninstall then reinstall
    try {
      execSync(`npm uninstall -g ${pkg}`, { stdio: 'pipe' });
      execSync(`npm install -g ${pkg}@latest`, { stdio: 'pipe' });
      return { success: true };
    } catch (secondError) {
      return {
        success: false,
        error: secondError instanceof Error ? secondError.message : 'Update failed',
      };
    }
  }
}
