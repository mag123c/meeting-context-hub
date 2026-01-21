import { Command } from "commander";
import chalk from "chalk";
import { loadConfig, getObsidianPath } from "../../config/index.js";
import { ClaudeClient } from "../../ai/index.js";
import { MigrateHierarchyUseCase } from "../../core/migrate-hierarchy.usecase.js";
import { withSpinner } from "../utils/index.js";

export function createMigrateCommand(): Command {
  const cmd = new Command("migrate")
    .description("Migrate legacy contexts to hierarchy structure")
    .option("--dry-run", "Preview changes without modifying files")
    .option("--to-uncategorized", "Move all legacy files to Uncategorized/General (no AI classification)")
    .option("--preview", "Show count of files to be migrated")
    .action(async (options) => {
      await withSpinner(async (spinner) => {
        const config = loadConfig();
        const obsidianPath = getObsidianPath(config);
        const claude = new ClaudeClient(config.anthropicApiKey);
        const migrateUseCase = new MigrateHierarchyUseCase(obsidianPath, claude);

        // Preview mode
        if (options.preview) {
          spinner.start("Scanning for legacy files...");
          const preview = await migrateUseCase.getPreview();
          spinner.succeed(`Found ${preview.count} file(s) to migrate`);

          if (preview.count > 0 && preview.files.length <= 20) {
            console.log(chalk.gray("\nFiles:"));
            for (const file of preview.files) {
              console.log(chalk.gray(`  - ${file}`));
            }
          } else if (preview.files.length > 20) {
            console.log(chalk.gray(`\nShowing first 20 of ${preview.files.length} files:`));
            for (const file of preview.files.slice(0, 20)) {
              console.log(chalk.gray(`  - ${file}`));
            }
            console.log(chalk.gray(`  ... and ${preview.files.length - 20} more`));
          }

          if (preview.count > 0) {
            console.log(chalk.yellow("\nRun 'mch migrate --dry-run' to preview changes"));
            console.log(chalk.yellow("Run 'mch migrate --to-uncategorized' to migrate to Uncategorized/General"));
            console.log(chalk.yellow("Run 'mch migrate' to migrate with AI classification"));
          }
          return;
        }

        // Dry run mode
        const isDryRun = Boolean(options.dryRun);
        const toUncategorized = Boolean(options.toUncategorized);

        if (isDryRun) {
          spinner.start("Previewing migration (dry run)...");
        } else if (toUncategorized) {
          spinner.start("Migrating to Uncategorized/General...");
        } else {
          spinner.start("Migrating with AI classification (this may take a while)...");
        }

        const result = await migrateUseCase.execute({
          dryRun: isDryRun,
          toUncategorized,
        });

        if (result.total === 0) {
          spinner.succeed("No legacy files found to migrate");
          return;
        }

        const modeLabel = isDryRun ? " (dry run)" : "";
        spinner.succeed(`Migration complete${modeLabel}`);

        console.log("");
        console.log(chalk.bold("Results:"));
        console.log(`  Total files: ${result.total}`);
        console.log(chalk.green(`  Migrated: ${result.migrated}`));
        console.log(chalk.yellow(`  Skipped: ${result.skipped}`));

        if (result.errors.length > 0) {
          console.log(chalk.red(`  Errors: ${result.errors.length}`));
          console.log("");
          console.log(chalk.red("Errors:"));
          for (const error of result.errors.slice(0, 10)) {
            console.log(chalk.red(`  - ${error}`));
          }
          if (result.errors.length > 10) {
            console.log(chalk.red(`  ... and ${result.errors.length - 10} more errors`));
          }
        }

        if (isDryRun && result.migrated > 0) {
          console.log("");
          console.log(chalk.yellow("This was a dry run. Run without --dry-run to apply changes."));
        }
      }, { failText: "Migration failed" });
    });

  return cmd;
}
