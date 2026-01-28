import type { StorageProvider } from '../../adapters/storage/storage.interface.js';
import type { TranscriptionProvider } from '../../adapters/audio/whisper.adapter.js';
import type { RecordingProvider, RecordingEvents, RecordingState } from '../../adapters/audio/recording.adapter.js';
import type { ExtractOptions } from '../../adapters/ai/ai.interface.js';
import type { Context, SearchResult } from '../../types/index.js';
import { ExtractService } from '../services/extract.service.js';
import { EmbeddingService } from '../services/embedding.service.js';
import { ChainService } from '../services/chain.service.js';
import { DictionaryService } from '../services/dictionary.service.js';
import { PromptContextService } from '../services/prompt-context.service.js';
import { createContext } from '../domain/context.js';

export interface RecordContextResult {
  context: Context;
  transcription: string;
  relatedContexts: SearchResult[];
}

/**
 * Use case for recording audio, transcribing, and extracting context
 */
export class RecordContextUseCase {
  private dictionaryService: DictionaryService | null = null;
  private promptContextService: PromptContextService | null = null;

  constructor(
    private readonly recordingProvider: RecordingProvider,
    private readonly transcriptionProvider: TranscriptionProvider,
    private readonly extractService: ExtractService,
    private readonly embeddingService: EmbeddingService,
    private readonly chainService: ChainService,
    private readonly storage: StorageProvider
  ) {
    // Initialize dictionary service for STT correction
    this.dictionaryService = new DictionaryService(storage);
    // Initialize prompt context service for domain knowledge
    this.promptContextService = new PromptContextService(storage);
  }

  /**
   * Start recording
   */
  startRecording(events?: RecordingEvents): void {
    this.recordingProvider.start(events);
  }

  /**
   * Stop recording and get file path
   */
  stopRecording(): string | null {
    return this.recordingProvider.stop();
  }

  /**
   * Get current recording state
   */
  getRecordingState(): RecordingState {
    return this.recordingProvider.getState();
  }

  /**
   * Get recording duration in seconds
   */
  getRecordingDuration(): number {
    return this.recordingProvider.getDuration();
  }

  /**
   * Transcribe audio file and apply dictionary corrections
   */
  async transcribe(filePath: string): Promise<string> {
    const rawText = await this.transcriptionProvider.transcribeFile(filePath);

    // Apply dictionary corrections if available
    if (this.dictionaryService) {
      return this.dictionaryService.correctText(rawText);
    }

    return rawText;
  }

  /**
   * Process transcription: extract context and save
   * @param transcription - The transcribed text
   * @param projectId - The project/group ID
   * @param extractOptions - Options for AI extraction (language, domainContext)
   */
  async processTranscription(
    transcription: string,
    projectId: string | null,
    extractOptions?: ExtractOptions
  ): Promise<RecordContextResult> {
    // 0. Get domain context for prompt injection
    let domainContext: string | undefined;
    if (this.promptContextService) {
      const domainContextStr = await this.promptContextService.getDomainContextForPrompt();
      if (domainContextStr) {
        domainContext = domainContextStr;
      }
    }

    // Merge extract options with domain context
    const mergedOptions: ExtractOptions = {
      ...extractOptions,
      domainContext: domainContext || extractOptions?.domainContext,
    };

    // 1. Extract structured data from transcription
    const extracted = await this.extractService.extract(transcription, mergedOptions);

    // 2. Create context entity
    const context = createContext(transcription, extracted, projectId);

    // 3. Generate embedding if available
    if (this.embeddingService.isAvailable()) {
      try {
        const embedding = await this.embeddingService.generateForContext({
          ...extracted,
          rawInput: transcription,
        });
        if (embedding) {
          context.embedding = embedding;
        }
      } catch {
        // Continue without embedding if it fails
      }
    }

    // 4. Find related contexts before saving
    let relatedContexts: SearchResult[] = [];
    if (context.embedding) {
      const contextsWithEmbeddings = await this.storage.listContextsWithEmbeddings(
        projectId ?? undefined
      );
      relatedContexts = this.chainService.findRelated(
        context.embedding,
        contextsWithEmbeddings,
        { limit: 5, threshold: 0.5 }
      );
    }

    // 5. Save to storage
    await this.storage.saveContext(context);

    return { context, transcription, relatedContexts };
  }

  /**
   * Full flow: stop recording → transcribe → extract → save
   * @param projectId - The project/group ID
   * @param extractOptions - Options for AI extraction (language, domainContext)
   */
  async completeRecording(projectId: string | null, extractOptions?: ExtractOptions): Promise<RecordContextResult> {
    const filePath = this.stopRecording();
    if (!filePath) {
      throw new Error('No recording to process');
    }

    const transcription = await this.transcribe(filePath);
    return this.processTranscription(transcription, projectId, extractOptions);
  }
}
