/**
 * Meeting markdown formatter
 */

import type { Meeting } from "../types/meeting.types.js";

export interface FormatMeetingOptions {
  project?: string;
  sprint?: string;
}

/**
 * Format meeting data as Obsidian-compatible markdown
 */
export function formatMeetingMarkdown(meeting: Meeting, options?: FormatMeetingOptions): string {
  const { summary } = meeting;
  const { project, sprint } = options ?? {};
  const lines: string[] = [];

  lines.push("# " + summary.title);
  lines.push("");

  if (summary.date) {
    lines.push("**일시**: " + summary.date);
  }
  if (summary.participants.length > 0) {
    lines.push("**참석자**: " + summary.participants.join(", "));
  }
  if (project) {
    lines.push("**프로젝트**: " + project);
  }
  if (sprint) {
    lines.push("**스프린트**: " + sprint);
  }
  lines.push("");

  lines.push("## 📋 회의 요약");
  lines.push(summary.summary);
  lines.push("");

  if (summary.decisions.length > 0) {
    lines.push("## 🎯 핵심 결정사항");
    summary.decisions.forEach((d) => lines.push("- " + d));
    lines.push("");
  }

  if (summary.actionItems.length > 0) {
    lines.push("## ✅ Action Items");
    lines.push("| 할 일 | 담당자 | 기한 |");
    lines.push("|-------|--------|------|");
    summary.actionItems.forEach((item) => {
      const assignee = item.assignee || "-";
      const deadline = item.deadline || "-";
      lines.push("| " + item.task + " | " + assignee + " | " + deadline + " |");
    });
    lines.push("");
  }

  if (summary.keyPoints.length > 0) {
    lines.push("## 💡 주요 논의 포인트");
    summary.keyPoints.forEach((p) => lines.push("- " + p));
    lines.push("");
  }

  if (summary.openIssues.length > 0) {
    lines.push("## ❓ 미해결 이슈");
    summary.openIssues.forEach((i) => lines.push("- " + i));
    lines.push("");
  }

  if (summary.nextSteps.length > 0) {
    lines.push("## 📅 다음 단계");
    summary.nextSteps.forEach((s) => lines.push("- " + s));
    lines.push("");
  }

  return lines.join("\n");
}
