# Architecture

## Layers
```
TUI[ink] → UseCases → Services → Adapters[AI/DB]
```

## Paths
| Layer | Path | Contents |
|-------|------|----------|
| TUI | src/tui/ | App, screens/, components/, hooks/ |
| UseCases | src/core/usecases/ | add-context, search, list, manage |
| Services | src/core/services/ | extract, embedding, chain, config, retry |
| Domain | src/core/domain/ | context, project |
| Adapters | src/adapters/ | ai/, audio/, storage/, config/ |
| i18n | src/i18n/ | t(), ti(), ~100 strings |

## Data Flow
```
TUI → UseCase → Service → Adapter → Return
```

## Error System
| Class | Purpose |
|-------|---------|
| MCHError | Base (code, recoverable, originalError) |
| AIError | Extraction failures |
| EmbeddingError | Vector generation |
| StorageError | Database ops |

## Skill Chain (ENFORCED)
| Step | Next | Auto |
|------|------|------|
| /clarify | Plan Mode | YES |
| Plan 승인 | /implement | YES |
| /implement | /verify | YES |
| /verify PASS | /review | YES |
| /review PASS | /wrap | YES |

**각 단계 완료 후 확인 없이 즉시 다음 호출**
