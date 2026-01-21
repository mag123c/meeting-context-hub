# Config Layer

Configuration, environment, and secure credential management.

## Structure

| File | Purpose |
|------|---------|
| `config.ts` | Main config loader, Obsidian path resolution |
| `keychain.ts` | macOS Keychain integration (secure API key storage) |
| `env.ts` | Environment variables, defaults |
| `constants.ts` | Application constants |

## Constants

| Object | Keys | Usage |
|--------|------|-------|
| `AI_CONFIG` | `DEFAULT_MODEL`, `MAX_TOKENS` | Claude API settings |
| `SIMILARITY_CONFIG` | `THRESHOLD`, `MAX_RELATED_LINKS` | Related docs linking |
| `STORAGE_CONFIG` | `SHORT_ID_LENGTH`, `MAX_TITLE_LENGTH` | Filename generation |

## Security

### Keychain (keychain.ts)
- Uses `spawnSync` with array arguments (prevents command injection)
- Account name validation: only `[A-Z_]+` allowed
- CLI-only module, no web exposure

```typescript
// Safe: array arguments
spawnSync("security", ["-a", account, "-w", value]);

// Unsafe: string interpolation (removed)
execSync(`security -a "${account}" -w "${value}"`);
```
