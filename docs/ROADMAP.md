# Meeting Context Hub - Roadmap

## Version Overview

| Version | Focus | Key Features |
|---------|-------|--------------|
| **v0.1** | Core TUI + Text Input | 텍스트 입력 → AI 추출 → 저장 → 조회 |
| **v0.1.1** | In-App Configuration | TUI/GUI 공용 설정 모듈, Settings 화면 |
| **v0.2** | Search + Chaining | 의미론적 검색 + 관련 컨텍스트 연결 |
| **v0.3** | Audio File Support | 오디오 파일 → Whisper → 추출 |
| **v0.4** | Error Handling + Polish | 에러 처리, 재시도 로직, 사용자 메시지 개선 |

---

## v0.1 - Core TUI + Text Input

### Goal
텍스트 입력 → AI 추출 → 저장 → 조회의 기본 플로우 완성

### Features

```
[x] Project Setup
    [x] package.json 정리 (불필요 의존성 제거)
    [x] tsconfig.json 설정
    [x] ESLint 설정
    [x] 디렉토리 구조 생성

[x] Database Layer
    [x] SQLite 연결 (better-sqlite3)
    [x] Schema 생성 (projects, contexts)
    [x] Storage interface 정의
    [x] SQLite adapter 구현

[x] AI Layer
    [x] AI interface 정의
    [x] Claude adapter 구현
    [x] 추출 프롬프트 작성
    [x] 결과 파싱 로직

[x] Core Services
    [x] ExtractService 구현
    [x] AddContextUseCase 구현
    [x] ListContextsUseCase 구현

[x] TUI Screens
    [x] App.tsx (라우터)
    [x] MainMenu.tsx
    [x] AddContext.tsx
    [x] ListScreen.tsx
    [x] DetailScreen.tsx
    [x] ProjectScreen.tsx

[x] Configuration
    [x] 환경변수 로딩
    [x] API 키 검증
    [x] DB 경로 설정
```

### Acceptance Criteria

- [x] `pnpm dev`로 TUI 실행 가능
- [x] 텍스트 입력 후 AI 추출 결과 확인 가능
- [x] 저장된 컨텍스트 목록 조회 가능
- [x] 컨텍스트 상세 보기 가능
- [x] 프로젝트 생성 및 선택 가능

### Dependencies

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.71.2",
    "better-sqlite3": "^11.x",
    "ink": "^6.6.0",
    "react": "^19.x",
    "zod": "^3.x",
    "dotenv": "^16.x",
    "uuid": "^11.x"
  }
}
```

---

## v0.1.1 - In-App Configuration

### Goal
TUI/GUI 공용 설정 모듈 구현. 환경변수 export 없이 앱 내에서 API 키 설정 가능.

### Architecture

```
┌─────────────────────────────────────────┐
│           TUI / GUI                      │
│        Settings Screen                   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       ConfigService (Core)               │
│   - getConfig()                          │
│   - setApiKey(key, value)                │
│   - validateKeys()                       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       ConfigAdapter (Adapter)            │
│   - 파일: ~/.mch/config.json             │
│   - 환경변수 fallback                    │
└─────────────────────────────────────────┘
```

### Config Priority

```
1. ~/.mch/config.json    (TUI/GUI에서 설정, 최우선)
2. .env.local            (로컬 개발용)
3. 환경변수              (CI/CD, 서버 환경)
```

### Features

```
[x] Config Adapter 확장
    [x] 파일 기반 설정 저장 (~/.mch/config.json)
    [x] 설정 읽기/쓰기 인터페이스
    [x] 우선순위 로직 (파일 > 환경변수)
    [x] 민감 정보 마스킹 (표시용)

[x] ConfigService (Core)
    [x] getConfig() - 현재 설정 조회
    [x] setApiKey(key, value) - API 키 저장
    [x] validateApiKey(key) - 키 유효성 검증
    [x] getConfigStatus() - 설정 상태 요약

[x] TUI Settings Screen
    [x] 현재 API 키 상태 표시 (마스킹)
    [x] API 키 입력/수정
    [x] DB 경로 표시
    [x] 설정 검증 결과 표시
```

### Config File Format

```json
{
  "anthropicApiKey": "sk-ant-xxx...",
  "openaiApiKey": "sk-xxx...",
  "dbPath": "~/.mch/data.db",
  "language": "ko"
}
```

### Acceptance Criteria

- [x] TUI Settings 화면에서 API 키 설정 가능
- [x] 설정 후 재시작 없이 즉시 적용
- [x] 환경변수 없이도 앱 사용 가능
- [x] 기존 환경변수 설정과 호환 (fallback)
- [x] GUI에서 동일 ConfigService 재사용 가능

---

## v0.2 - Search + Chaining

### Goal
의미론적 검색과 관련 컨텍스트 자동 연결

### Features

```
[x] Embedding Service
    [x] OpenAI embedding API 연결
    [x] 임베딩 생성 로직
    [x] BLOB 저장/로드 유틸

[x] Chain Service
    [x] 코사인 유사도 계산
    [x] 관련 컨텍스트 조회
    [x] 유사도 threshold 설정

[x] Search
    [x] SearchContextUseCase 구현
    [x] SearchScreen.tsx
    [x] 결과 정렬 (유사도순)
    [x] 키워드 검색 fallback

[x] Context Enhancement
    [x] 컨텍스트 추가 시 관련 항목 표시
    [x] DetailScreen에 Related 섹션
    [x] 관련 항목 클릭 네비게이션
