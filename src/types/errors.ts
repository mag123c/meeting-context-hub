/**
 * MCH Error System
 *
 * Centralized error types following ARCHITECTURE.md specification
 */

/**
 * Error codes for all MCH errors
 */
export enum ErrorCode {
  // Config
  MISSING_API_KEY = 'MISSING_API_KEY',
  INVALID_CONFIG = 'INVALID_CONFIG',

  // AI
  AI_EXTRACTION_FAILED = 'AI_EXTRACTION_FAILED',
  AI_RATE_LIMITED = 'AI_RATE_LIMITED',
  AI_NETWORK_ERROR = 'AI_NETWORK_ERROR',

  // Embedding
  EMBEDDING_FAILED = 'EMBEDDING_FAILED',
  EMBEDDING_RATE_LIMITED = 'EMBEDDING_RATE_LIMITED',

  // Transcription
  TRANSCRIPTION_FAILED = 'TRANSCRIPTION_FAILED',
  TRANSCRIPTION_FILE_NOT_FOUND = 'TRANSCRIPTION_FILE_NOT_FOUND',
  TRANSCRIPTION_FILE_TOO_LARGE = 'TRANSCRIPTION_FILE_TOO_LARGE',

  // Recording
  RECORDING_FAILED = 'RECORDING_FAILED',
  RECORDING_SOX_NOT_FOUND = 'RECORDING_SOX_NOT_FOUND',
  RECORDING_ALREADY_ACTIVE = 'RECORDING_ALREADY_ACTIVE',

  // Storage
  DB_CONNECTION_FAILED = 'DB_CONNECTION_FAILED',
  DB_QUERY_FAILED = 'DB_QUERY_FAILED',
  DB_NOT_INITIALIZED = 'DB_NOT_INITIALIZED',
  CONTEXT_NOT_FOUND = 'CONTEXT_NOT_FOUND',
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  PROJECT_NAME_DUPLICATE = 'PROJECT_NAME_DUPLICATE',
  DICTIONARY_DUPLICATE_SOURCE = 'DICTIONARY_DUPLICATE_SOURCE',

  // Input
  INVALID_INPUT = 'INVALID_INPUT',
  INPUT_TOO_SHORT = 'INPUT_TOO_SHORT',
  INVALID_FILE_EXTENSION = 'INVALID_FILE_EXTENSION',

