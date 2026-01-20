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
    .option("--project <name>", "Filter by project name")
    .option("--sprint <name>", "Filter by sprint identifier")
    .option("--exact", "Use exact text matching instead of semantic search")
    .option("-l, --limit <n>", "Limit results", "10")
    .action(async (keyword, options) => {
      // stdout으로 설정해서 console.log와 순서 보장
      const spinner = ora({ stream: process.stdout });
      try {
        const services = createServices();
        const limit = parseInt(options.limit, 10);

        // project/sprint 필터 옵션 구성
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
          // 입력 검증: 빈 문자열 및 길이 제한
          const sanitizedKeyword = keyword.trim().slice(0, 500);
          if (!sanitizedKeyword) {
            spinner.fail("Empty keyword");
            return;
          }

          if (options.exact) {
            // 텍스트 매칭 검색
            spinner.start("Searching with exact match...");
            result = await services.searchContextUseCase.searchByKeyword(sanitizedKeyword, filterOptions);
          } else {
            // 임베딩 유사도 검색 (기본)
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
          const similarity = (ctx as ContextWithSimilarity).similarity;
          console.log(chalk.cyan("-".repeat(50)));
          console.log(chalk.bold("ID:"), ctx.id);
          console.log(chalk.gray("Type:"), ctx.type);
          console.log(chalk.gray("Summary:"), ctx.summary);
          console.log(chalk.gray("Tags:"), ctx.tags.join(", ") || "(none)");
          if (ctx.project) console.log(chalk.gray("Project:"), ctx.project);
          if (ctx.sprint) console.log(chalk.gray("Sprint:"), ctx.sprint);
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
