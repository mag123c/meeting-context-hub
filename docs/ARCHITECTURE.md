# Meeting Context Hub - Architecture

## Overview

MCH는 Clean Architecture 원칙을 따르는 TUI 애플리케이션입니다. 핵심 비즈니스 로직은 외부 의존성과 분리되어 있으며, 향후 GUI로 쉽게 전환할 수 있는 구조입니다.

---

## Layer Structure

```
┌─────────────────────────────────────────┐
│                 TUI                      │
│            (React + Ink)                 │
│  - Screens (화면 컴포넌트)               │
│  - Components (재사용 UI)                │
│  - Hooks (상태 및 서비스 연결)           │
└─────────────────┬───────────────────────┘
                  │ uses
┌─────────────────▼───────────────────────┐
│              Use Cases                   │
│  - AddContextUseCase                     │
│  - SearchContextUseCase                  │
│  - ListContextsUseCase                   │
│  - ManageProjectUseCase                  │
└─────────────────┬───────────────────────┘
                  │ uses
┌─────────────────▼───────────────────────┐
│              Services                    │
│  - ExtractService (AI → Artifact)        │
│  - EmbeddingService (텍스트 → 벡터)      │
│  - ChainService (유사도 계산)            │
└─────────────────┬───────────────────────┘
                  │ uses
┌─────────────────▼───────────────────────┐
│              Adapters                    │
│  ┌─────────┐ ┌─────────┐ ┌───────────┐  │
│  │   AI    │ │ Storage │ │  Config   │  │
│  │ Claude  │ │ SQLite  │ │   Env     │  │
│  │ OpenAI  │ │         │ │           │  │
│  └─────────┘ └─────────┘ └───────────┘  │
└─────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility | Dependencies |
|-------|----------------|--------------|
| TUI | 사용자 인터페이스, 입출력 | Use Cases |
| Use Cases | 비즈니스 로직 조율 | Services |
| Services | 핵심 도메인 로직 | Adapters (interfaces) |
| Adapters | 외부 시스템 연결 | External Libraries |

---

## Directory Structure

```
src/
├── index.tsx                   # Entry point
│
├── tui/                        # TUI Layer
│   ├── App.tsx                 # Root component
│   ├── screens/                # Screen components
│   │   ├── MainMenu.tsx        # 메인 메뉴
│   │   ├── AddContext.tsx      # 컨텍스트 추가
│   │   ├── RecordScreen.tsx    # 녹음
│   │   ├── SearchScreen.tsx    # 검색
│   │   ├── ListScreen.tsx      # 목록
│   │   ├── DetailScreen.tsx    # 상세 보기
│   │   ├── ProjectScreen.tsx   # 프로젝트 관리
│   │   └── SettingsScreen.tsx  # 설정
│   ├── components/             # Reusable components
│   │   ├── Header.tsx
│   │   ├── ContextCard.tsx
│   │   ├── TextInput.tsx
│   │   └── Spinner.tsx
│   └── hooks/                  # Custom hooks
│       ├── useNavigation.ts
│       └── useServices.ts
│
├── core/                       # Business Logic (Pure)
│   ├── usecases/               # Application use cases
│   │   ├── add-context.usecase.ts
│   │   ├── search-context.usecase.ts
│   │   ├── list-contexts.usecase.ts
│   │   ├── get-context.usecase.ts
│   │   ├── record-context.usecase.ts
│   │   └── manage-project.usecase.ts
│   ├── services/               # Domain services
│   │   ├── extract.service.ts
│   │   ├── embedding.service.ts
│   │   ├── chain.service.ts
│   │   └── config.service.ts
│   └── domain/                 # Domain entities
│       ├── context.ts
│       └── project.ts
│
├── adapters/                   # External Dependencies
│   ├── ai/                     # AI providers
│   │   ├── ai.interface.ts     # Port interface
│   │   ├── claude.adapter.ts   # Claude implementation
│   │   └── openai.adapter.ts   # OpenAI embedding
│   ├── audio/                  # Audio processing
│   │   ├── whisper.adapter.ts  # Whisper transcription
│   │   └── recording.adapter.ts # Sox recording
│   ├── storage/                # Data persistence
│   │   ├── storage.interface.ts
│   │   └── sqlite.adapter.ts
│   └── config/                 # Configuration
│       ├── env.adapter.ts
│       ├── file-config.adapter.ts
│       └── config.interface.ts
│
└── types/                      # Shared Types
    └── index.ts
