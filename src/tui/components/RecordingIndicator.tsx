import { Box, Text } from "ink";
import InkSpinner from "ink-spinner";
import type { RecordingState } from "../hooks/useRecording.js";
import { useTranslation } from "../../i18n/index.js";

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
  const { t } = useTranslation();

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">{t.recording.error} {error}</Text>
        <Text dimColor>{t.common.pressEscToGoBack}</Text>
      </Box>
    );
  }

  switch (state) {
    case "idle":
      return (
        <Box flexDirection="column">
          <Text bold>{t.recording.readyToRecord}</Text>
          <Box marginTop={1}>
            <Text dimColor>{t.recording.pressEnterToStart}</Text>
          </Box>
          <Box marginTop={1}>
            <Text dimColor>{t.recording.noTimeLimit}</Text>
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
            <Text bold>{t.recording.recording} </Text>
            <Text color="yellow">{formatTime(elapsed)}</Text>
          </Box>
          {chunkCount > 1 && (
            <Box marginTop={1}>
              <Text dimColor>{t.recording.chunkInfo.replace("{n}", String(chunkCount))}</Text>
            </Box>
          )}
          <Box marginTop={1}>
            <Text dimColor>{t.recording.pressEnterToStop}</Text>
          </Box>
        </Box>
      );

    case "stopping":
      return (
        <Box>
          <Text color="yellow">{t.recording.stopping}</Text>
        </Box>
      );

    case "processing":
      return (
        <Box flexDirection="column">
          <Box>
            <Text color="cyan">
              <InkSpinner type="dots" />
            </Text>
            <Text> {t.recording.transcribing}</Text>
          </Box>
          {totalChunks > 1 && (
            <Box marginTop={1}>
              <Text dimColor>
                {t.recording.processingChunk
                  .replace("{current}", String(transcribedChunks))
                  .replace("{total}", String(totalChunks))}
              </Text>
            </Box>
          )}
        </Box>
      );

    default:
      return null;
  }
}
