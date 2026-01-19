# Repositories

## 역할

Domain Layer - 데이터 접근 인터페이스 정의

## 의존성

- 없음 (순수 인터페이스)

## 파일 구조

| 파일 | 역할 |
|------|------|
| `types/` | 엔티티 타입 및 Zod 스키마 |
| `tag.repository.ts` | 태그 저장소 인터페이스 |
| `meeting.repository.ts` | 회의록 저장소 인터페이스 |
| `context.repository.ts` | 컨텍스트 저장소 인터페이스 |

## 규칙

1. **인터페이스만 정의**: 구현은 `storage/` 폴더에서
2. **Zod 스키마 필수**: 모든 타입에 Zod 검증 스키마 동반
3. **네이밍**: `{entity}.repository.ts`
4. **Promise 반환**: 모든 메서드는 Promise 반환
5. **nullable 명시**: null 가능 필드는 명시적으로 표시

## 타입 스키마

```typescript
// 예시: Meeting 스키마
export const meetingSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1),
  raw_content: z.string(),
  prd_summary: prdSummarySchema.nullable(),
  action_items: z.array(actionItemSchema).nullable(),
  obsidian_path: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
```
