# Core Layer

Business logic: UseCases, Services, and DI factories.

## Structure

| File | Purpose |
|------|---------|
| `add-context.usecase.ts` | Add context with AI tagging, summarization, hierarchy |
| `search-context.usecase.ts` | Semantic and exact search |
| `summarize-meeting.usecase.ts` | Meeting transcript processing |
| `hierarchy.service.ts` | AI-powered hierarchy classification |
| `migrate-hierarchy.usecase.ts` | Legacy file migration |
| `factories.ts` | DI container, service wiring |

## HierarchyService

Manages Project > Category hierarchy for contexts.

```typescript
// AI classification
const placement = await hierarchyService.classify(content, tags, type);
// → { project: "ProjectA", category: "Backend", confidence: 0.85 }

// Folder management
await hierarchyService.ensureFolderPath("ProjectA", "Backend");

// Cache operations
const projects = await hierarchyService.getProjects();
```

**Cache file:** `vault/mch/hierarchy.json`

## Migration

Move legacy root-level files to hierarchy structure:

```bash
mch migrate --preview        # Count files
mch migrate --dry-run        # Preview changes
mch migrate --to-uncategorized  # Quick migration
mch migrate                  # AI classification
```

## DI Pattern

Services injected via `factories.ts`:

```typescript
const services = createServices();
// services.hierarchyService
// services.addContextUseCase
// services.summarizeMeetingUseCase
```
