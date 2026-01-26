/**
 * Retry Service
 *
 * Provides exponential backoff retry logic for async operations
 */

import { isRetryableError } from '../../types/errors.js';

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts: number;
  /** Initial delay in milliseconds (default: 1000) */
  baseDelayMs: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelayMs: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier: number;
  /** Custom function to determine if error is retryable */
  retryableErrors?: (error: Error) => boolean;
  /** Callback when retry occurs */
  onRetry?: (error: Error, attempt: number, delayMs: number) => void;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Execute an async operation with exponential backoff retry
 *
 * @param operation - Async function to execute
 * @param options - Retry configuration
 * @returns Result of the operation
 * @throws Last error if all retries exhausted
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => apiCall(),
 *   { maxAttempts: 3, baseDelayMs: 1000 }
 * );
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> {
  const opts: RetryOptions = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;
  let attempt = 0;

  while (attempt < opts.maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempt++;

      // Check if we should retry
      const shouldRetry = opts.retryableErrors
        ? opts.retryableErrors(lastError)
        : isRetryableError(lastError);

      // Don't retry if not retryable or last attempt
      if (!shouldRetry || attempt >= opts.maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff and jitter
      const exponentialDelay =
        opts.baseDelayMs * Math.pow(opts.backoffMultiplier, attempt - 1);
      const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
      const delayMs = Math.min(exponentialDelay + jitter, opts.maxDelayMs);

      // Call retry callback if provided
      opts.onRetry?.(lastError, attempt, delayMs);

      // Wait before retrying
      await sleep(delayMs);
    }
  }

  // All retries exhausted
  throw lastError;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a retry wrapper with preset options
 *
 * @param defaultOptions - Default options for all retries
 * @returns Configured withRetry function
 *
 * @example
 * ```typescript
 * const retryWithLogging = createRetryWrapper({
 *   maxAttempts: 5,
 *   onRetry: (err, attempt) => console.log(`Retry ${attempt}: ${err.message}`)
 * });
 *
 * const result = await retryWithLogging(() => apiCall());
 * ```
 */
export function createRetryWrapper(defaultOptions: Partial<RetryOptions>) {
  return <T>(
    operation: () => Promise<T>,
    options?: Partial<RetryOptions>
  ): Promise<T> => {
    return withRetry(operation, { ...defaultOptions, ...options });
  };
}

/**
 * Preconfigured retry for API calls (3 attempts, 1s base delay)
 */
export const retryApiCall = createRetryWrapper({
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
});

/**
 * Preconfigured retry for rate-limited APIs (5 attempts, 2s base delay)
 */
export const retryRateLimited = createRetryWrapper({
  maxAttempts: 5,
  baseDelayMs: 2000,
  maxDelayMs: 30000,
});
