# Meeting Context Hub

> TUI tool for managing meeting contexts with AI extraction and semantic chaining

## Why This Exists

When working on multiple parallel workstreams (squads, teams, personal projects), it becomes nearly impossible to retain all the granular discussions—policies, direction decisions, conventions, edge cases—that happen across meetings and conversations.

**MCH captures what matters for development work and chains them together by relevance**, so you can quickly rebuild context when switching between projects.

## Features

- **AI Extraction**: Automatically extract decisions, action items, and policies from meeting notes
- **Local Whisper**: Free, offline speech-to-text using local Whisper model
- **Semantic Search**: Find related contexts using embedding-based similarity
- **Context Chaining**: Automatically link related discussions
- **Project Organization**: Group contexts by squad, team, or project

## Requirements

| Requirement | macOS/Linux | Windows |
|-------------|-------------|---------|
| Node.js 20+ | ✅ | ✅ |
| sox | ✅ | ✅ |
| GNU Make | ❌ | ✅ [Download](https://gnuwin32.sourceforge.net/packages/make.htm) |

## Status

**v2.0.0-alpha** - Complete redesign in progress

See [ROADMAP](./docs/ROADMAP.md) for implementation plan.

## Quick Start

```bash
# Set API keys
export ANTHROPIC_API_KEY=sk-ant-xxx
export OPENAI_API_KEY=sk-xxx  # Optional: fallback for Whisper API

# Install dependencies
pnpm install

# Download Whisper model (first time only, ~142MB for base)
npx whisper-node download

# Run (TUI)
pnpm dev
```

## Documentation

| Document | Description |
|----------|-------------|
| [PRD](./docs/PRD.md) | Product requirements |
| [Architecture](./docs/ARCHITECTURE.md) | Technical design |
| [Roadmap](./docs/ROADMAP.md) | Implementation plan |

## Configuration

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-xxx   # Claude API (context extraction)

# Optional
OPENAI_API_KEY=sk-xxx          # OpenAI - Whisper API fallback & semantic search (Embedding)
MCH_DB_PATH=~/.mch/data.db     # Database location
MCH_LANGUAGE=en                # UI language: 'ko' or 'en' (default: 'en')
MCH_TRANSCRIPTION_MODE=auto    # 'local' | 'api' | 'auto' (default: 'auto')
```

### Transcription Modes

| Mode | Description |
|------|-------------|
| `local` | Local Whisper only (free, offline) |
| `api` | OpenAI Whisper API only |
| `auto` | Local first, fallback to API on failure (default) |

> **Note**: Local Whisper is used by default. OpenAI API key is only required for semantic search and API fallback.

## Tech Stack

- **UI**: React + Ink (TUI)
- **AI**: Claude (extraction), OpenAI (embedding)
- **Speech-to-Text**: Local Whisper (whisper-node) / OpenAI Whisper API (fallback)
- **Storage**: SQLite
- **Language**: TypeScript

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

## License

MIT
