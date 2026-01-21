import { useState, useCallback } from "react";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { Header, Menu, Spinner, ErrorBanner, KeyHintBar, RecordingIndicator, type MenuItem } from "../components/index.js";
import { useRecording } from "../hooks/index.js";
import type { NavigationContext } from "../App.js";
import type { AppServices } from "../../core/factories.js";
import type { ContextType, Context } from "../../types/context.types.js";
import type { Meeting } from "../../types/meeting.types.js";
import { useTranslation } from "../../i18n/index.js";

interface AddScreenProps {
  navigation: NavigationContext;
  services: AppServices;
}

type Step = "type" | "content" | "recording" | "project" | "sprint" | "processing" | "result";

interface FormData {
  type: ContextType | "meeting" | "record";
  content: string;
  project: string;
  sprint: string;
}

export function AddScreen({ navigation, services }: AddScreenProps) {
  const { t } = useTranslation();

  const typeItems: MenuItem[] = [
    { label: t.add.types.text, value: "text" },
    { label: t.add.types.image, value: "image" },
    { label: t.add.types.audio, value: "audio" },
    { label: t.add.types.record, value: "record" },
    { label: t.add.types.file, value: "file" },
    { label: t.add.types.meeting, value: "meeting" },
  ];
  const [step, setStep] = useState<Step>("type");
  const [formData, setFormData] = useState<FormData>({
    type: "text",
    content: "",
    project: "",
    sprint: "",
  });
  const [result, setResult] = useState<Context | Meeting | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recording = useRecording(services.recordingHandler);

  // Handle keyboard input
  useInput((_, key) => {
    // Handle recording step
    if (step === "recording") {
      if (key.return) {
        if (recording.state === "idle") {
          recording.startRecording();
        } else if (recording.state === "recording") {
          void (async () => {
            recording.stopRecording();
            try {
              const transcriptionResult = await recording.transcribe();
              setFormData((prev) => ({ ...prev, content: transcriptionResult.content }));
              setStep("project");
            } catch {
              setError(recording.error || "Transcription failed");
              setStep("result");
            }
          })();
        }
        return;
      }
      if (key.escape) {
        if (recording.state === "recording" || recording.state === "idle") {
          void recording.cancel();
          setStep("type");
        }
        return;
      }
      return;
    }

    // Handle Esc for other steps
    if (key.escape) {
      if (step === "type") {
        navigation.goBack();
      } else if (step === "result" || step === "processing") {
        // Can't go back during processing or after result
        if (step === "result") navigation.goBack();
      } else {
        // Go to previous step
        const stepOrder: Step[] = ["type", "content", "project", "sprint"];
        const currentIndex = stepOrder.indexOf(step);
        if (currentIndex > 0) {
          setStep(stepOrder[currentIndex - 1]);
        }
      }
    }
  });

  const handleTypeSelect = useCallback((item: MenuItem) => {
    setFormData((prev) => ({ ...prev, type: item.value as ContextType | "meeting" | "record" }));
    if (item.value === "record") {
      setStep("recording");
    } else {
      setStep("content");
    }
  }, []);

  const handleContentSubmit = useCallback((value: string) => {
    if (!value.trim()) return;
    setFormData((prev) => ({ ...prev, content: value }));
    setStep("project");
  }, []);

  const handleProjectSubmit = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, project: value }));
    setStep("sprint");
  }, []);

  const handleSprintSubmit = useCallback(async (value: string) => {
    setFormData((prev) => ({ ...prev, sprint: value }));
    setStep("processing");

    try {
      const { type, content, project, sprint } = { ...formData, sprint: value };

      let processedContent = content;
      let source: string | undefined;

      // Process based on type
      if (type === "image") {
        const imageResult = await services.imageHandler.handle(content);
        processedContent = imageResult.content;
        source = imageResult.source;
      } else if (type === "audio") {
        const audioResult = await services.audioHandler.handle(content);
        processedContent = audioResult.content;
        source = audioResult.source;
      } else if (type === "record") {
        // Content already transcribed, just use it
        processedContent = content;
        source = "microphone-recording";
        // Clean up temp files after processing
        await recording.cleanup();
      } else if (type === "file") {
        const fileResult = await services.fileHandler.handle(content);
        processedContent = fileResult.content;
        source = fileResult.source;
      } else if (type === "meeting") {
        // Meeting uses summarize use case - read file first
        const filePath = resolve(content);
        const transcript = await readFile(filePath, "utf-8");
        const meetingResult = await services.summarizeMeetingUseCase.execute({
          transcript,
          source: filePath,
          project: project || undefined,
          sprint: sprint || undefined,
        });
        setResult(meetingResult);
        setStep("result");
        return;
      }

      // For non-meeting types, use add context use case
      const ctx = await services.addContextUseCase.execute({
        type: type === "record" ? "audio" : (type as ContextType),
        content: processedContent,
        source,
        project: project || undefined,
        sprint: sprint || undefined,
      });

      setResult(ctx);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setStep("result");
    }
  }, [formData, services, recording]);

  const renderStep = () => {
    switch (step) {
      case "type":
        return (
          <Box flexDirection="column">
            <Text bold>{t.add.selectType}</Text>
            <Box marginTop={1}>
              <Menu items={typeItems} onSelect={handleTypeSelect} />
            </Box>
          </Box>
        );

      case "content":
        return (
          <Box flexDirection="column">
            <Text bold>
              {formData.type === "text"
                ? t.add.enterContent
                : formData.type === "meeting"
                ? t.add.enterTranscriptPath
                : t.add.enterFilePath.replace("{type}", formData.type)}
            </Text>
            <Box marginTop={1}>
              <Text color="cyan">{"> "}</Text>
              <TextInput
                value={formData.content}
                onChange={(value) => setFormData((prev) => ({ ...prev, content: value }))}
                onSubmit={handleContentSubmit}
              />
            </Box>
          </Box>
        );

      case "recording":
        return (
          <Box flexDirection="column">
            <Text bold>{t.add.recordAudio}</Text>
            <Box marginTop={1}>
              <RecordingIndicator
                state={recording.state}
                elapsed={recording.elapsed}
                chunkCount={recording.chunkCount}
                transcribedChunks={recording.transcribedChunks}
                totalChunks={recording.totalChunks}
                error={recording.error}
              />
            </Box>
          </Box>
        );

      case "project":
        return (
          <Box flexDirection="column">
            <Text bold>{t.add.projectName}</Text>
            <Box marginTop={1}>
              <Text color="cyan">{"> "}</Text>
              <TextInput
                value={formData.project}
                onChange={(value) => setFormData((prev) => ({ ...prev, project: value }))}
                onSubmit={handleProjectSubmit}
              />
            </Box>
          </Box>
        );

      case "sprint":
        return (
          <Box flexDirection="column">
            <Text bold>{t.add.sprintIdentifier}</Text>
            <Box marginTop={1}>
              <Text color="cyan">{"> "}</Text>
              <TextInput
                value={formData.sprint}
                onChange={(value) => setFormData((prev) => ({ ...prev, sprint: value }))}
                onSubmit={handleSprintSubmit}
              />
            </Box>
          </Box>
        );

      case "processing":
        return <Spinner message={t.add.processing} />;

      case "result":
        if (error) {
          return (
            <Box flexDirection="column">
              <ErrorBanner message={error} />
              <Text dimColor>{t.common.pressEscToGoBack}</Text>
            </Box>
          );
        }
        if (result) {
          // Check if result is a Meeting (has 'summary' as object) or Context (has 'summary' as string)
          const isMeeting = typeof (result as Meeting).summary === "object";

          if (isMeeting) {
            const meeting = result as Meeting;
            return (
              <Box flexDirection="column">
                <Text color="green" bold>
                  {t.add.meetingSavedSuccess}
                </Text>
                <Box marginTop={1} flexDirection="column">
                  <Text>
                    <Text bold>{t.add.labels.id}</Text> {meeting.id.slice(0, 8)}
                  </Text>
                  <Text>
                    <Text bold>{t.add.labels.title}</Text> {meeting.summary.title}
                  </Text>
                  <Text>
                    <Text bold>{t.add.labels.summary}</Text> {meeting.summary.summary}
                  </Text>
                  <Text>
                    <Text bold>{t.add.labels.tags}</Text> {meeting.tags.join(", ")}
                  </Text>
                </Box>
                <Box marginTop={1}>
                  <Text dimColor>{t.common.pressEscToGoBack}</Text>
                </Box>
              </Box>
            );
          }

          const ctx = result as Context;
          return (
            <Box flexDirection="column">
              <Text color="green" bold>
                {t.add.contextSavedSuccess}
              </Text>
              <Box marginTop={1} flexDirection="column">
                <Text>
                  <Text bold>{t.add.labels.id}</Text> {ctx.id.slice(0, 8)}
                </Text>
                <Text>
                  <Text bold>{t.add.labels.type}</Text> {ctx.type}
                </Text>
                <Text>
                  <Text bold>{t.add.labels.summary}</Text> {ctx.summary}
                </Text>
                <Text>
                  <Text bold>{t.add.labels.tags}</Text> {ctx.tags.join(", ")}
                </Text>
                {ctx.project && (
                  <Text>
                    <Text bold>{t.add.labels.project}</Text> {ctx.project}
                  </Text>
                )}
                {ctx.sprint && (
                  <Text>
                    <Text bold>{t.add.labels.sprint}</Text> {ctx.sprint}
                  </Text>
                )}
              </Box>
              <Box marginTop={1}>
                <Text dimColor>{t.common.pressEscToGoBack}</Text>
              </Box>
            </Box>
          );
        }
        return null;

      default:
        return null;
    }
  };

  const getKeyBindings = () => {
    if (step === "type") {
      return [
        { key: "Enter", description: t.add.keyHints.select },
        { key: "Esc", description: t.add.keyHints.back },
      ];
    }
    if (step === "processing") {
      return [];
    }
    if (step === "recording") {
      if (recording.state === "idle") {
        return [
          { key: "Enter", description: t.add.keyHints.startRecording },
          { key: "Esc", description: t.add.keyHints.back },
        ];
      }
      if (recording.state === "recording") {
        return [
          { key: "Enter", description: t.add.keyHints.stopRecording },
          { key: "Esc", description: t.add.keyHints.cancel },
        ];
      }
      if (recording.state === "processing" || recording.state === "stopping") {
        return [];
      }
    }
    return [
      { key: "Enter", description: t.add.keyHints.submit },
      { key: "Esc", description: t.add.keyHints.back },
    ];
  };

  return (
    <Box flexDirection="column">
      <Header title={t.add.title} breadcrumb={t.add.breadcrumb} />
      {renderStep()}
      {step !== "processing" && !(step === "recording" && (recording.state === "processing" || recording.state === "stopping")) && (
        <KeyHintBar bindings={getKeyBindings()} />
      )}
    </Box>
  );
}
