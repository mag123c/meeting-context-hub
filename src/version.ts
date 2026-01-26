// Auto-synced with package.json version
// This file exists to avoid path issues with package.json in dist/
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const require = createRequire(import.meta.url);

function getPackageJson(): { version: string; name: string } {
  // Try multiple paths to find package.json
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const possiblePaths = [
    join(__dirname, '..', 'package.json'),      // From src/
    join(__dirname, '..', '..', 'package.json'), // From dist/
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return require(path);
    }
  }

  // Fallback
  return { version: 'unknown', name: 'meeting-context-hub' };
}

const pkg = getPackageJson();

export const VERSION = pkg.version;
export const PACKAGE_NAME = pkg.name;