```

### Acceptance Criteria

- [x] "결제"로 검색 시 결제 관련 컨텍스트 표시
- [x] 새 컨텍스트 추가 후 관련 항목 3-5개 표시
- [x] 상세 화면에서 관련 컨텍스트로 이동 가능
- [x] 검색 결과가 유사도 순으로 정렬됨

### New Dependencies

```json
{
  "dependencies": {
    "openai": "^6.x"
  }
}
```

---

## v0.3 - Audio Recording

### Goal
실시간 오디오 녹음 → Whisper 변환 → 컨텍스트 추출

### Features

```
[x] Audio Adapter
    [x] Whisper API 연결
    [x] 오디오 버퍼 → API 전송
    [x] 변환 결과 반환

[x] Recording Service
    [x] Node.js 오디오 녹음 (node-record-lpcm16 + sox)
    [x] 녹음 시작/중지 제어
    [x] WAV 포맷 저장

[x] Record UseCase
    [x] 녹음 → 변환 → 추출 플로우
    [x] 진행 상태 표시
    [x] 변환 결과 미리보기 후 저장

[x] TUI Enhancement
    [x] RecordScreen.tsx
    [x] 녹음 상태 표시 (녹음중, 변환중)
    [x] 원본 텍스트 확인/편집 가능
```

### Acceptance Criteria

- [x] TUI에서 녹음 시작/중지 가능
- [x] 녹음 진행 상태 표시 (시간, 상태)
- [x] Whisper로 텍스트 변환
- [x] 변환된 텍스트 확인 후 저장 가능

### Notes

- Whisper API는 25MB 제한 (~25분 오디오)
- 긴 녹음은 청크 분할 필요 (향후)
- macOS: sox 필요 (`brew install sox`)

---

## v0.4 - Error Handling + Polish

### Goal
에러 처리 시스템 구축 및 UX 개선

### Features

```
[x] Error Handling
    [x] 에러 타입 정의 (MCHError + 7 specialized classes)
    [x] ErrorCode enum (28개 에러 코드)
    [x] 사용자 친화적 에러 메시지 (bilingual recovery messages)
    [x] 복구 가능 에러 처리 (recoverable flag)
    [x] Retry Service (exponential backoff with jitter)
    [x] ErrorDisplay 컴포넌트 (error + code + recovery + retry)

[x] Adapter Layer Hardening
    [x] OpenAI adapter - try-catch + retry
    [x] Whisper adapter - try-catch + retry + file check
    [x] Claude adapter - retry logic
    [x] SQLite adapter - comprehensive error handling
    [x] Recording adapter - sox detection
    [x] Config adapter - proper error types

[x] Services Layer
    [x] Input validation (min length, empty check)
    [x] Graceful degradation (embedding failures)
    [x] Dimension validation (cosine similarity)

[x] TUI Screens
    [x] ErrorDisplay component
    [x] ErrorText component (inline)
    [x] All screens updated with error handling

[x] Settings Screen Enhancement
    [x] 언어 선택 기능
    [x] DB 경로 변경

[x] i18n
    [x] 메시지 추출 (~95개 문자열)
    [x] 완전한 한국어/영어 번역
    [x] t() / ti() 헬퍼 함수
    [x] 모든 TUI 화면 적용

[x] Core 분리
    [x] TUI 의존성 없는 core 패키지 확인
    [x] GUI용 entry point 준비 (core/index.ts)
    [x] GUI_INTEGRATION.md 문서 작성
    [x] verify:core 스크립트 추가
```

### Acceptance Criteria

- [x] 에러 발생 시 명확한 안내 표시 (에러 코드 + 복구 방법)
- [x] Rate limit 에러 시 자동 재시도 (exponential backoff)
- [x] 네트워크 오류 시 재시도 옵션 제공
- [x] sox 미설치 시 설치 안내 표시
- [x] 한국어/영어 에러 메시지 지원
- [x] 설정 화면에서 언어 전환 가능
- [x] core 로직을 GUI에서 import 가능

---

## Future Versions (Post-MVP)

### v0.5 - Advanced Features

```
[ ] 컨텍스트 수정/삭제
[ ] 태그 수동 편집
[ ] 프로젝트 아카이브
[ ] 내보내기 (Markdown, JSON)
```

### v0.6 - GUI (Electron/Tauri)

```
[ ] Electron 또는 Tauri 선택
[ ] 기본 GUI 구현
[ ] TUI와 동일 기능
[ ] 메뉴바/트레이 아이콘
```

### v0.7+ - Collaboration

```
[ ] 클라우드 동기화
[ ] 팀 공유
[ ] 실시간 협업
```

---

## Technical Debt Tracking

| Item | Priority | Notes |
|------|----------|-------|
| Test coverage | High | 핵심 서비스 80% 이상 |
| Error boundaries | Medium | TUI 크래시 방지 |
| Performance | Low | 대량 컨텍스트 시 최적화 |
| Logging | Low | 디버그용 로깅 |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-01 | CLI 제거, TUI only | 사용성 집중 |
| 2025-01 | SQLite 사용 | 크로스 플랫폼, 설치 불필요 |
| 2025-01 | macOS 의존성 제거 | OS 독립성 확보 |
| 2025-01 | Obsidian 연동 제거 | 핵심 기능 집중 |
| 2025-01 | 파일 기반 설정 (v0.1.1) | TUI/GUI 공용, export 불필요 |

---

## Release Checklist

v0.1 릴리스 전:
- [ ] 모든 feature 완료
- [ ] README.md 업데이트
- [ ] 설치 가이드 작성
- [ ] 기본 테스트 통과
- [ ] 크로스 플랫폼 테스트 (macOS, Linux)
