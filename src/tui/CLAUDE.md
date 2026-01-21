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
| `Header` | Title + breadcrumb |
| `Menu` | ink-select-input wrapper |
| `Spinner` | Loading state |
| `KeyHint`, `KeyHintBar` | Keyboard shortcuts |
| `ContextCard`, `ContextList` | Context display |
| `RecordingIndicator` | Recording state + timer + chunk progress |

## Hooks

| Hook | Purpose |
|------|---------|
| `useServices` | Access AppServices |
| `useAsyncAction` | Async state management |
| `useNavigation` | Screen navigation |
| `useRecording` | Recording state, timer, chunk tracking |

## Screens

| Screen | Purpose |
|--------|---------|
| `MainMenu` | Add/Search/List/Exit |
| `AddScreen` | Multi-step context add |
| `SearchScreen` | Semantic/exact/tag search |
| `ListScreen` | List + filter + pagination |
| `DetailScreen` | Detail + similar docs |

## Keyboard

| Key | Action |
|-----|--------|
| `↑↓` | Navigate list |
| `←→` | Page navigation |
| `Enter` | Select/confirm |
| `Esc` | Back |
| `q` | Exit (main menu only) |
