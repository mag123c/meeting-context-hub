import { Command } from "commander";
import chalk from "chalk";
import { loadConfig, getObsidianPath } from "../../config/index.js";
import { setApiKeyInKeychain, deleteApiKeyFromKeychain, getApiKeyFromKeychain } from "../../config/keychain.js";

export function createConfigCommand(): Command {
  const cmd = new Command("config")
    .description("Manage configuration");

  cmd
    .command("show")
    .description("Show current configuration")
    .action(() => {
      try {
        const config = loadConfig();
        console.log(chalk.bold("\nCurrent Configuration:"));
        console.log(chalk.gray("Obsidian Vault:"), config.obsidianVaultPath);
        console.log(chalk.gray("MCH Folder:"), config.mchFolder);
        console.log(chalk.gray("Full Path:"), getObsidianPath(config));
        console.log(chalk.gray("Anthropic API Key:"), config.anthropicApiKey ? "***" + config.anthropicApiKey.slice(-4) : "(not set)");
        console.log(chalk.gray("OpenAI API Key:"), config.openaiApiKey ? "***" + config.openaiApiKey.slice(-4) : "(not set)");
      } catch (error) {
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  cmd
    .command("set <key> <value>")
    .description("Set a configuration value (saves to macOS keychain for API keys)")
    .action((key, value) => {
      try {
        const supportedKeys = ["ANTHROPIC_API_KEY", "OPENAI_API_KEY"];
        if (!supportedKeys.includes(key.toUpperCase())) {
          console.log(chalk.yellow("Only API keys can be set via CLI. Supported: " + supportedKeys.join(", ")));
          console.log(chalk.gray("For other settings, edit .env.local file."));
          return;
        }

        setApiKeyInKeychain(key.toUpperCase(), value);
        console.log(chalk.green("Saved " + key + " to macOS keychain"));
      } catch (error) {
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  cmd
    .command("delete <key>")
    .description("Delete an API key from macOS keychain")
    .action((key) => {
      try {
        deleteApiKeyFromKeychain(key.toUpperCase());
        console.log(chalk.green("Deleted " + key + " from macOS keychain"));
      } catch (error) {
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  cmd
    .command("check")
    .description("Check if API keys are configured")
    .action(() => {
      const anthropicKey = getApiKeyFromKeychain("ANTHROPIC_API_KEY");
      const openaiKey = getApiKeyFromKeychain("OPENAI_API_KEY");

      console.log(chalk.bold("\nAPI Key Status (Keychain):"));
      console.log(
        chalk.gray("Anthropic API Key:"),
        anthropicKey ? chalk.green("Set") : chalk.yellow("Not set")
      );
      console.log(
        chalk.gray("OpenAI API Key:"),
        openaiKey ? chalk.green("Set") : chalk.yellow("Not set")
      );

      if (!anthropicKey || !openaiKey) {
        console.log(chalk.gray("\nTo set API keys:"));
        console.log(chalk.cyan("  mch config set ANTHROPIC_API_KEY sk-ant-xxx"));
        console.log(chalk.cyan("  mch config set OPENAI_API_KEY sk-xxx"));
      }
    });

  return cmd;
}
