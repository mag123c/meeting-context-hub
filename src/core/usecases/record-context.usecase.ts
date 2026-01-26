import type { StorageProvider } from '../../adapters/storage/storage.interface.js';
import type { TranscriptionProvider } from '../../adapters/audio/whisper.adapter.js';
import type { RecordingProvider, RecordingEvents, RecordingState } from '../../adapters/audio/recording.adapter.js';
import type { Context, SearchResult } from '../../types/index.js';
import { ExtractService } from '../services/extract.service.js';
import { EmbeddingService } from '../services/embedding.service.js';
import { ChainService } from '../services/chain.service.js';
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
  constructor(
    private readonly recordingProvider: RecordingProvider,
    private readonly transcriptionProvider: TranscriptionProvider,
    private readonly extractService: ExtractService,
    private readonly embeddingService: EmbeddingService,
    private readonly chainService: ChainService,
    private readonly storage: StorageProvider
  ) {}

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
   * Transcribe audio file
   */
  async transcribe(filePath: string): Promise<string> {
    return this.transcriptionProvider.transcribeFile(filePath);
  }

  /**
   * Process transcription: extract context and save
   */
  async processTranscription(
    transcription: string,
    projectId: string | null
  ): Promise<RecordContextResult> {
    // 1. Extract structured data from transcription
    const extracted = await this.extractService.extract(transcription);

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
   */
  async completeRecording(projectId: string | null): Promise<RecordContextResult> {
    const filePath = this.stopRecording();
    if (!filePath) {
      throw new Error('No recording to process');
    }

    const transcription = await this.transcribe(filePath);
    return this.processTranscription(transcription, projectId);
  }
}
