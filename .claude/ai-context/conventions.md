# Conventions

## Naming
| Type | Style | Example |
|------|-------|---------|
| files | kebab-case | `add-context.usecase.ts` |
| classes | PascalCase | `AddContextUseCase` |
| interfaces | PascalCase | `AIProvider` |
| functions | camelCase | `extractContext` |
| constants | SCREAMING | `DEFAULT_THRESHOLD` |
| components | PascalCase | `ErrorDisplay.tsx` |
| hooks | camelCase | `useServices.ts` |

## TDD Cycle
```
RED → GREEN → REFACTOR
```
- No impl without test
- Test describes behavior
- Mock external deps (AI, DB)

## Test
```typescript
describe('ExtractService', () => {
  it('should extract context from input', async () => {
    // Arrange → Act → Assert
  });
});
```
Location: `*.test.ts` alongside source
Framework: vitest

## Error
```typescript
throw new AIError(
  ErrorCode.AI_EXTRACTION_FAILED,
  'Failed to extract',
  { recoverable: true, originalError: err }
);
```

## i18n
```typescript
t('menu.title', language)           // Simple
ti('list.subtitle', language, { total: 10 })  // Interpolation
```
Keys: `scope.key` (menu.*, settings.*, detail.*, etc.)

## Commits
```
type(scope): description

types: feat|fix|refactor|docs|test|chore
scopes: tui|core|adapters|config|i18n
```
Example: `feat(core): add context update functionality`
**Note: No Co-Authored-By markers**

## Project Decisions

설계 결정 히스토리는 `.dev/DECISIONS.md` 참조.
새 기능 구현 시 기존 결정과 충돌하지 않는지 확인할 것.
