# Meeting Context Hub

CLI tool for processing multimodal inputs (text/image/audio/file/meeting) with AI and storing to Obsidian. Tag + embedding for relevance chaining.

## Quick Start

```bash
# Set API keys (macOS keychain)
mch config set ANTHROPIC_API_KEY sk-ant-xxx
mch config set OPENAI_API_KEY sk-xxx

# Install and build
pnpm install && pnpm build

# Use
mch add -t "meeting content..."
mch add -m ./meeting.txt
mch search "keyword"
mch list --tag "meeting"
```

## CLI Commands

```bash
mch add                     # Interactive mode
mch add -t "text"           # Text (Claude tagging)
mch add -i ./image.png      # Image (Claude Vision)
mch add -a ./audio.mp3      # Audio (Whisper)
mch add -f ./data.csv       # File (txt, md, csv, json)
mch add -m ./meeting.txt    # Meeting (PRD summary + Action Items)

mch search "keyword"        # Semantic search (embedding)
mch search --exact "text"   # Exact text match
mch search --similar <id>   # Similar documents

mch list                    # All contexts
mch list --tag "meeting"    # Filter by tag

mch config show             # Show config
mch config set <KEY> <val>  # Set API key
mch config check            # Check API key status
```

## AI Context

See `.claude/ai-context/` for detailed knowledge:

| File | Content |
|------|---------|
| `architecture.json` | Project layers, dependencies |
| `conventions.json` | Naming, commit, code style |
| `testing.json` | Test commands, locations |
| `domain/*.json` | Domain terms, entities, rules |
| `integrations/*.json` | Obsidian, Slack, Notion |

## Skills

| Skill | Purpose |
|-------|---------|
| `/clarify` | Clarify requirements → Plan Mode |
| `/implement` | Full workflow: analyze → implement → verify → commit |
| `/verify` | Build/lint verification with self-healing |
| `/mch-wrap` | Session wrap-up, doc updates |
| `/vs-design` | UI design with mode collapse prevention |

## Module Entry Points

| Module | CLAUDE.md |
|--------|-----------|
| AI clients | `src/ai/CLAUDE.md` |
| CLI layer | `src/cli/CLAUDE.md` |
| TUI layer | `src/tui/CLAUDE.md` |
| Errors | `src/errors/CLAUDE.md` |
| Utils | `src/utils/CLAUDE.md` |
