# Errors

Unified error handling system.

## Hierarchy

```
MCHError (base)
├── NotFoundError
├── ValidationError
├── AIClientError
├── FileSystemError
├── ConfigError
└── APIKeyMissingError
```

## Error Classes

| Error | Code | Purpose |
|-------|------|---------|
| `NotFoundError` | `NOT_FOUND` | Resource not found |
| `ValidationError` | `VALIDATION_ERROR` | Input validation failed |
| `AIClientError` | `AI_CLIENT_ERROR` | AI API call failed |
| `FileSystemError` | `FILE_SYSTEM_ERROR` | File operation failed |
| `ConfigError` | `CONFIG_ERROR` | Config load/validation failed |
| `APIKeyMissingError` | `API_KEY_MISSING` | API key not configured |
