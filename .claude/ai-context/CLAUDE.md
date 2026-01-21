# AI Context

This directory contains **knowledge documents** needed for Claude to understand the project.

## Structure

```
ai-context/
├── CLAUDE.md             # This file
├── architecture.json     # Project layers, dependencies
├── conventions.json      # Naming, commit, code style
├── testing.json          # Test commands and locations
│
├── domain/               # Domain knowledge
│   ├── glossary.json     # Meeting domain terms
│   ├── entities.json     # Entity relationships
│   └── rules.json        # Business rules
│
└── integrations/         # External integrations
    ├── obsidian.json     # Obsidian storage config
    ├── slack.json        # Slack sync config
    └── notion.json       # Notion sync config
```

## Loading Rules

### Basic Loading (All Sessions)

Always reference these files:

| File | Purpose |
|------|---------|
| `architecture.json` | Understand project structure |
| `conventions.json` | Follow coding standards |
| `domain/glossary.json` | Understand meeting domain terms |

### Selective Loading

Load additional files based on task type:

| Task | Additional Files |
|------|------------------|
| Domain logic | `domain/entities.json`, `domain/rules.json` |
| Obsidian storage | `integrations/obsidian.json` |
| Slack sync | `integrations/slack.json` |
| Notion sync | `integrations/notion.json` |
| Testing | `testing.json` |

## Usage Examples

### 1. New Feature Development

```
1. architecture.json - Identify affected layers
2. conventions.json - Follow naming patterns
3. domain/glossary.json - Understand related terms
4. (if needed) domain/rules.json - Business rule compliance
```

### 2. Storage Implementation

```
1. Basic 3 files
2. integrations/obsidian.json - File format, frontmatter
```

### 3. External Sync

```
1. Basic 3 files
2. integrations/slack.json or notion.json - API details
3. domain/rules.json - Sync process rules
```

## Token Prediction

| Session Type | Files Loaded | Est. Tokens |
|--------------|--------------|-------------|
| General work | architecture + conventions | ~1K |
| Domain work | + domain/* (3 files) | ~3K |
| Integration work | + integrations/* | ~4K |
| Full analysis | All files | ~5K |

## Document Update Rules

1. **entities.json**: Update when entity fields change
2. **rules.json**: Update when new business rules added
3. **glossary.json**: Update when new domain terms introduced
4. **integrations/*.json**: Update when integration config changes

---
Last updated: 2026-01-21
