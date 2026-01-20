/**
 * MCH 기본 에러 클래스
 * 모든 커스텀 에러의 베이스
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
 * 리소스를 찾을 수 없을 때
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
 * 입력 검증 실패
 */
export class ValidationError extends MCHError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

/**
 * AI 클라이언트 에러
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
 * 파일 시스템 에러
 */
export class FileSystemError extends MCHError {
  constructor(message: string, public readonly path: string) {
    super(message, "FILE_SYSTEM_ERROR");
    this.name = "FileSystemError";
  }
}

/**
 * 설정 에러
 */
export class ConfigError extends MCHError {
  constructor(message: string) {
    super(message, "CONFIG_ERROR");
    this.name = "ConfigError";
  }
}
