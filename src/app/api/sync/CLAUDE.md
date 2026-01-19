# Sync API

> version: 1.0.0

## 역할

외부 서비스(Slack, Notion) 데이터를 Context로 동기화하는 API

## 의존성

- `@/lib/external/slack` (Slack 클라이언트)
- `@/lib/external/notion` (Notion 클라이언트)
- `@/application/extract-tags.usecase` (태그 추출 UseCase)
- `@/storage/supabase/` (Repository 구현체)

## 파일 구조

| 경로 | 역할 |
|------|------|
| `slack/route.ts` | Slack 동기화 API |
| `notion/route.ts` | Notion 동기화 API |

## API 엔드포인트

### Slack (`/api/sync/slack`)

| 메서드 | 설명 | 요청 | 응답 |
|--------|------|------|------|
| GET | 채널 목록 조회 | - | `{ channels: [{id, name}] }` |
| POST | 메시지 동기화 | `{ channelId, limit? }` | `{ success: true }` |

### Notion (`/api/sync/notion`)

| 메서드 | 설명 | 요청 | 응답 |
|--------|------|------|------|
| GET | 페이지 검색 | `?query=검색어` | `{ pages: [{id, title}] }` |
| POST | 페이지 동기화 | `{ pageId }` | `{ success: true }` |

## 동기화 프로세스

```
외부 서비스 → 데이터 가져오기 → ExtractTagsUseCase → Context 저장
```

1. 인증 확인 (Supabase Auth)
2. 외부 서비스에서 데이터 가져오기
3. ExtractTagsUseCase로 태그 추출 및 Context 생성
4. Obsidian 파일 자동 생성

## 에러 코드

| 상태 | 의미 |
|------|------|
| 401 | 인증 필요 |
| 400 | 잘못된 요청 |
| 404 | 콘텐츠 없음 |
| 503 | 외부 서비스 미설정 |
| 500 | 서버 에러 |

## 규칙

1. **인증 필수**: 모든 요청에 사용자 인증 확인
2. **최소 응답**: 민감 정보 반환 금지
3. **UseCase 재사용**: ExtractTagsUseCase 활용
4. **에러 로깅**: console.error로 에러 기록
