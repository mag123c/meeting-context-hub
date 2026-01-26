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
 */
export function checkForUpdates(): UpdateInfo | null {
  try {
    const notifier = updateNotifier({
      pkg,
      updateCheckInterval: 0, // Always check
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

/**
 * Auto-update to latest version
 * Returns true if update was successful and app should restart
 */
export function autoUpdate(): boolean {
  try {
    const notifier = updateNotifier({
      pkg,
      updateCheckInterval: 0, // Always check
    });

    if (notifier.update && notifier.update.latest !== VERSION) {
      console.log(`\n🔄 Updating MCH: ${VERSION} → ${notifier.update.latest}...\n`);

      execSync('npm install -g meeting-context-hub@latest', {
        stdio: 'inherit',
      });

      console.log('\n✅ Update complete! Restarting...\n');
      return true;
    }
  } catch (error) {
    console.error('❌ Auto-update failed:', error instanceof Error ? error.message : error);
  }

  return false;
}
