import chalk from "chalk";
import type { Context, ContextWithSimilarity } from "../../types/context.types.js";
import type { Meeting } from "../../types/meeting.types.js";

/**
 * Format context metadata output (for add command)
 */
export function formatContextMeta(ctx: Context): void {
  console.log(chalk.green("\nContext created:"));
  console.log(chalk.gray("  ID:"), ctx.id);
  console.log(chalk.gray("  Type:"), ctx.type);
  console.log(chalk.gray("  Summary:"), ctx.summary);
  console.log(chalk.gray("  Tags:"), ctx.tags.join(", "));
  if (ctx.source) {
    console.log(chalk.gray("  Source:"), ctx.source);
  }
  if (ctx.project) {
    console.log(chalk.gray("  Project:"), ctx.project);
  }
  if (ctx.sprint) {
    console.log(chalk.gray("  Sprint:"), ctx.sprint);
  }
}

/**
 * Format meeting result output (for add -m command)
 */
export function formatMeetingResult(meeting: Meeting, finalProject?: string, finalSprint?: string): void {
  console.log(chalk.green("\nMeeting summary created:"));
  console.log(chalk.gray("  ID:"), meeting.id);
  console.log(chalk.gray("  Title:"), meeting.summary.title);
  console.log(chalk.gray("  Date:"), meeting.summary.date || "-");
  console.log(chalk.gray("  Participants:"), meeting.summary.participants.join(", "));
  console.log(chalk.gray("  Tags:"), meeting.tags.join(", "));
  if (finalProject) console.log(chalk.gray("  Project:"), finalProject);
  if (finalSprint) console.log(chalk.gray("  Sprint:"), finalSprint);

  console.log(chalk.cyan("\n📋 Summary:"));
  console.log("  " + meeting.summary.summary);

  if (meeting.summary.decisions.length > 0) {
    console.log(chalk.cyan("\n🎯 Decisions:"));
    meeting.summary.decisions.forEach((d) => console.log("  - " + d));
  }

  if (meeting.summary.actionItems.length > 0) {
    console.log(chalk.cyan("\n✅ Action Items:"));
    meeting.summary.actionItems.forEach((item) => {
      const assignee = item.assignee ? " (@" + item.assignee + ")" : "";
      const deadline = item.deadline ? " [" + item.deadline + "]" : "";
      console.log("  - " + item.task + assignee + deadline);
    });
  }

  if (meeting.summary.nextSteps.length > 0) {
    console.log(chalk.cyan("\n📅 Next Steps:"));
    meeting.summary.nextSteps.forEach((s) => console.log("  - " + s));
  }
}

/**
 * Format search result output (for search command)
 */
export function formatSearchResult(ctx: Context | ContextWithSimilarity): void {
  const similarity = (ctx as ContextWithSimilarity).similarity;

  console.log(chalk.cyan("-".repeat(50)));
  console.log(chalk.bold("ID:"), ctx.id);
  console.log(chalk.gray("Type:"), ctx.type);
  console.log(chalk.gray("Summary:"), ctx.summary);
  console.log(chalk.gray("Tags:"), ctx.tags.join(", ") || "(none)");
  if (ctx.project) console.log(chalk.gray("Project:"), ctx.project);
  if (ctx.sprint) console.log(chalk.gray("Sprint:"), ctx.sprint);
  console.log(chalk.gray("Created:"), ctx.createdAt.toLocaleString());
  if (similarity !== undefined) {
    console.log(chalk.green("Similarity:"), (similarity * 100).toFixed(1) + "%");
  }
}

/**
 * String padding utility
 */
export function padEnd(str: string, length: number): string {
  return str.length >= length ? str.slice(0, length) : str + " ".repeat(length - str.length);
}
