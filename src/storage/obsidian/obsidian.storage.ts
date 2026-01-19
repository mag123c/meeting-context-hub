import * as fs from "fs/promises";
import * as path from "path";
import type { MeetingWithTags, ContextWithTags } from "@/repositories/types";

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || "/Users/jaehojang/Documents";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toISOString().split("T")[0];
}

export interface ObsidianStorage {
  writeMeeting(meeting: MeetingWithTags): Promise<string>;
  writeContext(context: ContextWithTags): Promise<string>;
  readFile(relativePath: string): Promise<string | null>;
  listFiles(folder: string): Promise<string[]>;
  deleteFile(relativePath: string): Promise<void>;
}

export class ObsidianFileStorage implements ObsidianStorage {
  private vaultPath: string;

  constructor(vaultPath: string = VAULT_PATH) {
    this.vaultPath = vaultPath;
  }

  private async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch {
      // 이미 존재하면 무시
    }
  }

  async writeMeeting(meeting: MeetingWithTags): Promise<string> {
    const date = formatDate(meeting.created_at);
    const slug = slugify(meeting.title);
    const filename = `${date}-${slug}.md`;
    const folder = path.join(this.vaultPath, "meetings");
    const filePath = path.join(folder, filename);

    await this.ensureDir(folder);

    const tags = meeting.tags.map((t) => t.name).join(", ");
    const prd = meeting.prd_summary;
    const actionItems = meeting.action_items || [];

    let content = `---
tags: [${tags}]
date: ${date}
type: meeting
meeting_id: ${meeting.id}
---

# ${meeting.title}

`;

    if (prd) {
      content += `## PRD Summary

### Problem
${prd.problem}

### Goal
${prd.goal}

### Scope
${prd.scope.map((s) => `- ${s}`).join("\n")}

### Requirements
${prd.requirements.map((r) => `- ${r}`).join("\n")}

`;
    }

    if (actionItems.length > 0) {
      content += `## Action Items

${actionItems
  .map((item) => {
    const deadline = item.deadline ? ` (기한: ${item.deadline})` : "";
    return `- [ ] **${item.assignee}**: ${item.task}${deadline}`;
  })
  .join("\n")}

`;
    }

    content += `## 원본 회의록

${meeting.raw_content}
`;

    await fs.writeFile(filePath, content, "utf-8");

    return `meetings/${filename}`;
  }

  async writeContext(context: ContextWithTags): Promise<string> {
    const date = formatDate(context.created_at);
    const shortId = context.id.slice(0, 8);
    const filename = `${date}-${context.source}-${shortId}.md`;
    const folder = path.join(this.vaultPath, "contexts");
    const filePath = path.join(folder, filename);

    await this.ensureDir(folder);

    const tags = context.tags.map((t) => t.name).join(", ");

    const content = `---
tags: [${tags}]
date: ${date}
type: context
source: ${context.source}
context_id: ${context.id}
---

# Context

${context.content}
`;

    await fs.writeFile(filePath, content, "utf-8");

    return `contexts/${filename}`;
  }

  async readFile(relativePath: string): Promise<string | null> {
    try {
      const filePath = path.join(this.vaultPath, relativePath);
      return await fs.readFile(filePath, "utf-8");
    } catch {
      return null;
    }
  }

  async listFiles(folder: string): Promise<string[]> {
    try {
      const folderPath = path.join(this.vaultPath, folder);
      const files = await fs.readdir(folderPath);
      return files.filter((f) => f.endsWith(".md"));
    } catch {
      return [];
    }
  }

  async deleteFile(relativePath: string): Promise<void> {
    try {
      const filePath = path.join(this.vaultPath, relativePath);
      await fs.unlink(filePath);
    } catch {
      // 파일이 없으면 무시
    }
  }
}

export const obsidianStorage = new ObsidianFileStorage();
