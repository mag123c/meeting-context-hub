import { useState, useCallback, useRef, useEffect } from "react";
import type { RecordingHandler, RecordingController } from "../../input/recording.handler.js";
import type { CreateContextInput } from "../../types/context.types.js";
import type { TranscriptionResult } from "../../types/transcription.types.js";

export type RecordingState = "idle" | "recording" | "stopping" | "processing";

export interface UseRecordingResult {
  state: RecordingState;
  elapsed: number;
  chunkCount: number;
  currentChunkElapsed: number;
  error: string | null;
  chunkPaths: string[];
  transcribedChunks: number;
  totalChunks: number;
  failedChunks: number;
  transcriptionResult: TranscriptionResult | null;
  startRecording: () => void;
  stopRecording: () => string[]; // Returns paths for immediate use
  transcribe: (paths?: string[]) => Promise<CreateContextInput>;
  cancel: () => Promise<void>;
  cleanup: () => Promise<void>;
  saveAndCleanup: (vaultPath: string, paths?: string[]) => Promise<string>; // Save to vault and cleanup
}

// 10 minutes per chunk
const CHUNK_DURATION_SEC = 10 * 60;

export function useRecording(handler: RecordingHandler): UseRecordingResult {
  const [state, setState] = useState<RecordingState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [chunkCount, setChunkCount] = useState(0);
  const [currentChunkElapsed, setCurrentChunkElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [chunkPaths, setChunkPaths] = useState<string[]>([]);
  const [transcribedChunks, setTranscribedChunks] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [failedChunks, setFailedChunks] = useState(0);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);

  const controllerRef = useRef<RecordingController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(() => {
    try {
      setError(null);
      setTranscribedChunks(0);
      setTotalChunks(0);
      setFailedChunks(0);
      setTranscriptionResult(null);
      controllerRef.current = handler.startRecording();
      setChunkPaths([]);
      setChunkCount(1);
      setState("recording");

      startTimeRef.current = Date.now();
      setElapsed(0);
      setCurrentChunkElapsed(0);

      timerRef.current = setInterval(() => {
        const totalElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsed(totalElapsed);
        setCurrentChunkElapsed(totalElapsed % CHUNK_DURATION_SEC);

        // Update chunk count from controller
        if (controllerRef.current) {
          const count = controllerRef.current.getChunkCount();
          setChunkCount(count);
        }
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start recording");
      setState("idle");
    }
  }, [handler]);

  const stopRecording = useCallback((): string[] => {
    if (!controllerRef.current) return [];

    setState("stopping");
    clearTimer();

    try {
      const paths = controllerRef.current.getChunkPaths();
      controllerRef.current.stop();
      controllerRef.current = null;
      setChunkPaths(paths);
      setTotalChunks(paths.length);
      return paths; // Return paths directly for immediate use
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop recording");
      setState("idle");
      return [];
    }
  }, [clearTimer]);

  const transcribe = useCallback(async (paths?: string[]): Promise<CreateContextInput> => {
    // Use provided paths or fall back to state (paths param avoids React state timing issue)
    const pathsToTranscribe = paths || chunkPaths;

    if (pathsToTranscribe.length === 0) {
      throw new Error("No recording to transcribe");
    }

    setState("processing");
    setTranscribedChunks(0);
    setTotalChunks(pathsToTranscribe.length);
    setFailedChunks(0);
    setTranscriptionResult(null);

    try {
      // Use new transcribeWithRetry for better error handling
      const result = await handler.transcribeWithRetry(pathsToTranscribe);

      // Update states with result
      setTranscribedChunks(result.totalChunks);
      setFailedChunks(result.failedCount);
      setTranscriptionResult(result);

      // Check if all chunks failed
      if (result.successCount === 0 && result.totalChunks > 0) {
        const errorMsg = "All audio chunks failed to transcribe";
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      return {
        type: "audio",
        content: result.combinedText,
        source: `recording-${Date.now()}`,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Transcription failed";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [handler, chunkPaths]);

  const cancel = useCallback(async () => {
    clearTimer();

    if (controllerRef.current) {
      const paths = controllerRef.current.getChunkPaths();
      controllerRef.current.stop();
      controllerRef.current = null;
      await handler.cleanup(paths);
    }

    if (chunkPaths.length > 0) {
      await handler.cleanup(chunkPaths);
    }

    setChunkPaths([]);
    setState("idle");
    setElapsed(0);
    setChunkCount(0);
    setCurrentChunkElapsed(0);
    setError(null);
    setTranscribedChunks(0);
    setTotalChunks(0);
    setFailedChunks(0);
    setTranscriptionResult(null);
  }, [handler, chunkPaths, clearTimer]);

  const cleanup = useCallback(async () => {
    if (chunkPaths.length > 0) {
      await handler.cleanup(chunkPaths);
      setChunkPaths([]);
    }
    setState("idle");
    setElapsed(0);
    setChunkCount(0);
    setCurrentChunkElapsed(0);
    setTranscribedChunks(0);
    setTotalChunks(0);
    setFailedChunks(0);
    setTranscriptionResult(null);
  }, [handler, chunkPaths]);

  const saveAndCleanup = useCallback(async (vaultPath: string, paths?: string[]): Promise<string> => {
    const pathsToSave = paths || chunkPaths;
    if (pathsToSave.length === 0) {
      throw new Error("No recording to save");
    }

    try {
      const savedPath = await handler.saveRecordings(pathsToSave, vaultPath);
      setChunkPaths([]);
      setState("idle");
      setElapsed(0);
      setChunkCount(0);
      setCurrentChunkElapsed(0);
      setTranscribedChunks(0);
      setTotalChunks(0);
      setFailedChunks(0);
      setTranscriptionResult(null);
      return savedPath;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save recording";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [handler, chunkPaths]);

  useEffect(() => {
    return () => {
      clearTimer();
      if (controllerRef.current) {
        controllerRef.current.stop();
      }
    };
  }, [clearTimer]);

  return {
    state,
    elapsed,
    chunkCount,
    currentChunkElapsed,
    error,
    chunkPaths,
    transcribedChunks,
    totalChunks,
    failedChunks,
    transcriptionResult,
    startRecording,
    stopRecording,
    transcribe,
    cancel,
    cleanup,
    saveAndCleanup,
  };
}