```

---

## Domain Model

### Context Entity

```typescript
interface Context {
  id: string;                    // UUID
  projectId: string | null;      // 프로젝트 연결
  rawInput: string;              // 원본 입력

  // AI 추출 결과
  title: string;
  summary: string;
  decisions: string[];
  actionItems: ActionItem[];
  policies: string[];
  openQuestions: string[];
  tags: string[];

  // 메타데이터
  embedding: Float32Array | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ActionItem {
  task: string;
  assignee?: string;
  dueDate?: string;
}
```

### Project Entity

```typescript
interface Project {
  id: string;                    // UUID
  name: string;                  // 고유 이름
  description: string | null;    // 설명
  createdAt: Date;
}
```

---

## Database Schema

### SQLite Tables

```sql
-- 프로젝트 테이블
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 컨텍스트 테이블
CREATE TABLE contexts (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  raw_input TEXT NOT NULL,

  -- AI 추출 결과
  title TEXT NOT NULL,
  summary TEXT,
  decisions TEXT,         -- JSON array
  action_items TEXT,      -- JSON array
  policies TEXT,          -- JSON array
  open_questions TEXT,    -- JSON array
  tags TEXT,              -- JSON array

  -- 임베딩
  embedding BLOB,         -- Float32Array serialized

  -- 타임스탬프
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_contexts_project ON contexts(project_id);
CREATE INDEX idx_contexts_created ON contexts(created_at DESC);
```

### JSON Fields

JSON 배열 필드는 SQLite의 JSON 함수로 쿼리 가능:
```sql
-- 태그로 필터링
SELECT * FROM contexts
WHERE json_array_length(tags) > 0
  AND tags LIKE '%"meeting"%';
```

### Embedding Storage

임베딩은 BLOB으로 저장하고, Node.js에서 Float32Array로 변환:
```typescript
// 저장
const buffer = Buffer.from(embedding.buffer);
db.run('INSERT INTO contexts (embedding) VALUES (?)', [buffer]);

// 조회
const row = db.get('SELECT embedding FROM contexts WHERE id = ?', [id]);
const embedding = new Float32Array(row.embedding.buffer);
```

---

## Service Interfaces

### AI Interface (Port)

```typescript
interface AIProvider {
  extract(input: string): Promise<ExtractedContext>;
  generateEmbedding(text: string): Promise<Float32Array>;
}

interface ExtractedContext {
  title: string;
  summary: string;
  decisions: string[];
  actionItems: ActionItem[];
  policies: string[];
  openQuestions: string[];
  tags: string[];
}
```

### Storage Interface (Port)

```typescript
interface StorageProvider {
  // Context
  saveContext(context: Context): Promise<void>;
  getContext(id: string): Promise<Context | null>;
  listContexts(options: ListOptions): Promise<Context[]>;
  searchContexts(query: string): Promise<Context[]>;
  deleteContext(id: string): Promise<void>;

  // Project
  saveProject(project: Project): Promise<void>;
  getProject(id: string): Promise<Project | null>;
  listProjects(): Promise<Project[]>;
  deleteProject(id: string): Promise<void>;
}

interface ListOptions {
  projectId?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}
```

---

## Data Flow

### Add Context Flow

```
User Input
    │
    ▼
┌─────────────────┐
│   AddContext    │  TUI Screen
│     Screen      │
└────────┬────────┘
         │ text input
         ▼
┌─────────────────┐
│  AddContext     │  Use Case
│    UseCase      │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│Extract│ │Embed  │  Services
│Service│ │Service│
└───┬───┘ └───┬───┘
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Claude │ │OpenAI │  Adapters
│ API   │ │ API   │
└───────┘ └───────┘
    │         │
    └────┬────┘
         ▼
┌─────────────────┐
│  SQLite Save    │  Storage
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Chain Service  │  Find related
└─────────────────┘
         │
         ▼
    Display Result
```

### Search Context Flow

```
Search Query
    │
    ▼
┌─────────────────┐
│  SearchScreen   │  TUI
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SearchContext   │  Use Case
│    UseCase      │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│Embed  │ │Storage│
│Service│ │Search │
└───┬───┘ └───┬───┘
    │         │
    ▼         │
  Query       │
  Embedding   │
    │         │
    └────┬────┘
         ▼
┌─────────────────┐
│ Cosine Similar  │  Chain Service
│   Calculate     │
└─────────────────┘
         │
         ▼
    Ranked Results
```

---

## Configuration

### Config Sources

MCH는 두 가지 설정 소스를 지원합니다:

1. **파일 기반** (`~/.mch/config.json`) - TUI/GUI에서 설정
2. **환경변수** - CI/CD, 서버 환경용

### Config Loading Order (Priority)

```
1. ~/.mch/config.json    (최우선, TUI/GUI에서 설정)
2. .env.local            (로컬 개발용)
3. .env                  (프로젝트 기본값)
4. 환경변수              (CI/CD, 서버)
5. 기본값
```

### Config File Format

```json
// ~/.mch/config.json
{
  "anthropicApiKey": "sk-ant-xxx...",
  "openaiApiKey": "sk-xxx...",
  "dbPath": "~/.mch/data.db",
  "language": "ko"
}
```

### Environment Variables (Fallback)

```bash
# Required (if not in config.json)
ANTHROPIC_API_KEY=sk-ant-xxx     # Claude API
OPENAI_API_KEY=sk-xxx            # OpenAI API (embedding, whisper)

# Optional
MCH_DB_PATH=~/.mch/data.db       # Database location
MCH_LANGUAGE=ko                   # UI language (ko, en)
```

### ConfigService Interface

```typescript
interface ConfigService {
  // 설정 조회
  getConfig(): Config;
  getConfigStatus(): ConfigStatus;

  // 설정 저장 (파일에 저장)
  setApiKey(key: 'anthropic' | 'openai', value: string): Promise<void>;

  // 검증
  validateApiKey(key: 'anthropic' | 'openai'): Promise<boolean>;
}

interface ConfigStatus {
  anthropicKey: { set: boolean; source: 'file' | 'env' | 'none' };
  openaiKey: { set: boolean; source: 'file' | 'env' | 'none' };
  dbPath: string;
  language: 'ko' | 'en';
}
```

---

## Error Handling

### Error Types

```typescript
class MCHError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public recoverable: boolean = true
  ) {
    super(message);
  }
}

