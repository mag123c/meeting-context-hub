# i18n Module

Internationalization module for Meeting Context Hub. Provides bilingual UI strings (Korean/English).

## API

### t(key, lang)

Simple translation lookup.

```typescript
import { t } from './index.js';

t('menu.title', 'ko');  // "Meeting Context Hub"
t('common.back', 'en'); // "Back"
```

### ti(key, lang, params)

Translation with parameter interpolation.

```typescript
import { ti } from './index.js';

ti('list.subtitle', 'ko', { total: 10, page: 1, totalPages: 2 });
// "총 10개 | 페이지 1/2"
```

## Adding New Strings

1. Add to `strings.ts`:
```typescript
export const UI_STRINGS = {
  // ... existing strings
  'scope.newKey': { ko: '한국어', en: 'English' },
} as const;
```

2. Use dot notation: `scope.key` (e.g., `menu.title`, `settings.language`)

3. For interpolation, use `{paramName}` placeholder:
```typescript
'list.subtitle': { ko: '총 {total}개 | 페이지 {page}/{totalPages}', en: '...' }
```

## String Organization

| Scope | Description |
|-------|-------------|
| common | Shared strings (back, cancel, save, etc.) |
| hint | Navigation hints (ESC, Enter, arrows) |
| menu | Main menu items |
| settings | Settings screen |
| add | Add context screen |
| list | List screen |
| search | Search screen |
| detail | Detail screen |
| edit | Edit mode and field editing (title, summary, decisions, policies, tags) |
| project | Group management (UI term: "Group", entity: "Project") |
| record | Recording screen |
| dialog | Confirmation dialogs and modals (delete, group change) |

## Type Safety

`StringKey` type ensures only valid keys are used:

```typescript
import type { StringKey } from './strings.js';

const key: StringKey = 'menu.title'; // OK
const invalid: StringKey = 'invalid.key'; // Type error
```
