# GUI Integration Guide

This guide explains how to use the Meeting Context Hub core logic in a GUI application (React, Electron, etc.).

## Architecture Overview

The core module is designed to be UI-agnostic. It provides:

- **Domain**: Pure functions for creating and manipulating entities
- **Services**: Business logic (extract, embed, chain, config)
- **Use Cases**: High-level operations that orchestrate services

```
┌─────────────────────┐
│     Your GUI        │  (React, Electron, etc.)
└──────────┬──────────┘
           │
           │  import from 'meeting-context-hub/core'
           │
┌──────────▼──────────┐
│    Core Module      │  UI-agnostic business logic
├─────────────────────┤
│  - Use Cases        │
│  - Services         │
│  - Domain           │
└──────────┬──────────┘
           │
           │  Dependency Injection
           │
┌──────────▼──────────┐
│     Adapters        │  External integrations
├─────────────────────┤
│  - Claude API       │
│  - OpenAI API       │
│  - SQLite Storage   │
└─────────────────────┘
```

## Installation

```bash
npm install meeting-context-hub
# or
pnpm add meeting-context-hub
```

## Basic Usage

### 1. Import Core Module

```typescript
import {
  // Use Cases
  AddContextUseCase,
  ListContextsUseCase,
  SearchContextUseCase,
  ManageProjectUseCase,
  GetContextUseCase,
  RecordContextUseCase,

  // Services
  ConfigService,
  ExtractService,
  EmbeddingService,
  ChainService,

  // Domain
  createContext,
  createProject,

  // Types
  type AddContextInput,
  type AddContextResult,
  type ListContextsResult,
  type SearchContextResult,
} from 'meeting-context-hub/core';
```

### 2. Initialize Adapters

Adapters are injected into use cases to handle external dependencies:

```typescript
import { ClaudeAdapter } from 'meeting-context-hub/adapters/ai';
import { OpenAIAdapter } from 'meeting-context-hub/adapters/ai';
import { SQLiteAdapter } from 'meeting-context-hub/adapters/storage';

// Initialize adapters
const aiAdapter = new ClaudeAdapter(process.env.ANTHROPIC_API_KEY);
const embeddingAdapter = new OpenAIAdapter(process.env.OPENAI_API_KEY);
const storageAdapter = new SQLiteAdapter('/path/to/db.sqlite');
```

### 3. Initialize Services

```typescript
const extractService = new ExtractService(aiAdapter);
const embeddingService = new EmbeddingService(embeddingAdapter);
const chainService = new ChainService(storageAdapter);
const configService = new ConfigService();
```

### 4. Initialize Use Cases

```typescript
const addContextUseCase = new AddContextUseCase({
  extractService,
  embeddingService,
  chainService,
  storageAdapter,
});

const listContextsUseCase = new ListContextsUseCase(storageAdapter);
const searchContextUseCase = new SearchContextUseCase(storageAdapter, embeddingService);
const manageProjectUseCase = new ManageProjectUseCase(storageAdapter);
const getContextUseCase = new GetContextUseCase(storageAdapter);
```

### 5. Use in Your GUI

```typescript
// React example
function AddContextForm() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await addContextUseCase.execute({
        rawInput: input,
        projectId: null,
      });
      console.log('Context added:', result.context);
    } catch (error) {
      console.error('Failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter meeting notes..."
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Add Context'}
      </button>
    </form>
  );
}
```

## Available Exports

### Use Cases

| Class | Description |
|-------|-------------|
| `AddContextUseCase` | Add new context with AI extraction |
| `ListContextsUseCase` | List contexts with pagination |
| `SearchContextUseCase` | Search contexts by keyword or semantic similarity |
| `ManageProjectUseCase` | CRUD operations for projects |
| `GetContextUseCase` | Get single context by ID |
| `RecordContextUseCase` | Record audio and transcribe to context |

### Services

| Class | Description |
|-------|-------------|
| `ExtractService` | Extract insights from text using AI |
| `EmbeddingService` | Generate embeddings for semantic search |
| `ChainService` | Find related contexts |
| `ConfigService` | Manage application configuration |

### Domain Functions

| Function | Description |
|----------|-------------|
| `createContext(input)` | Create a new Context entity |
| `createProject(name, description?)` | Create a new Project entity |
| `formatContextPreview(context)` | Format context for display |
| `validateProjectName(name)` | Validate project name |

### Types

```typescript
interface AddContextInput {
  rawInput: string;
  projectId?: string | null;
}

interface AddContextResult {
  context: Context;
  relatedContexts: SearchResult[];
}

interface ListContextsResult {
  contexts: Context[];
  total: number;
}

interface SearchContextResult {
  results: SearchResult[];
  method: 'semantic' | 'keyword' | 'hybrid';
}
```

## Configuration

### Using ConfigService

```typescript
const configService = new ConfigService();

// Get current config
const config = configService.getConfig();

// Get config status (with masked keys)
const status = configService.getConfigStatus();

// Set language
await configService.setConfigValue('language', 'en');

// Set API key
await configService.setApiKey('anthropic', 'sk-ant-...');
```

## i18n Support

Use the i18n module for internationalization:

```typescript
import { t, ti } from 'meeting-context-hub/i18n';

// Simple translation
const backLabel = t('common.back', 'en'); // "Back"

// Translation with interpolation
const subtitle = ti('list.subtitle', 'ko', {
  total: 10,
  page: 1,
  totalPages: 2,
}); // "총 10개 | 페이지 1/2"
```

## Error Handling

All core operations may throw `MCHError` or its subclasses:

```typescript
import { MCHError, AIError, StorageError } from 'meeting-context-hub/types';

try {
  await addContextUseCase.execute({ rawInput: '...' });
} catch (error) {
  if (error instanceof AIError) {
    // Handle AI-related errors
    console.error('AI Error:', error.code, error.recoverable);
  } else if (error instanceof StorageError) {
    // Handle storage errors
    console.error('Storage Error:', error.code);
  }
}
```

## Verifying Core Independence

The core module should not depend on any UI framework (ink, react for UI, etc.).

Run the verification script:

```bash
pnpm verify:core
```

This ensures no `ink` or `react` imports exist in the core directory.