enum ErrorCode {
  // Config
  MISSING_API_KEY = 'MISSING_API_KEY',
  INVALID_CONFIG = 'INVALID_CONFIG',

  // AI
  AI_EXTRACTION_FAILED = 'AI_EXTRACTION_FAILED',
  EMBEDDING_FAILED = 'EMBEDDING_FAILED',

  // Storage
  DB_CONNECTION_FAILED = 'DB_CONNECTION_FAILED',
  CONTEXT_NOT_FOUND = 'CONTEXT_NOT_FOUND',
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',

  // Input
  INVALID_INPUT = 'INVALID_INPUT',
}
```

### Recovery Strategy

| Error | Recovery |
|-------|----------|
| API Key Missing | 환경변수 설정 안내 표시 |
| AI Extraction Failed | 재시도 옵션 제공 |
| DB Connection Failed | DB 파일 경로 확인 안내 |
| Network Error | 오프라인 모드 안내 |

---

## Testing Strategy

### Test Layers

```
Unit Tests
├── services/          # Pure function tests
├── domain/            # Entity validation tests
└── adapters/          # Mock integration tests

Integration Tests
├── usecases/          # Full flow tests
└── storage/           # SQLite tests

E2E Tests
└── tui/               # Ink testing library
```

### Test Commands

```bash
pnpm test              # Run all tests
pnpm test:unit         # Unit tests only
pnpm test:integration  # Integration tests
pnpm test:e2e          # E2E tests
pnpm test:coverage     # Coverage report
```

---

## Future Considerations

### GUI Migration

Core 로직을 TUI와 분리했으므로 GUI 전환 시:
1. `tui/` 폴더만 `gui/` (React/Electron)로 교체
2. `core/`와 `adapters/`는 그대로 재사용
3. Entry point만 변경

### Audio Recording (v0.3) - Implemented

```typescript
interface TranscriptionProvider {
  transcribeFile(filePath: string): Promise<string>;
  transcribeBuffer(buffer: Buffer, filename?: string): Promise<string>;
}

interface RecordingProvider {
  start(events?: RecordingEvents): void;
  stop(): string | null;
  getState(): RecordingState;
  getDuration(): number;
}

// Usage: TUI에서 SPACE로 녹음 시작/중지
// 녹음 → Whisper 변환 → AI 추출 → 저장
```

### Plugin System

향후 확장성을 위한 플러그인 인터페이스:
```typescript
interface MCHPlugin {
  name: string;
  version: string;
  onContextAdded?(context: Context): Promise<void>;
  onSearch?(query: string, results: Context[]): Promise<Context[]>;
}
```
