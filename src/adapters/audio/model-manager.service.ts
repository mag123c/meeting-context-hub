/**
 * Whisper Model Manager Service
 *
 * Manages downloading and storing local Whisper models
 */

import { existsSync, mkdirSync, createWriteStream, unlinkSync, renameSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { get } from 'https';
import type { WhisperModel } from './whisper.types.js';

/**
 * Model info with download URL and file size
 */
interface ModelInfo {
  url: string;
  filename: string;
  sizeBytes: number;
}

/**
 * Model download URLs from Hugging Face
 */
const MODEL_URLS: Record<WhisperModel, ModelInfo> = {
  tiny: {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
    filename: 'ggml-tiny.bin',
    sizeBytes: 75_000_000, // ~75MB
  },
  base: {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
    filename: 'ggml-base.bin',
    sizeBytes: 142_000_000, // ~142MB
  },
  small: {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
    filename: 'ggml-small.bin',
    sizeBytes: 466_000_000, // ~466MB
  },
  medium: {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin',
    filename: 'ggml-medium.bin',
    sizeBytes: 1_500_000_000, // ~1.5GB
  },
  large: {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large.bin',
    filename: 'ggml-large.bin',
    sizeBytes: 2_900_000_000, // ~2.9GB
  },
};

/**
 * Model download progress callback
 */
export type DownloadProgressCallback = (
  downloadedBytes: number,
  totalBytes: number
) => void;

/**
 * Model Manager for local Whisper models
 */
export class ModelManager {
  private modelsDir: string;

  constructor(customModelsDir?: string) {
    this.modelsDir = customModelsDir ?? join(homedir(), '.mch', 'models', 'whisper');
  }

  /**
   * Get the models directory path
   */
  getModelsDir(): string {
    return this.modelsDir;
  }

  /**
   * Ensure models directory exists
   */
  ensureModelsDir(): void {
    if (!existsSync(this.modelsDir)) {
      mkdirSync(this.modelsDir, { recursive: true });
    }
  }

  /**
   * Get path to a model file
   */
  getModelPath(model: WhisperModel): string {
    const info = MODEL_URLS[model];
    return join(this.modelsDir, info.filename);
  }

  /**
   * Check if a model is downloaded
   */
  isModelDownloaded(model: WhisperModel): boolean {
    const modelPath = this.getModelPath(model);
    return existsSync(modelPath);
  }

  /**
   * Get model info
   */
  getModelInfo(model: WhisperModel): ModelInfo {
    return MODEL_URLS[model];
  }

  /**
   * List all available models and their download status
   */
  listModels(): Array<{
    model: WhisperModel;
    downloaded: boolean;
    path: string;
    sizeBytes: number;
  }> {
    const models: WhisperModel[] = ['tiny', 'base', 'small', 'medium', 'large'];

    return models.map((model) => ({
      model,
      downloaded: this.isModelDownloaded(model),
      path: this.getModelPath(model),
      sizeBytes: MODEL_URLS[model].sizeBytes,
    }));
  }

  /**
   * Download a model with progress callback
   */
  async downloadModel(
    model: WhisperModel,
    onProgress?: DownloadProgressCallback
  ): Promise<string> {
    this.ensureModelsDir();

    const info = MODEL_URLS[model];
    const modelPath = this.getModelPath(model);
    const tempPath = modelPath + '.tmp';

    // If already downloaded, return path
    if (this.isModelDownloaded(model)) {
      return modelPath;
    }

    return new Promise((resolve, reject) => {
      const file = createWriteStream(tempPath);
      let downloadedBytes = 0;

      const handleRedirect = (url: string) => {
        get(url, (response) => {
          // Handle redirects
          if (response.statusCode === 301 || response.statusCode === 302) {
            const redirectUrl = response.headers.location;
            if (redirectUrl) {
              handleRedirect(redirectUrl);
              return;
            }
          }

          if (response.statusCode !== 200) {
            file.close();
            unlinkSync(tempPath);
            reject(new Error(`Failed to download model: HTTP ${response.statusCode}`));
            return;
          }

          const totalBytes = parseInt(response.headers['content-length'] ?? '0', 10) || info.sizeBytes;

          response.on('data', (chunk: Buffer) => {
            downloadedBytes += chunk.length;
            onProgress?.(downloadedBytes, totalBytes);
          });

          response.pipe(file);

          file.on('finish', () => {
            file.close();
            // Rename temp file to final path
            try {
              renameSync(tempPath, modelPath);
              resolve(modelPath);
            } catch (err) {
              reject(err);
            }
          });
        }).on('error', (err) => {
          file.close();
          if (existsSync(tempPath)) {
            unlinkSync(tempPath);
          }
          reject(err);
        });
      };

      handleRedirect(info.url);
    });
  }

  /**
   * Delete a downloaded model
   */
  deleteModel(model: WhisperModel): boolean {
    const modelPath = this.getModelPath(model);
    if (existsSync(modelPath)) {
      unlinkSync(modelPath);
      return true;
    }
    return false;
  }
}

/**
 * Default model manager instance
 */
let defaultManager: ModelManager | null = null;

/**
 * Get the default model manager instance
 */
export function getModelManager(): ModelManager {
  if (!defaultManager) {
    defaultManager = new ModelManager();
  }
  return defaultManager;
}
