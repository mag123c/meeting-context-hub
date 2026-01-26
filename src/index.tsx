#!/usr/bin/env node
/**
 * Meeting Context Hub v2
 *
 * Entry point for the TUI application.
 */

import { render } from 'ink';
import { App, cleanup } from './tui/index.js';

// Handle process exit
function handleExit(): void {
  cleanup();
  process.exit(0);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  cleanup();
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  cleanup();
  process.exit(1);
});

// Render the app
const { waitUntilExit } = render(<App onExit={handleExit} />);

waitUntilExit().then(() => {
  cleanup();
  process.exit(0);
});
