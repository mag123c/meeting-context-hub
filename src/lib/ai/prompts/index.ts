export {
  MEETING_SUMMARY_PROMPT,
  meetingSummaryOutputSchema,
  type MeetingSummaryOutput,
} from "./meeting-summary.prompt";

export {
  CONTEXT_TAGGING_PROMPT,
  contextTaggingOutputSchema,
  buildContextTaggingPrompt,
  type ContextTaggingOutput,
} from "./context-tagging.prompt";

export {
  QA_SEARCH_PROMPT,
  qaSearchOutputSchema,
  buildQASearchPrompt,
  type QASearchOutput,
} from "./qa-search.prompt";
