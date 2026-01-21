# CLI Layer

User input handling and output formatting.

## Structure

| Directory | Purpose |
|-----------|---------|
| `commands/` | CLI commands (add, search, list, config, migrate) |
| `utils/` | Spinner, formatters, error handling |

## Commands

| Command | File | Purpose |
|---------|------|---------|
| `add` | `add.command.ts` | Add context with options (--project, --category) |
| `search` | `search.command.ts` | Semantic/exact search |
| `list` | `list.command.ts` | List with filters (--project, --category) |
| `config` | `config.command.ts` | API key management |
| `migrate` | `migrate.command.ts` | Legacy file migration to hierarchy |

## Key Utils

| Function | Purpose |
|----------|---------|
| `withSpinner(fn, opts)` | Spinner + error wrapper |
| `exitWithError(msg)` | Error output + exit |
| `formatContextMeta(ctx)` | Context save result |
| `formatSearchResult(ctx)` | Search result formatting |
