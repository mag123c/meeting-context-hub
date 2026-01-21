import { Box, Text } from "ink";
import InkSpinner from "ink-spinner";
import type { RecordingState } from "../hooks/useRecording.js";

interface RecordingIndicatorProps {
  state: RecordingState;
  elapsed: number;
  chunkCount?: number;
  transcribedChunks?: number;
  totalChunks?: number;
  error?: string | null;
}

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function RecordingIndicator({
  state,
  elapsed,
  chunkCount = 0,
  transcribedChunks = 0,
  totalChunks = 0,
  error,
}: RecordingIndicatorProps) {
  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {error}</Text>
        <Text dimColor>Press Esc to go back</Text>
      </Box>
    );
  }

  switch (state) {
    case "idle":
      return (
        <Box flexDirection="column">
          <Text bold>Ready to record</Text>
          <Box marginTop={1}>
            <Text dimColor>Press Enter to start recording</Text>
          </Box>
          <Box marginTop={1}>
            <Text dimColor>No time limit - auto-chunks every 10 minutes</Text>
          </Box>
        </Box>
      );

    case "recording":
      return (
        <Box flexDirection="column">
          <Box>
            <Text color="red" bold>
              {"● "}
            </Text>
            <Text bold>Recording... </Text>
            <Text color="yellow">{formatTime(elapsed)}</Text>
          </Box>
          {chunkCount > 1 && (
            <Box marginTop={1}>
              <Text dimColor>Chunk {chunkCount} (auto-saving every 10 min)</Text>
            </Box>
          )}
          <Box marginTop={1}>
            <Text dimColor>Press Enter to stop recording</Text>
          </Box>
        </Box>
      );

    case "stopping":
      return (
        <Box>
          <Text color="yellow">Stopping...</Text>
        </Box>
      );

    case "processing":
      return (
        <Box flexDirection="column">
          <Box>
            <Text color="cyan">
              <InkSpinner type="dots" />
            </Text>
            <Text> Transcribing audio...</Text>
          </Box>
          {totalChunks > 1 && (
            <Box marginTop={1}>
              <Text dimColor>
                Processing chunk {transcribedChunks}/{totalChunks}
              </Text>
            </Box>
          )}
        </Box>
      );

    default:
      return null;
  }
}
