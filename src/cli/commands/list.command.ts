import { Command } from "commander";
import chalk from "chalk";
import { createServices } from "../../core/factories.js";
import type { ContextType } from "../../types/context.types.js";
import { withSpinner, padEnd } from "../utils/index.js";

export function createListCommand(): Command {
  const cmd = new Command("list")
    .description("List all contexts")
    .option("--tag <tags>", "Filter by tags (comma-separated)")
    .option("--type <type>", "Filter by type (text, image, audio, file)")
    .option("--project <name>", "Filter by project name")
    .option("--sprint <name>", "Filter by sprint identifier")
    .option("-l, --limit <n>", "Limit results", "20")
    .option("-o, --offset <n>", "Offset for pagination", "0")
    .action(async (options) => {
      await withSpinner(async (spinner) => {
        spinner.start("Loading contexts...");
        const services = createServices();

        const listOptions: {
          tags?: string[];
          type?: ContextType;
          project?: string;
          sprint?: string;
          limit?: number;
          offset?: number;
        } = {
          limit: parseInt(options.limit, 10),
          offset: parseInt(options.offset, 10),
        };

        if (options.tag) {
          listOptions.tags = options.tag.split(",").map((t: string) => t.trim());
        }
        if (options.type) {
          listOptions.type = options.type as ContextType;
        }
        if (options.project) {
          listOptions.project = options.project;
        }
        if (options.sprint) {
          listOptions.sprint = options.sprint;
        }

        const contexts = await services.repository.findAll(listOptions);
        spinner.succeed("Found " + contexts.length + " context(s)");

        if (contexts.length === 0) {
          console.log(chalk.yellow("\nNo contexts found."));
          return;
        }

        console.log("");
        console.log(
          chalk.bold(
            padEnd("ID", 38) + padEnd("TYPE", 8) + padEnd("TAGS", 25) + "SUMMARY"
          )
        );
        console.log(chalk.gray("-".repeat(100)));

        for (const ctx of contexts) {
          const id = ctx.id.slice(0, 8) + "...";
          const type = ctx.type;
          const tags = ctx.tags.slice(0, 3).join(", ") || "-";
          const summary = ctx.summary.slice(0, 40) + (ctx.summary.length > 40 ? "..." : "");

          console.log(
            padEnd(id, 38) +
            padEnd(type, 8) +
            padEnd(tags, 25) +
            summary
          );
        }
      }, { failText: "Failed to list contexts" });
    });

  return cmd;
}
