# Settings Components

> version: 1.0.0

## 역할

외부 서비스 연동 설정 UI 컴포넌트

## 의존성

- `@/components/ui/` (shadcn/ui 기본 컴포넌트)
- `/api/sync/slack` (Slack 동기화 API)
- `/api/sync/notion` (Notion 동기화 API)

## 파일 구조

| 파일 | 역할 |
|------|------|
| `SlackIntegration.tsx` | Slack 채널 선택 및 메시지 동기화 UI |
| `NotionIntegration.tsx` | Notion 페이지 검색 및 동기화 UI |
| `index.ts` | 컴포넌트 export |

## 컴포넌트

### SlackIntegration

- 채널 목록 조회 (`GET /api/sync/slack`)
- 선택한 채널 메시지 동기화 (`POST /api/sync/slack`)
- 연동 상태 표시 (연결됨/미설정)

### NotionIntegration

- 페이지 검색 (`GET /api/sync/notion?query=...`)
- 선택한 페이지 동기화 (`POST /api/sync/notion`)
- 연동 상태 표시 (연결됨/미설정)

## 규칙

1. **클라이언트 컴포넌트**: `"use client"` 필수
2. **에러 처리**: toast로 사용자 피드백
3. **로딩 상태**: Loader2 아이콘으로 표시
4. **미설정 상태**: 환경변수 안내 메시지 표시
