#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import {
  createAddCommand,
  createSearchCommand,
  createListCommand,
  createConfigCommand,
} from "./commands/index.js";

// TUI 모드: 인자 없이 실행 시 (mch)
if (process.argv.length === 2) {
  import("../tui/index.js").then(({ startTUI }) => startTUI());
} else {
  // CLI 모드: 인자가 있을 때 (mch add, mch search 등)
  const program = new Command();

  program
    .name("mch")
    .description("Meeting Context Hub - CLI tool for managing contexts with Obsidian")
    .version("1.0.0");

  program.addCommand(createAddCommand());
  program.addCommand(createSearchCommand());
  program.addCommand(createListCommand());
  program.addCommand(createConfigCommand());

  program.on("command:*", () => {
    console.error(chalk.red("Invalid command: " + program.args.join(" ")));
    console.log("Run 'mch --help' for usage information.");
    process.exit(1);
  });

  program.parse();
}
