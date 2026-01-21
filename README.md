# Meeting Context Hub

A CLI tool that processes multimodal inputs (text/image/audio/file/meeting transcripts) with AI and stores them in Obsidian.
Find related contexts with tag + embedding-based semantic search.

## Features

- **Text** - Save notes and ideas
- **Image** - Analyze with Claude Vision and extract tags
- **Audio** - Transcribe with Whisper
- **File** - Support txt, md, csv, json
- **Meeting** - Auto-summarize with PRD format + Action Items
- **Semantic Search** - Find similar documents with embeddings
- **Auto Tagging** - AI generates relevant tags automatically
- **Obsidian Integration** - Graph View, Dataview query support
- **TUI Mode** - Interactive terminal UI with ink

## Installation

```bash
npm install -g meeting-context-hub
```

### Requirements

- Node.js >= 20.0.0
- [Obsidian](https://obsidian.md/) (optional, used as storage)

## Configuration

### API Keys

**Option 1: macOS Keychain (Recommended)**

```bash
mch config set ANTHROPIC_API_KEY sk-ant-xxx
mch config set OPENAI_API_KEY sk-xxx
```

**Option 2: Environment Variables**

```bash
cp .env.local.example .env.local
# Edit .env.local file
```

### Obsidian Vault

```bash
# Default: ~/Library/Mobile Documents/iCloud~md~obsidian/Documents
mch config set OBSIDIAN_VAULT_PATH /path/to/your/vault

# Storage folder (default: mch)
mch config set MCH_FOLDER mch
```

### Check Configuration

```bash
mch config show   # Show current settings
mch config check  # Check API key status
```

## Usage

### TUI Mode (Interactive)

```bash
mch
```

Launches an interactive terminal UI with:
- Add Context (text/image/audio/file/meeting)
- Search (semantic/exact/tag)
- List with filtering and pagination
- Config management

### CLI Mode

#### Add Context

```bash
# Text
mch add -t "Today's meeting decisions..."

# Image (Claude Vision analysis)
mch add -i ./screenshot.png

# Audio (Whisper transcription)
mch add -a ./recording.m4a

# File
mch add -f ./notes.md

# Interactive mode
mch add
```

#### Meeting Summary

```bash
mch add -m ./meeting-transcript.txt
```

**Output format:**
- Meeting Summary
- Key Decisions
- Action Items (assignee, deadline)
- Discussion Points
- Open Issues
- Next Steps

#### Search

```bash
# Semantic search (default)
mch search "project schedule"

# Exact text match
mch search "API" --exact

# Find similar documents
mch search --similar <context-id>

# Filter by tag
mch search --tag "meeting"
```

#### List

```bash
# All contexts
mch list

# Filter by tag
mch list --tag "meeting"

# Filter by type
mch list --type image

# Pagination
mch list -l 10 -o 20
```

## Obsidian Integration

### File Structure

Contexts are saved in `{vault}/{mch-folder}/`:

```
~/Obsidian/Vault/mch/
├── meeting-summary-campaign_a1b2c3d4.md
├── cli-test-image-analysis_e5f6g7h8.md
└── ...
```

### Frontmatter

```yaml
---
id: a1b2c3d4-...
type: text
summary: Summary content
tags:
  - meeting
  - project
embedding: [0.1, 0.2, ...]
createdAt: 2024-01-01T00:00:00.000Z
---
```

### Dataview Query Example

```dataview
TABLE type AS "Type", summary AS "Summary"
FROM ""
WHERE id
SORT createdAt DESC
```

## Supported Formats

| Type | Extensions | Processing |
|------|------------|------------|
| Text | - | Direct input |
| Image | jpg, png, gif, webp | Claude Vision |
| Audio | mp3, m4a, wav, webm | Whisper API |
| File | txt, md, csv, json | Text extraction |
| Meeting | txt, md | PRD summary |

## Development

```bash
# Clone
git clone https://github.com/mag123c/meeting-context-hub.git
cd meeting-context-hub

# Install
pnpm install

# Dev mode
pnpm dev

# Build
pnpm build

# Lint
pnpm lint

# Test
pnpm test
```

## Tech Stack

- **CLI**: Commander.js, Inquirer, Chalk, Ora
- **TUI**: Ink (React for CLI)
- **AI**: Claude API (Anthropic), Whisper & Embedding (OpenAI)
- **Storage**: Obsidian (gray-matter for frontmatter)
- **Validation**: Zod

## License

MIT
