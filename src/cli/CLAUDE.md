# CLI Layer

User input handling and output formatting.

## Structure

| Directory | Purpose |
|-----------|---------|
| `commands/` | CLI commands (add, search, list, config) |
| `utils/` | Spinner, formatters, error handling |

## Key Utils

| Function | Purpose |
|----------|---------|
| `withSpinner(fn, opts)` | Spinner + error wrapper |
| `exitWithError(msg)` | Error output + exit |
| `formatContextMeta(ctx)` | Context save result |
| `formatSearchResult(ctx)` | Search result formatting |
