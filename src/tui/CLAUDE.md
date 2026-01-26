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
