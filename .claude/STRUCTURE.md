# AI Context Structure Rules

> This document defines the rules for the `.claude/` directory structure.

## Core Principles

### 1. Knowledge/Behavior Separation (Boris Principle)

| Type | Directory | Role | Format |
|------|-----------|------|--------|
| **Knowledge** | `ai-context/` | Information AI should reference | JSON |
| **Behavior** | `skills/` | Workflows AI should execute | SKILL.md |

### 2. Layer Responsibility Separation (DRY Principle)

| Layer | Location | Responsibility | No Duplication |
|-------|----------|----------------|----------------|
| **Root** | `.claude/` | Project-wide common | - |
| **Module** | `src/{module}/CLAUDE.md` | Module-specific only | Do not redefine root info |

### 3. Selective Loading (Kurly OMS Principle)

- CLAUDE.md is the only entry point
- Load only required documents based on task type
- Consider token efficiency

---

## Directory Structure

```
project-root/
├── CLAUDE.md                     # Project router (entry point)
├── .claude/
│   ├── STRUCTURE.md              # This document (structure rules)
│   ├── ai-context/               # Knowledge (global)
│   │   ├── CLAUDE.md             # Directory explanation
│   │   ├── architecture.json     # Layers, dependencies, external APIs
│   │   ├── conventions.json      # Coding style, commit rules
│   │   ├── testing.json          # Test commands, locations
│   │   ├── domain/               # Domain knowledge
│   │   │   ├── glossary.json     # Terms, constants
│   │   │   ├── entities.json     # Entity relationships
│   │   │   └── rules.json        # Business rules
│   │   └── integrations/         # External integrations
│   │       ├── obsidian.json     # Obsidian storage
│   │       ├── slack.json        # Slack sync
│   │       └── notion.json       # Notion sync
│   ├── skills/                   # Behaviors (shared)
│   │   ├── clarify/SKILL.md      # Requirements clarification
│   │   ├── implement/SKILL.md    # Implementation workflow
│   │   ├── verify/SKILL.md       # Build/lint verification
│   │   ├── mch-wrap/SKILL.md     # Session wrap-up
│   │   └── vs-design/SKILL.md    # UI design workflow
│   └── settings.local.json       # (ignored) Local settings
│
└── src/
    └── {module}/CLAUDE.md        # Module-specific entry points
```

---

## Layer Responsibilities

### Root Layer (.claude/)

**Purpose**: Information common across the entire project

| File | Content | Example |
|------|---------|---------|
| `architecture.json` | Layers, dependencies, external APIs | `"cli": {"path": "src/cli/"}` |
| `conventions.json` | Coding style, naming, commit rules | `"commit.types": ["feat", "fix"]` |
| `testing.json` | Test commands, locations | `"commands.test": "pnpm test"` |
| `skills/` | Workflows usable in all contexts | clarify, implement, verify |

### Module Layer (src/{module}/CLAUDE.md)

**Purpose**: Module-specific information only (no root redefinition)

| Content | Description |
|---------|-------------|
| Module purpose | Brief description |
| Directory structure | Subdirectories and their purposes |
| Key interfaces | Important types/interfaces |
| Usage patterns | Example code snippets |

---

## Prohibited Patterns

### 1. No Root Info Redefinition

```
# Wrong: Redefining architecture in module CLAUDE.md
src/ai/CLAUDE.md:
  ## Architecture (already in root)

# Correct: Module-specific info only
src/ai/CLAUDE.md:
  ## AI Interfaces (module-specific)
```

### 2. No Skills in Module Layer

```
# Wrong
src/ai/.claude/skills/  # Module-level skills not allowed

# Correct
.claude/skills/         # All skills at root level
```

### 3. No Knowledge Files Outside ai-context

```
# Wrong
.claude/common/         # Ambiguous name
.claude/testing/        # Outside ai-context

# Correct
.claude/ai-context/     # All knowledge files here
```

---

## References

- [Kurly OMS Case Study](https://helloworld.kurly.com/blog/oms-claude-ai-workflow): Selective loading, hierarchical structure
- [Boris Workflow](https://x.com/bcherny/status/2007179832300581177): Knowledge/behavior separation, skill chaining
