# TUI Layer

Interactive TUI using ink (React for CLI).

## Structure

| Directory | Purpose |
|-----------|---------|
| `components/` | Reusable UI components |
| `screens/` | Screen-level components |
| `hooks/` | Custom React hooks |

## Entry Point

- `mch` (no args) → TUI main menu
- `mch add/search/list` → Traditional CLI

## Components

| Component | Purpose |
|-----------|---------|
| `Header` | Title + breadcrumb (responsive width) |
| `Banner` | ASCII logo + version (responsive width) |
| `Menu` | ink-select-input wrapper |
| `Spinner` | Loading state |
| `KeyHint`, `KeyHintBar` | Keyboard shortcuts (responsive width) |
| `ContextCard`, `ContextList` | Context display |
| `RecordingIndicator` | Recording state + timer + chunk progress |
| `ErrorBoundary` | Error catching boundary for TUI |
| `ApiKeyPrompt` | Prompt when required API keys missing |
| `AutocompleteInput` | File path autocomplete with @/~/absolute triggers |
| `UpdatePrompt`, `UpdateBanner` | Version update UI |

### Terminal Width Awareness

Components use `useStdout()` to get terminal width for responsive UI:
- Horizontal separators (─) fill terminal width
- Fallback: 80 columns if stdout unavailable

## Hooks

| Hook | Purpose |
|------|---------|
| `useServices` | Access AppServices |
| `useAsyncAction` | Async state management |
| `useNavigation` | Screen navigation |
| `useRecording` | Recording state, timer, chunk tracking, saveAndCleanup |
| `useTranslation` | i18n context (t, language, setLanguage, formatDate, formatDateTime) |
| `useApiKeyGuard` | API key validation before screen navigation |
| `useFileCompletion` | File/directory path completion with extension filtering |
| `useDropDetection` | Drag-and-drop path detection and normalization |

## API Key Guard

Screens requiring API keys are protected by `useApiKeyGuard` hook.

| Screen | Required Keys |
|--------|---------------|
| `add` | Anthropic + OpenAI |
| `search` (semantic) | OpenAI |

**Flow:** Navigate → Guard checks keys → Missing? → Show `ApiKeyPrompt` → Go to Config

## Screens

| Screen | Purpose |
|--------|---------|
| `MainMenu` | Add/Search/List/Config/Exit |
| `AddScreen` | Multi-step context add (with recording save) |
| `SearchScreen` | Semantic/exact/tag search |
| `ListScreen` | List + filter + pagination |
| `DetailScreen` | Detail + similar docs |
| `ConfigScreen` | API keys, vault path, language settings |

### ConfigScreen

- **API Keys**: Anthropic/OpenAI (stored in macOS Keychain)
- **Vault Path**: Obsidian vault location (stored in `~/.config/mch/config.json`)
  - Validates directory exists
  - Supports `~` expansion
  - Disabled when set via `OBSIDIAN_VAULT_PATH` env
- **Language**: English/Korean selection

## Keyboard

| Key | Action |
|-----|--------|
| `↑↓` | Navigate list |
| `←→` | Page navigation |
| `Enter` | Select/confirm |
| `Esc` | Back |
| `q` | Exit (main menu only) |

## Internationalization (i18n)

All TUI components use the i18n system via `useTranslation` hook from `src/i18n/`.

```typescript
const { t, language, setLanguage, formatDate, formatDateTime } = useTranslation();

// Access translations
<Text>{t.mainMenu.addContext}</Text>

// Format dates (locale-aware)
<Text>{formatDate(context.createdAt)}</Text>

// Change language (persists to ~/.config/mch/preferences.json)
setLanguage("ko");
```

**Supported Languages:** English (`en`), Korean (`ko`)

**Environment Override:** `MCH_LANGUAGE=ko mch` forces Korean regardless of stored preference.
