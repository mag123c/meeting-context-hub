/**
 * MCH base error class
 * Base for all custom errors
 */
export class MCHError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "MCHError";
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends MCHError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} not found: ${id}`
      : `${resource} not found`;
    super(message, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

/**
 * Input validation failed
 */
export class ValidationError extends MCHError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

/**
 * AI client error
 */
export class AIClientError extends MCHError {
  constructor(
    message: string,
    public readonly provider: "claude" | "openai"
  ) {
    super(message, "AI_CLIENT_ERROR");
    this.name = "AIClientError";
  }
}

/**
 * File system error
 */
export class FileSystemError extends MCHError {
  constructor(message: string, public readonly path: string) {
    super(message, "FILE_SYSTEM_ERROR");
    this.name = "FileSystemError";
  }
}

/**
 * Configuration error
 */
export class ConfigError extends MCHError {
  constructor(message: string) {
    super(message, "CONFIG_ERROR");
    this.name = "ConfigError";
  }
}

/**
 * API key missing error
 */
export class APIKeyMissingError extends MCHError {
  constructor(public readonly provider: "anthropic" | "openai") {
    const envKey = provider === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY";
    super(
      `${provider.toUpperCase()} API key not configured. Run: mch config set ${envKey} <key>`,
      "API_KEY_MISSING"
    );
    this.name = "APIKeyMissingError";
  }
}

/**
 * Recording dependency missing error
 */
export type RecordingOS = "macos" | "windows" | "linux";
export type RecordingBinary = "sox" | "arecord";

export class RecordingDependencyError extends MCHError {
  constructor(
    public readonly binary: RecordingBinary,
    public readonly os: RecordingOS
  ) {
    const instructions: Record<RecordingOS, string> = {
      macos: "brew install sox",
      windows: "choco install sox.portable",
      linux: "sudo apt install alsa-utils",
    };
    super(
      `Recording requires ${binary}. Install: ${instructions[os]}`,
      "RECORDING_DEPENDENCY_MISSING"
    );
    this.name = "RecordingDependencyError";
  }
}
