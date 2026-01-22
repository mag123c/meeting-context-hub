# Config Layer

Configuration, environment, and secure credential management.

## Structure

| File | Purpose |
|------|---------|
| `config.ts` | Main config loader, Obsidian path resolution, validation |
| `keychain.ts` | macOS Keychain integration (secure API key storage) |
| `env.ts` | Environment variables, defaults |
| `storage.ts` | Config file persistence (`~/.config/mch/config.json`) |
| `constants.ts` | Application constants |
| `api-key-check.ts` | Non-throwing API key availability check |

## Vault Path Resolution

**Priority:** `OBSIDIAN_VAULT_PATH` env > stored config > default (`~/Documents/mch`)

| Function | Purpose |
|----------|---------|
| `getStoredVaultPath()` | Read vault path from config.json |
| `setStoredVaultPath(path)` | Save vault path to config.json |
| `isVaultPathFromEnv()` | Check if set via environment variable |

**Config file:** `~/.config/mch/config.json`

```json
{ "vaultPath": "/path/to/vault" }
```

## API Key Check (api-key-check.ts)

Non-throwing utility to check API key availability before operations.

| Function | Returns | Purpose |
|----------|---------|---------|
| `getApiKeyStatus()` | `ApiKeyStatus` | Get availability of all API keys |
| `hasRequiredKeys(providers)` | `boolean` | Check if all required keys are available |
| `getMissingKeys(providers)` | `ApiKeyProvider[]` | Get list of missing keys |

```typescript
type ApiKeyProvider = "anthropic" | "openai";
interface ApiKeyStatus { anthropic: boolean; openai: boolean; }
```

**Usage:** Used by TUI `useApiKeyGuard` hook to validate screen access.

## Constants

| Object | Keys | Usage |
|--------|------|-------|
| `AI_CONFIG` | `DEFAULT_MODEL`, `MAX_TOKENS` | Claude API settings |
| `SIMILARITY_CONFIG` | `THRESHOLD`, `MAX_RELATED_LINKS` | Related docs linking |
| `STORAGE_CONFIG` | `SHORT_ID_LENGTH`, `MAX_TITLE_LENGTH` | Filename generation |

## Validation Functions

| Function | Purpose |
|----------|---------|
| `validateApiKeyFormat()` | Check API key format (throws `APIKeyFormatError`) |
| `validateConfig()` | Validate entire config, returns `ConfigValidationResult` |
| `loadAndValidateConfig()` | Load + validate, throws `ConfigError` if invalid |

### Validation Checks

- **Anthropic API key**: Must start with `sk-ant-`, length > 20
- **OpenAI API key**: Must start with `sk-` (not `sk-ant-`), length > 20
- **Obsidian vault path**: Must exist on filesystem

### ConfigValidationResult

```typescript
interface ConfigValidationResult {
  valid: boolean;
  issues: string[];  // Descriptive messages
}
```

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
