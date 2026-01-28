# TUI Module

Terminal User Interface built with React + Ink.

## Structure

```
tui/
├── App.tsx          # Root component, routing
├── screens/         # Full-screen components
├── components/      # Reusable UI elements
└── hooks/           # Custom React hooks
```

## i18n Usage

All screens use the i18n module for bilingual support:

```typescript
import { t, ti } from '../../i18n/index.js';

// Simple translation
<Text>{t('menu.title', language)}</Text>

// With interpolation
<Text>{ti('list.subtitle', language, { total, page, totalPages })}</Text>
```

## Language State

Language is passed through props from App.tsx:

```typescript
interface ScreenProps {
  language: 'ko' | 'en';
  // ...
}
```

## Screen Navigation

Screens call `onBack()` or `onNavigate()` to change routes:

```typescript
interface ScreenProps {
  onBack: () => void;
  onNavigate?: (screen: string, params?: object) => void;
}
```

## Error Display

Use ErrorDisplay component for error states:

```typescript
import { ErrorDisplay } from '../components/ErrorDisplay.js';

{error && (
  <ErrorDisplay
    error={error}
    language={language}
    onRetry={handleRetry}
    onDismiss={() => setError(null)}
  />
)}
```

## Key Components

| Component | Purpose |
|-----------|---------|
| SectionBox | Consistent bordered section container |
| MultilineInput | Multiline text input with line numbers |
| FilePathInput | Single-line file path input with Tab autocomplete |
| ErrorDisplay | Error message with recovery guidance |
| ErrorText | Inline error text |
| Spinner | Loading indicator |
| ConfirmDialog | Confirmation dialog with keyboard navigation (←/→, Enter, ESC) |
| GroupSelector | Modal for selecting/creating groups with list/create modes |
| StringListEditor | List editor for string[] arrays (decisions, policies, tags) with a/d/Enter/ESC shortcuts |

## SectionBox Component

Reusable box component for consistent UI styling across screens:

```typescript
import { SectionBox } from '../components/SectionBox.js';

<SectionBox title="Decisions" color="green">
  {decisions.map(d => <Text key={d}>• {d}</Text>)}
</SectionBox>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string? | - | Optional section header |
| color | string | 'gray' | Border and title color |
| borderStyle | string | 'round' | Box border style |
| marginY | number | 1 | Vertical margin |
| paddingX | number | 1 | Horizontal padding |

**Color conventions:**
- `cyan` - Default sections, navigation
- `green` - Decisions, success
- `yellow` - Action items, warnings
- `blue` - Policies
- `magenta` - Questions
- `gray` - Hints, secondary info

## MultilineInput Component

Multiline text input with line numbers, cursor navigation, and paste support:

```typescript
import { MultilineInput } from '../components/MultilineInput.js';

<MultilineInput
  value={text}
  onChange={setText}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  placeholder="Enter text..."
  focus={true}
  maxDisplayLines={10}
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | string | - | Current text value |
| onChange | (value: string) => void | - | Text change handler |
| onSubmit | () => void | - | Submit handler (Ctrl+D) |
| onCancel | () => void | - | Cancel handler (ESC) |
| onTabComplete | () => void | - | Tab key handler (mode switch) |
| placeholder | string | '' | Placeholder text |
| focus | boolean | true | Whether input is focused |
| maxDisplayLines | number | 10 | Max visible lines before scroll |

**Key bindings:**
- `Enter` - New line
- `Ctrl+D` - Submit
- `ESC` - Cancel (handled by parent)
- `Tab` - Mode switch (calls onTabComplete)
- `Arrow keys` - Cursor navigation
- `Backspace` - Delete character/merge lines

## StringListEditor Component

Component for editing string[] arrays (decisions, policies, tags):

```typescript
import { StringListEditor } from '../components/StringListEditor.js';

<StringListEditor
  items={decisions}
  onChange={setDecisions}
  onDone={handleSave}
  language={language}
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| items | string[] | - | Array of strings to edit |
| onChange | (items: string[]) => void | - | Change handler |
| onDone | () => void | - | Done handler (ESC in list mode) |
| language | 'ko' \| 'en' | 'en' | UI language |
| focus | boolean | true | Whether input is focused |

**Key bindings (list mode):**
- `↑/↓` - Navigate items
- `Enter` - Edit selected item
- `a` - Add new item
- `d` - Delete selected item
- `ESC` - Done (calls onDone)

**Key bindings (edit/add mode):**
- `Enter` - Save and return to list
- `ESC` - Cancel and return to list

## Edit Mode (DetailScreen)

DetailScreen supports inline editing of context fields:

**Activation:** Press `e` key in DetailScreen

**Editable fields:**
- Title (single line TextInput)
- Summary (MultilineInput)
- Decisions (StringListEditor)
- Policies (StringListEditor)
- Tags (StringListEditor)

**Flow:**
1. Press `e` → Field selection menu
2. Select field → Edit UI for that field type
3. Save (Enter/Ctrl+D) or Cancel (ESC)
4. Returns to DetailScreen with updated data

**Features:**
- Embedding regeneration on save (if EmbeddingService available)
- Bilingual UI (ko/en)
- Consistent keyboard shortcuts

## Version & Update

### Version Module (`src/version.ts`)

Provides version info with path resolution for both `src/` and `dist/`:

```typescript
import { VERSION, PACKAGE_NAME } from '../version.js';

// VERSION: "2.7.2"
// PACKAGE_NAME: "meeting-context-hub"
```

### Update Banner (`src/tui/components/UpdateBanner.tsx`)

Shows update notification. Press `U` to update, `Enter` to skip (when dismissible):

```typescript
import { UpdateBanner } from '../components/UpdateBanner.js';

<UpdateBanner
  currentVersion={updateInfo.current}
  latestVersion={updateInfo.latest}
  updateCommand={getUpdateCommand()}
  onDismiss={() => setUpdateDismissed(true)}  // Optional: enables Enter to skip
/>
```

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| currentVersion | string | Yes | Current installed version |
| latestVersion | string | Yes | Latest available version |
| updateCommand | string | Yes | npm command to run update |
| onDismiss | () => void | No | Callback when user presses Enter to skip |

**States:**
- Default: Shows version diff + "Press U to update" (+ "Enter to skip" if onDismiss provided)
- Updating: Shows "Updating..."
- Success: Shows "Updated! Press Ctrl+C and run `mch` to restart"
- Error: Shows error + manual command

**Update Logic (`performUpdate()` in `utils/update-notifier.ts`):**
1. Try `npm install -g meeting-context-hub@latest`
2. If failed (e.g., ENOTEMPTY) → `npm uninstall -g` then reinstall
3. Return `{ success, error? }` for UI handling

**Update Check Behavior:**

| Scenario | Behavior |
|----------|----------|
| Cached update exists | Instant display (no loading) via `getCachedUpdateInfo()` |
| No cache | Background check + polling (max 10s) via `checkForUpdates()` |

- `getCachedUpdateInfo()`: Reads cache synchronously (24h interval, no trigger)
- `checkForUpdates()`: Triggers background check (interval: 0)
- useState initializers read cache for instant startup

**Update Screen Flow:**
1. **Normal startup + Update available** → Full-screen update prompt (U to update, Enter to skip)
2. **Error + Update available** → Update-only screen (update may fix the issue)
3. **Error + Checking** → Error screen with "Checking for updates..." spinner
4. **No update** → Directly to MainMenu

### MainMenu Logo

ASCII art logo (18 lines) - MEETING / CONTEXT / HUB in bitmap style, version centered below.
