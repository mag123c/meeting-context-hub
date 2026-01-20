import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { createServices } from "../../core/factories.js";

export function createAddCommand(): Command {
  const cmd = new Command("add")
    .description("Add a new context")
    .option("-t, --text <text>", "Add text content")
    .option("-i, --image <path>", "Add image file (Claude Vision)")
    .option("-a, --audio <path>", "Add audio file (Whisper)")
    .option("-f, --file <path>", "Add file content (txt, md, csv, json)")
    .action(async (options) => {
      const spinner = ora();
      try {
        const services = createServices();
        let input;

        if (options.text) {
          input = services.textHandler.handle(options.text);
        } else if (options.image) {
          spinner.start("Analyzing image with Claude Vision...");
          input = await services.imageHandler.handle(options.image);
          spinner.succeed("Image analyzed");
        } else if (options.audio) {
          spinner.start("Transcribing audio with Whisper...");
          input = await services.audioHandler.handle(options.audio);
          spinner.succeed("Audio transcribed");
        } else if (options.file) {
          input = await services.fileHandler.handle(options.file);
        } else {
          const answers = await inquirer.prompt([
            {
              type: "input",
              name: "content",
              message: "Enter your context:",
            },
          ]);
          if (!answers.content) {
            console.log(chalk.yellow("No content provided."));
            return;
          }
          input = services.textHandler.handle(answers.content);
        }

        spinner.start("Processing context (tagging, summarizing, embedding)...");
        const context = await services.addContextUseCase.execute(input);
        spinner.succeed("Context saved!");

        console.log(chalk.green("\nContext created:"));
        console.log(chalk.gray("  ID:"), context.id);
        console.log(chalk.gray("  Type:"), context.type);
        console.log(chalk.gray("  Summary:"), context.summary);
        console.log(chalk.gray("  Tags:"), context.tags.join(", "));
        if (context.source) {
          console.log(chalk.gray("  Source:"), context.source);
        }
      } catch (error) {
        spinner.fail("Failed to add context");
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  return cmd;
}
