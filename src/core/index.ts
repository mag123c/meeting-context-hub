/**
 * Core module exports
 * This module provides the business logic layer that can be used by any UI (TUI, GUI, CLI)
 */

// ============================================================================
// Domain Layer
// ============================================================================

export { createContext, formatContextPreview } from './domain/index.js';
export { createProject, validateProjectName } from './domain/index.js';

// ============================================================================
// Services Layer
// ============================================================================

export { ExtractService } from './services/index.js';
export { ConfigService } from './services/index.js';
export { EmbeddingService } from './services/index.js';
export { ChainService } from './services/index.js';

// ============================================================================
// Use Cases Layer
// ============================================================================

export {
  AddContextUseCase,
  type AddContextInput,
  type AddContextResult,
} from './usecases/index.js';

export {
  ListContextsUseCase,
  type ListContextsResult,
} from './usecases/index.js';

export { ManageProjectUseCase } from './usecases/index.js';
export { GetContextUseCase } from './usecases/index.js';

export {
  SearchContextUseCase,
  type SearchContextResult,
} from './usecases/index.js';

export {
  RecordContextUseCase,
  type RecordContextResult,
} from './usecases/index.js';
