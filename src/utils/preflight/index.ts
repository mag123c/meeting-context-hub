/**
 * Pre-flight Validation System
 * Validates conditions before operations to provide clear error messages
 */

export {
  PREFLIGHT_ERROR_CODES,
  FILE_SIZE_LIMITS,
  MAGIC_BYTES,
  MIN_DISK_SPACE,
  type ValidationSeverity,
  type ValidationIssue,
  type PreflightResult,
  type PreflightErrorCode,
  type FileSizeCategory,
} from "./types.js";

export {
  validateFilePreflight,
  validateImageFile,
  validateAudioFile,
  validateDocumentFile,
  validateMeetingFile,
  validateRecording,
  isRecordingAvailable,
  getRecordingInfo,
  type FileValidationOptions,
} from "./validators/index.js";

export {
  runPreflight,
  runPreflightBatch,
  combinePreflightResults,
  formatPreflightResult,
  getPreflightErrors,
  getPreflightWarnings,
  type PreflightCheckType,
  type PreflightOptions,
} from "./preflight-runner.js";
