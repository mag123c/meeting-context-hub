import updateNotifier from 'update-notifier';
import { createRequire } from 'module';
import { execSync } from 'child_process';

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
      updateCheckInterval: 0, // Always check
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

/**
 * Auto-update to latest version
 * Returns true if update was successful and app should restart
 */
export function autoUpdate(): boolean {
  try {
    const pkg = require('../../package.json');

    const notifier = updateNotifier({
      pkg,
      updateCheckInterval: 0, // Always check
    });

    if (notifier.update && notifier.update.latest !== pkg.version) {
      console.log(`\n🔄 Updating MCH: ${pkg.version} → ${notifier.update.latest}...\n`);

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
