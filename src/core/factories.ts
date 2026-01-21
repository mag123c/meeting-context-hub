import { loadConfig, getObsidianPath, type Config } from "../config/index.js";
import { ObsidianContextRepository } from "../storage/obsidian/index.js";
import { ClaudeClient, WhisperClient, EmbeddingClient } from "../ai/index.js";
import { TextHandler, ImageHandler, AudioHandler, FileHandler, RecordingHandler } from "../input/index.js";
import { AddContextUseCase } from "./add-context.usecase.js";
import { SearchContextUseCase } from "./search-context.usecase.js";
import { SummarizeMeetingUseCase } from "./summarize-meeting.usecase.js";
import { HierarchyService } from "./hierarchy.service.js";

export interface AppServices {
  config: Config;
  repository: ObsidianContextRepository;
  claude: ClaudeClient;
  whisper: WhisperClient;
  embedding: EmbeddingClient;
  hierarchyService: HierarchyService;
  textHandler: TextHandler;
  imageHandler: ImageHandler;
  audioHandler: AudioHandler;
  fileHandler: FileHandler;
  recordingHandler: RecordingHandler;
  addContextUseCase: AddContextUseCase;
  searchContextUseCase: SearchContextUseCase;
  summarizeMeetingUseCase: SummarizeMeetingUseCase;
}

let services: AppServices | null = null;

export function createServices(): AppServices {
  if (services) return services;

  const config = loadConfig();
  const obsidianPath = getObsidianPath(config);

  const repository = new ObsidianContextRepository(obsidianPath);
  const claude = new ClaudeClient(config.anthropicApiKey);
  const whisper = new WhisperClient(config.openaiApiKey);
  const embedding = new EmbeddingClient(config.openaiApiKey);
  const hierarchyService = new HierarchyService(obsidianPath, claude);

  const textHandler = new TextHandler();
  const imageHandler = new ImageHandler(claude);
  const audioHandler = new AudioHandler(whisper);
  const fileHandler = new FileHandler();
  const recordingHandler = new RecordingHandler(whisper);

  const addContextUseCase = new AddContextUseCase(repository, claude, embedding, hierarchyService);
  const searchContextUseCase = new SearchContextUseCase(repository, embedding);
  const summarizeMeetingUseCase = new SummarizeMeetingUseCase({
    llmClient: claude,
    embeddingClient: embedding,
    contextRepository: repository,
    hierarchyService,
  });

  services = {
    config,
    repository,
    claude,
    whisper,
    embedding,
    hierarchyService,
    textHandler,
    imageHandler,
    audioHandler,
    fileHandler,
    recordingHandler,
    addContextUseCase,
    searchContextUseCase,
    summarizeMeetingUseCase,
  };

  return services;
}

export function getServices(): AppServices {
  if (!services) {
    throw new Error("Services not initialized. Call createServices() first.");
  }
  return services;
}

/**
 * Reset services (for testing purposes)
 */
export function resetServices(): void {
  services = null;
}
