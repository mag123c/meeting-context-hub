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
| ErrorDisplay | Error message with recovery guidance |
| ErrorText | Inline error text |
| Spinner | Loading indicator |
| ConfirmDialog | Confirmation dialog with keyboard navigation (←/→, Enter, ESC) |
| GroupSelector | Modal for selecting/creating groups with list/create modes |

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
| placeholder | string | '' | Placeholder text |
| focus | boolean | true | Whether input is focused |
| maxDisplayLines | number | 10 | Max visible lines before scroll |

**Key bindings:**
- `Enter` - New line
- `Ctrl+D` - Submit
- `ESC` - Cancel (handled by parent)
- `Arrow keys` - Cursor navigation
- `Backspace` - Delete character/merge lines

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

**Background Check Behavior:**
- `update-notifier` spawns background process on first call
- `updateCheckInterval: 0` ensures check runs every startup
- App polls every 1 second (max 10 attempts) until update info is available
- Typically detects updates within 2 seconds

**Update Screen Flow:**
1. **Normal startup + Update available** → Full-screen update prompt (U to update, Enter to skip)
2. **Error + Update available** → Update-only screen (update may fix the issue)
3. **Error + Checking** → Error screen with "Checking for updates..." spinner
4. **No update** → Directly to MainMenu

### MainMenu Logo

ASCII art logo (6 lines) with version:

```
 ███╗   ███╗  ██████╗ ██╗  ██╗
 ████╗ ████║ ██╔════╝ ██║  ██║
 ██╔████╔██║ ██║      ███████║
 ██║╚██╔╝██║ ██║      ██╔══██║
 ██║ ╚═╝ ██║ ╚██████╗ ██║  ██║
 ╚═╝     ╚═╝  ╚═════╝ ╚═╝  ╚═╝
Meeting Context Hub v2.7.2
```
