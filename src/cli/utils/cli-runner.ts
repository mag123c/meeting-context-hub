import chalk from "chalk";
import ora, { type Ora } from "ora";

export interface RunnerOptions {
  initialText?: string;
  failText?: string;
}

/**
 * Common error handling and spinner management for CLI commands
 */
export async function withSpinner<T>(
  fn: (spinner: Ora) => Promise<T>,
  options?: RunnerOptions
): Promise<T> {
  const spinner = ora({ stream: process.stdout });

  if (options?.initialText) {
    spinner.start(options.initialText);
  }

  try {
    return await fn(spinner);
  } catch (error) {
    const failMessage = options?.failText ?? "Operation failed";
    spinner.fail(failMessage);
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

/**
 * Print error message and exit (without spinner)
 */
export function exitWithError(message: string): never {
  console.error(chalk.red(message));
  process.exit(1);
}
