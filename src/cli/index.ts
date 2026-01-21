#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import updateNotifier from "update-notifier";
import { createRequire } from "module";
import {
  createAddCommand,
  createSearchCommand,
  createListCommand,
  createConfigCommand,
  createMigrateCommand,
} from "./commands/index.js";

// 업데이트 알림 체크 (비동기, 논블로킹)
const require = createRequire(import.meta.url);
const pkg = require("../../package.json");
updateNotifier({ pkg }).notify();

// TUI 모드: 인자 없이 실행 시 (mch)
if (process.argv.length === 2) {
  import("../tui/index.js").then(({ startTUI }) => startTUI());
} else {
  // CLI 모드: 인자가 있을 때 (mch add, mch search 등)
  const program = new Command();

  program
    .name("mch")
    .description("Meeting Context Hub - CLI tool for managing contexts with Obsidian")
    .version(pkg.version);

  program.addCommand(createAddCommand());
  program.addCommand(createSearchCommand());
  program.addCommand(createListCommand());
  program.addCommand(createConfigCommand());
  program.addCommand(createMigrateCommand());

  program.on("command:*", () => {
    console.error(chalk.red("Invalid command: " + program.args.join(" ")));
    console.log("Run 'mch --help' for usage information.");
    process.exit(1);
  });

  program.parse();
}