  // Network
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

/**
 * Recovery messages for each error code (bilingual)
 */
export const ERROR_RECOVERY: Record<ErrorCode, { ko: string; en: string }> = {
  // Config
  [ErrorCode.MISSING_API_KEY]: {
    ko: 'Settings에서 API 키를 설정해주세요.',
    en: 'Please set your API key in Settings.',
  },
  [ErrorCode.INVALID_CONFIG]: {
    ko: '설정 파일을 확인해주세요.',
    en: 'Please check your configuration file.',
  },

  // AI
  [ErrorCode.AI_EXTRACTION_FAILED]: {
    ko: '다시 시도하거나 입력 내용을 확인해주세요.',
    en: 'Please try again or check your input.',
  },
  [ErrorCode.AI_RATE_LIMITED]: {
    ko: '잠시 후 다시 시도해주세요. (API 요청 제한)',
    en: 'Please wait and try again. (API rate limited)',
  },
  [ErrorCode.AI_NETWORK_ERROR]: {
    ko: '인터넷 연결을 확인하고 다시 시도해주세요.',
    en: 'Please check your internet connection and try again.',
  },

  // Embedding
  [ErrorCode.EMBEDDING_FAILED]: {
    ko: '임베딩 생성에 실패했습니다. 다시 시도해주세요.',
    en: 'Failed to generate embedding. Please try again.',
  },
  [ErrorCode.EMBEDDING_RATE_LIMITED]: {
    ko: '잠시 후 다시 시도해주세요. (임베딩 API 제한)',
    en: 'Please wait and try again. (Embedding API rate limited)',
  },

  // Transcription
  [ErrorCode.TRANSCRIPTION_FAILED]: {
    ko: '음성 인식에 실패했습니다. 오디오 품질을 확인해주세요.',
    en: 'Transcription failed. Please check your audio quality.',
  },
  [ErrorCode.TRANSCRIPTION_FILE_NOT_FOUND]: {
    ko: '오디오 파일을 찾을 수 없습니다.',
    en: 'Audio file not found.',
  },
  [ErrorCode.TRANSCRIPTION_FILE_TOO_LARGE]: {
    ko: '오디오 파일이 너무 큽니다. 자동으로 분할하여 처리합니다.',
    en: 'Audio file is too large. Automatically splitting for processing.',
  },

  // Recording
  [ErrorCode.RECORDING_FAILED]: {
    ko: '녹음에 실패했습니다. 마이크 권한을 확인해주세요.',
    en: 'Recording failed. Please check microphone permissions.',
  },
  [ErrorCode.RECORDING_SOX_NOT_FOUND]: {
    ko: 'sox가 설치되어 있지 않습니다. `brew install sox`를 실행해주세요.',
    en: 'sox is not installed. Please run `brew install sox`.',
  },
  [ErrorCode.RECORDING_ALREADY_ACTIVE]: {
    ko: '이미 녹음 중입니다.',
    en: 'Recording is already in progress.',
  },

  // Storage
  [ErrorCode.DB_CONNECTION_FAILED]: {
    ko: '데이터베이스 연결에 실패했습니다. 경로를 확인해주세요.',
    en: 'Failed to connect to database. Please check the path.',
  },
  [ErrorCode.DB_QUERY_FAILED]: {
    ko: '데이터베이스 작업에 실패했습니다.',
    en: 'Database operation failed.',
  },
  [ErrorCode.DB_NOT_INITIALIZED]: {
    ko: '데이터베이스가 초기화되지 않았습니다.',
    en: 'Database is not initialized.',
  },
  [ErrorCode.CONTEXT_NOT_FOUND]: {
    ko: '컨텍스트를 찾을 수 없습니다.',
    en: 'Context not found.',
  },
  [ErrorCode.PROJECT_NOT_FOUND]: {
    ko: '프로젝트를 찾을 수 없습니다.',
    en: 'Project not found.',
  },
  [ErrorCode.PROJECT_NAME_DUPLICATE]: {
    ko: '이미 같은 이름의 프로젝트가 존재합니다.',
    en: 'A project with this name already exists.',
  },
  [ErrorCode.DICTIONARY_DUPLICATE_SOURCE]: {
    ko: '이미 같은 오인식어가 등록되어 있습니다.',
    en: 'A dictionary entry with this source already exists.',
  },

  // Input
  [ErrorCode.INVALID_INPUT]: {
    ko: '입력값이 올바르지 않습니다.',
    en: 'Invalid input.',
  },
  [ErrorCode.INPUT_TOO_SHORT]: {
    ko: '입력이 너무 짧습니다. 더 자세한 내용을 입력해주세요.',
    en: 'Input is too short. Please provide more details.',
  },
  [ErrorCode.INVALID_FILE_EXTENSION]: {
    ko: '지원하지 않는 파일 형식입니다.',
    en: 'Unsupported file format.',
  },

  // Network
  [ErrorCode.NETWORK_ERROR]: {
    ko: '네트워크 오류가 발생했습니다. 연결을 확인해주세요.',
    en: 'Network error occurred. Please check your connection.',
  },
  [ErrorCode.TIMEOUT_ERROR]: {
    ko: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
    en: 'Request timed out. Please try again.',
  },
};

/**
 * Base MCH Error class
 */
export class MCHError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly recoverable: boolean = true,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'MCHError';
  }

  /**
   * Get recovery message for current language
   */
  getRecoveryMessage(language: 'ko' | 'en'): string {
    return ERROR_RECOVERY[this.code]?.[language] ?? '';
  }
}

/**
 * AI-related errors (extraction, rate limiting)
 */
export class AIError extends MCHError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.AI_EXTRACTION_FAILED,
    recoverable: boolean = true,
    originalError?: Error
  ) {
    super(message, code, recoverable, originalError);
    this.name = 'AIError';
  }
}

/**
 * Embedding-related errors
 */
