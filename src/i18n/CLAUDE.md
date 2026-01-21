# i18n Layer

Internationalization system for multi-language support in TUI.

## Structure

| File | Purpose |
|------|---------|
| `types.ts` | Type definitions (SupportedLanguage, Translations, LanguageOption) |
| `context.tsx` | React Context (I18nProvider, useTranslation hook) |
| `storage.ts` | Language preference persistence |
| `index.ts` | Public exports |
| `locales/en.ts` | English translations (default) |
| `locales/ko.ts` | Korean translations |
| `locales/index.ts` | Locale registry |

## Supported Languages

| Code | Language |
|------|----------|
| `en` | English (default) |
| `ko` | Korean |

## Usage

```typescript
import { useTranslation } from "../i18n/index.js";

function MyComponent() {
  const { t, language, setLanguage, formatDate, formatDateTime } = useTranslation();

  return (
    <>
      <Text>{t.mainMenu.addContext}</Text>
      <Text>{formatDate(context.createdAt)}</Text>
    </>
  );
}
```

## Translation Structure

```typescript
t.common.*        // Common strings (back, cancel, select, etc.)
t.mainMenu.*      // Main menu strings
t.config.*        // Config screen strings
t.add.*           // Add screen strings
t.search.*        // Search screen strings
t.list.*          // List screen strings
t.detail.*        // Detail screen strings
t.errors.*        // Error messages
t.recording.*     // Recording indicator strings
t.contextCard.*   // Context card strings
```

## Language Persistence

**Storage Location:** `~/.config/mch/preferences.json`

**Environment Override:** `MCH_LANGUAGE=ko` (overrides stored preference)

**Priority:**
1. `MCH_LANGUAGE` environment variable
2. Stored preference in `preferences.json`
3. Default (`en`)

## Adding New Languages

1. Create `src/i18n/locales/{lang}.ts` based on `en.ts`
2. Add language code to `SupportedLanguage` type in `types.ts`
3. Add to `LANGUAGE_OPTIONS` array in `types.ts`
4. Import and register in `locales/index.ts`
5. TypeScript will flag any missing translation keys

## Key Conventions

- Use nested object structure: `scope.subsection.key`
- Use placeholders for dynamic values: `{count}`, `{query}`, `{filterType}`
- Replace placeholders in component: `t.search.noResults.replace("{query}", query)`
