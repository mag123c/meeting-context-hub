import chalk from "chalk";
import ora, { type Ora } from "ora";

export interface RunnerOptions {
  initialText?: string;
  failText?: string;
}

/**
 * CLI 명령어의 공통 에러 처리 및 스피너 관리
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
 * 에러 메시지 출력 후 종료 (스피너 없이)
 */
export function exitWithError(message: string): never {
  console.error(chalk.red(message));
  process.exit(1);
}
