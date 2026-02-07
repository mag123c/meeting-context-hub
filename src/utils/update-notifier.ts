import updateNotifier from 'update-notifier';
import { execSync } from 'child_process';
import { homedir } from 'os';
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
 * Get cached update info synchronously (no background check)
 * Returns cached result from previous session if available
 */
export function getCachedUpdateInfo(): UpdateInfo | null {
  try {
    const notifier = updateNotifier({
      pkg,
      updateCheckInterval: 1000 * 60 * 60 * 24, // 24 hours (don't trigger check)
    });

    if (notifier.update && notifier.update.latest !== VERSION) {
      return {
        current: VERSION,
        latest: notifier.update.latest,
        type: notifier.update.type as UpdateInfo['type'],
      };
    }
  } catch {
    // Silently fail
  }
  return null;
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

type ProgressCallback = (step: string) => void;

const EXEC_OPTS = { stdio: 'pipe' as const, cwd: homedir() };

/**
 * Perform update with automatic retry on ENOTEMPTY error
 * 1. Try npm install -g directly
 * 2. If failed, clean cache + uninstall + remove directory + reinstall
 * 3. Return result with error message if both attempts fail
 *
 * All execSync calls use homedir() as CWD to avoid ENOENT: uv_cwd crash
 * when npm replaces itself during global install.
 */
export function performUpdate(onProgress?: ProgressCallback): UpdateResult {
  const pkg = 'meeting-context-hub';

  try {
    onProgress?.('Installing...');
    execSync(`npm install -g ${pkg}@latest`, EXEC_OPTS);
    return { success: true };
  } catch {
    try {
      const prefix = execSync('npm prefix -g', EXEC_OPTS).toString().trim();
      const pkgDir = `${prefix}/lib/node_modules/${pkg}`;

      onProgress?.('Cleaning cache...');
      try {
        execSync('npm cache clean --force', EXEC_OPTS);
      } catch {
        // Ignore cache clean errors
      }

      onProgress?.('Uninstalling...');
      try {
        execSync(`npm uninstall -g ${pkg}`, EXEC_OPTS);
      } catch {
        // Ignore uninstall errors
      }

      onProgress?.('Removing files...');
      try {
        execSync(`rm -rf "${pkgDir}"`, EXEC_OPTS);
      } catch {
        // Ignore rm errors
      }

      onProgress?.('Reinstalling...');
      execSync(`npm install -g ${pkg}@latest`, EXEC_OPTS);
      return { success: true };
    } catch {
      return {
        success: false,
        error: `npm install -g ${pkg}@latest`,
      };
    }
  }
}
