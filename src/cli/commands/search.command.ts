import { Command } from "commander";
import chalk from "chalk";
import { createServices } from "../../core/factories.js";
import { withSpinner, formatSearchResult } from "../utils/index.js";

export function createSearchCommand(): Command {
  const cmd = new Command("search")
    .description("Search contexts")
    .argument("[keyword]", "Search keyword")
    .option("--similar <id>", "Find similar contexts by ID")
    .option("--tag <tags>", "Filter by tags (comma-separated)")
    .option("--project <name>", "Filter by project name")
    .option("--sprint <name>", "Filter by sprint identifier")
    .option("--exact", "Use exact text matching instead of semantic search")
    .option("-l, --limit <n>", "Limit results", "10")
    .action(async (keyword, options) => {
      await withSpinner(async (spinner) => {
        const services = createServices();
        const limit = parseInt(options.limit, 10);

        const filterOptions: { project?: string; sprint?: string; limit?: number } = { limit };
        if (options.project) filterOptions.project = options.project;
        if (options.sprint) filterOptions.sprint = options.sprint;

        let result;

        if (options.similar) {
          spinner.start("Finding similar contexts...");
          result = await services.searchContextUseCase.searchSimilar(options.similar, limit, filterOptions);
        } else if (options.tag) {
          spinner.start("Searching by tags...");
          const tags = options.tag.split(",").map((t: string) => t.trim());
          result = await services.searchContextUseCase.searchByTags(tags, filterOptions);
        } else if (keyword) {
          const sanitizedKeyword = keyword.trim().slice(0, 500);
          if (!sanitizedKeyword) {
            spinner.fail("Empty keyword");
            return;
          }

          if (options.exact) {
            spinner.start("Searching with exact match...");
            result = await services.searchContextUseCase.searchByKeyword(sanitizedKeyword, filterOptions);
          } else {
            spinner.start("Searching with semantic similarity...");
            result = await services.searchContextUseCase.searchByText(sanitizedKeyword, limit, filterOptions);
          }
        } else {
          spinner.start("Fetching all contexts...");
          const all = await services.repository.findAll(filterOptions);
          result = { contexts: all, total: all.length };
        }

        spinner.succeed("Found " + result.total + " context(s)");

        if (result.contexts.length === 0) {
          console.log(chalk.yellow("\nNo contexts found."));
          return;
        }

        console.log("");
        for (const ctx of result.contexts) {
          formatSearchResult(ctx);
        }
        console.log(chalk.cyan("-".repeat(50)));
      }, { failText: "Search failed" });
    });

  return cmd;
}
