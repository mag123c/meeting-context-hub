# Types

Type definitions and Zod schemas for domain entities.

## Structure

| File | Purpose |
|------|---------|
| `context.types.ts` | Context, CreateContextInput, ListOptions |
| `context.schema.ts` | Zod validation schemas |
| `hierarchy.types.ts` | Hierarchy classification types |
| `meeting.types.ts` | Meeting, MeetingSummary, ActionItem |
| `meeting.schema.ts` | Meeting Zod schemas |
| `prompt.types.ts` | Prompt template type |
| `tag.types.ts` | Tag-related types |
| `config.types.ts` | Configuration types |

## Hierarchy Types

```typescript
// AI classification result
interface HierarchyPlacement {
  project: string;      // "ProjectA" | "Uncategorized"
  category: string;     // "Backend" | "Meeting" | "General"
  isNewProject: boolean;
  isNewCategory: boolean;
  confidence: number;   // 0-1
}

// Cache structure (hierarchy.json)
interface HierarchyCache {
  version: number;
  updatedAt: string;
  projects: HierarchyProject[];
}

interface HierarchyProject {
  name: string;
  categories: string[];
}
```

## Context Fields

Key fields in `Context`:

| Field | Type | Description |
|-------|------|-------------|
| `project` | `string?` | Hierarchy level 1 |
| `category` | `string?` | Hierarchy level 2 |
| `sprint` | `string?` | Sprint identifier |
| `tags` | `string[]` | AI-extracted tags |
| `embedding` | `number[]?` | Vector for semantic search |