export class EmbeddingError extends MCHError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.EMBEDDING_FAILED,
    recoverable: boolean = true,
    originalError?: Error
  ) {
    super(message, code, recoverable, originalError);
    this.name = 'EmbeddingError';
  }
}

/**
 * Storage-related errors (SQLite)
 */
export class StorageError extends MCHError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.DB_QUERY_FAILED,
    recoverable: boolean = true,
    originalError?: Error
  ) {
    super(message, code, recoverable, originalError);
    this.name = 'StorageError';
  }
}

/**
 * Transcription-related errors (Whisper)
 */
export class TranscriptionError extends MCHError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.TRANSCRIPTION_FAILED,
    recoverable: boolean = true,
    originalError?: Error
  ) {
    super(message, code, recoverable, originalError);
    this.name = 'TranscriptionError';
  }
}

/**
 * Recording-related errors (sox)
 */
export class RecordingError extends MCHError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.RECORDING_FAILED,
    recoverable: boolean = true,
    originalError?: Error
  ) {
    super(message, code, recoverable, originalError);
    this.name = 'RecordingError';
  }
}

/**
 * Configuration errors
 */
export class ConfigError extends MCHError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INVALID_CONFIG,
    public readonly missingKeys: string[] = [],
    recoverable: boolean = true,
    originalError?: Error
  ) {
    super(message, code, recoverable, originalError);
    this.name = 'ConfigError';
  }
}

/**
 * Input validation errors
 */
export class InputError extends MCHError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INVALID_INPUT,
    recoverable: boolean = true,
    originalError?: Error
  ) {
    super(message, code, recoverable, originalError);
    this.name = 'InputError';
  }
}

/**
 * Type guard to check if an error is an MCHError
 */
export function isMCHError(error: unknown): error is MCHError {
  return error instanceof MCHError;
}

/**
 * Check if an error is retryable (rate limit, network, timeout)
 */
export function isRetryableError(error: unknown): boolean {
  if (!isMCHError(error)) {
    // Check for common network error patterns
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('rate limit') ||
        message.includes('429') ||
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('econnreset') ||
        message.includes('enotfound') ||
        message.includes('socket hang up')
      );
    }
    return false;
  }

  const retryableCodes = [
    ErrorCode.AI_RATE_LIMITED,
    ErrorCode.AI_NETWORK_ERROR,
    ErrorCode.EMBEDDING_RATE_LIMITED,
    ErrorCode.NETWORK_ERROR,
    ErrorCode.TIMEOUT_ERROR,
  ];

  return retryableCodes.includes(error.code);
}

/**
 * Detect error code from raw error
 */
export function detectErrorCode(error: unknown): ErrorCode {
  if (isMCHError(error)) {
    return error.code;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Rate limiting
    if (message.includes('rate limit') || message.includes('429')) {
      return ErrorCode.AI_RATE_LIMITED;
    }

    // Network errors
    if (
      message.includes('network') ||
      message.includes('econnreset') ||
      message.includes('enotfound') ||
      message.includes('socket hang up')
    ) {
      return ErrorCode.NETWORK_ERROR;
    }

    // Timeout
    if (message.includes('timeout')) {
      return ErrorCode.TIMEOUT_ERROR;
    }

    // Sox not found
    if (message.includes('sox') && message.includes('not found')) {
      return ErrorCode.RECORDING_SOX_NOT_FOUND;
    }

    // File not found
    if (message.includes('enoent') || message.includes('no such file')) {
      return ErrorCode.TRANSCRIPTION_FILE_NOT_FOUND;
    }

    // File too large (413 error from Whisper API)
    if (message.includes('413') || message.includes('maximum content size')) {
      return ErrorCode.TRANSCRIPTION_FILE_TOO_LARGE;
    }

    // SQLite errors
    if (message.includes('sqlite') || message.includes('unique constraint')) {
      if (message.includes('unique constraint')) {
        return ErrorCode.PROJECT_NAME_DUPLICATE;
      }
      return ErrorCode.DB_QUERY_FAILED;
    }
  }

  return ErrorCode.NETWORK_ERROR;
}
