import { useState, useCallback, useRef, useEffect } from "react";
import type { RecordingHandler, RecordingController } from "../../input/recording.handler.js";
import type { CreateContextInput } from "../../types/context.types.js";

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
  startRecording: () => void;
  stopRecording: () => string[]; // Returns paths for immediate use
  transcribe: (paths?: string[]) => Promise<CreateContextInput>;
  cancel: () => Promise<void>;
  cleanup: () => Promise<void>;
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

    try {
      // Custom transcription with progress tracking
      const transcriptions: string[] = [];

      for (let i = 0; i < pathsToTranscribe.length; i++) {
        setTranscribedChunks(i + 1);
        const result = await handler.transcribe([pathsToTranscribe[i]]);
        if (result.content.trim()) {
          transcriptions.push(result.content.trim());
        }
      }

      const combinedContent = transcriptions.join("\n\n");

      return {
        type: "audio",
        content: combinedContent,
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
    startRecording,
    stopRecording,
    transcribe,
    cancel,
    cleanup,
  };
}
