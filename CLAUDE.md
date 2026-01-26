# Meeting Context Hub

## Why This Exists (Origin Story)

**The Core Problem:** When working on multiple parallel workstreams (squads, teams, personal projects), it becomes nearly impossible to retain all the granular discussions—policies, direction decisions, conventions, edge cases—that happen across meetings and conversations.

**The Need:** A system that captures only what actually matters for development work (PRD-level summaries, QA criteria, key decisions) and chains them together by relevance, so you can quickly rebuild context when switching between projects.

**Current Challenge:** Most discussions happen verbally. The goal is to record audio and automatically distill it into development-ready artifacts (PRD summaries, action items, QA checklists). This remains the hardest unsolved part.

---

## Project Overview

TUI 기반 컨텍스트 관리 도구. 논의 내용을 입력하면 AI가 개발 Artifact(Decisions, Actions, Policies)를 추출하고, 임베딩 기반으로 관련 컨텍스트를 체이닝합니다.

**핵심 특징:**
- OS 독립적 (macOS, Linux, Windows)
- TUI only (CLI 제거)
- SQLite 로컬 저장
- 환경변수 기반 설정

## Quick Start

```bash
# Set API keys (environment variables)
export ANTHROPIC_API_KEY=sk-ant-xxx
export OPENAI_API_KEY=sk-xxx

# Install and run
pnpm install
pnpm dev
```

## Documentation

| Document | Description |
|----------|-------------|
| `docs/PRD.md` | 제품 요구사항 정의 |
| `docs/ARCHITECTURE.md` | 아키텍처 및 기술 설계 |
| `docs/ROADMAP.md` | 버전별 구현 계획 |

## Architecture

```
┌─────────────┐
│     TUI     │  React + Ink
└──────┬──────┘
       │
┌──────▼──────┐
│  Use Cases  │  비즈니스 로직 조율
└──────┬──────┘
       │
┌──────▼──────┐
│  Services   │  도메인 로직 (Extract, Embed, Chain)
└──────┬──────┘
       │
┌──────▼──────┐
│  Adapters   │  외부 연동 (Claude, OpenAI, SQLite)
└─────────────┘
```

## Directory Structure

```
src/
├── index.tsx           # Entry point
├── tui/                # TUI layer (screens, components, hooks)
├── core/               # Business logic (usecases, services, domain)
├── adapters/           # External dependencies (ai, storage, config)
└── types/              # Shared types + Error system (errors.ts)
```

## Error Handling (v0.4)

MCH uses a centralized error system with:
- **MCHError** base class with `code`, `recoverable`, `originalError`
- **8 error types**: AIError, EmbeddingError, StorageError, TranscriptionError, RecordingError, ConfigError, InputError
- **28 error codes** in ErrorCode enum
- **Bilingual recovery messages** (ko/en)
- **Retry service** with exponential backoff (3 attempts, 1s base delay)
- **ErrorDisplay component** for user-friendly error UI

## AI Context

See `.claude/ai-context/` for detailed knowledge:

| File | Content |
|------|---------|
| `architecture.json` | Layer structure, dependencies |
| `conventions.json` | Naming, code style |
| `domain/context.json` | Domain entities, rules |

## Commands

```bash
pnpm dev          # Run TUI (development)
pnpm build        # Build for production
pnpm test         # Run tests
pnpm lint         # Lint check
```

## Configuration

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-xxx   # Claude API
OPENAI_API_KEY=sk-xxx          # OpenAI (embedding)

# Optional
MCH_DB_PATH=~/.mch/data.db     # Database location
MCH_LANGUAGE=ko                # UI language
```

## Current Status

**v0.4 In Progress** - Error Handling 구현 완료

- [x] 문서 작성 (PRD, Architecture, Roadmap)
- [x] v0.1 구현 (Core TUI + Text Input)
- [x] v0.1.1 구현 (In-App Configuration)
- [x] v0.2 구현 (Search + Chaining)
- [x] v0.3 구현 (Audio Recording)
- [x] v0.4 Error Handling 구현 (Error System + Retry + UX)
- [ ] v0.4 Settings 개선 (언어 선택)
- [ ] v0.4 i18n 완성

## Requirements

- **Node.js** 18+
- **sox** (for audio recording): `brew install sox`
- **Anthropic API Key** (required)
- **OpenAI API Key** (for embedding, whisper)
