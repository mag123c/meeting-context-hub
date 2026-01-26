export { ClaudeAdapter } from './claude.adapter.js';
export { AIExtractionError, type AIProvider } from './ai.interface.js';
export { OpenAIAdapter, type EmbeddingProvider } from './openai.adapter.js';

// Re-export EmbeddingError from types for backward compatibility
export { EmbeddingError } from '../../types/errors.js';
