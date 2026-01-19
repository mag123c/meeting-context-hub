# Storage

## 역할

Infrastructure Layer - Repository 인터페이스 구현체

## 의존성

- `repositories/` (인터페이스)
- 외부 SDK (Supabase, Notion 등)

## 파일 구조

| 폴더/파일 | 역할 |
|----------|------|
| `supabase/` | Supabase 구현체 |
| `supabase/client.ts` | 브라우저용 클라이언트 |
| `supabase/server.ts` | 서버용 클라이언트 |
| `supabase/{entity}.supabase.ts` | 엔티티별 구현 |
| `obsidian/` | Obsidian 파일 저장 |

## 규칙

1. **네이밍**: `{entity}.{provider}.ts`
2. **Repository 인터페이스 준수**: 인터페이스 메서드 모두 구현
3. **에러 핸들링**: Supabase/파일 에러를 도메인 에러로 변환
4. **타입 안전성**: Zod로 응답 검증

## 저장소 전환 방법

1. 새 provider 폴더 생성 (예: `notion/`)
2. Repository 인터페이스 구현
3. DI 설정에서 구현체 교체

```typescript
// 현재: Supabase
import { SupabaseMeetingRepository } from "@/storage/supabase/meeting.supabase";

// 향후: Notion
import { NotionMeetingRepository } from "@/storage/notion/meeting.notion";
```
