import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { createServices } from "../../core/factories.js";
import type { ContextWithSimilarity } from "../../types/context.types.js";

export function createSearchCommand(): Command {
  const cmd = new Command("search")
    .description("Search contexts")
    .argument("[keyword]", "Search keyword")
    .option("--similar <id>", "Find similar contexts by ID")
    .option("--tag <tags>", "Filter by tags (comma-separated)")
    .option("-l, --limit <n>", "Limit results", "10")
    .action(async (keyword, options) => {
      const spinner = ora();
      try {
        const services = createServices();
        const limit = parseInt(options.limit, 10);

        let result;

        if (options.similar) {
          spinner.start("Finding similar contexts...");
          result = await services.searchContextUseCase.searchSimilar(options.similar, limit);
        } else if (options.tag) {
          const tags = options.tag.split(",").map((t: string) => t.trim());
          result = await services.searchContextUseCase.searchByTags(tags);
        } else if (keyword) {
          result = await services.searchContextUseCase.searchByKeyword(keyword, { limit });
        } else {
          spinner.start("Fetching all contexts...");
          const all = await services.repository.findAll({ limit });
          result = { contexts: all, total: all.length };
        }

        spinner.succeed("Found " + result.total + " context(s)");

        if (result.contexts.length === 0) {
          console.log(chalk.yellow("\nNo contexts found."));
          return;
        }

        console.log("");
        for (const ctx of result.contexts) {
          const similarity = (ctx as ContextWithSimilarity).similarity;
          console.log(chalk.cyan("-".repeat(50)));
          console.log(chalk.bold("ID:"), ctx.id);
          console.log(chalk.gray("Type:"), ctx.type);
          console.log(chalk.gray("Summary:"), ctx.summary);
          console.log(chalk.gray("Tags:"), ctx.tags.join(", ") || "(none)");
          console.log(chalk.gray("Created:"), ctx.createdAt.toLocaleString());
          if (similarity !== undefined) {
            console.log(chalk.green("Similarity:"), (similarity * 100).toFixed(1) + "%");
          }
        }
        console.log(chalk.cyan("-".repeat(50)));
      } catch (error) {
        spinner.fail("Search failed");
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  return cmd;
}
