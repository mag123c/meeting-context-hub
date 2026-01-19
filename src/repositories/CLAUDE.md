# Repositories

## 역할

Domain Layer - 데이터 접근 인터페이스 정의

## 의존성

- 없음 (순수 인터페이스)

## 파일 구조

| 파일 | 역할 |
|------|------|
| `types/` | 엔티티 타입 및 Zod 스키마 |
| `meeting.repository.ts` | 회의록 저장소 인터페이스 |
| `context.repository.ts` | 컨텍스트 저장소 인터페이스 |
| `tag.repository.ts` | 태그 저장소 인터페이스 |
| `sprint.repository.ts` | 스프린트 저장소 인터페이스 |
| `project.repository.ts` | 프로젝트 저장소 인터페이스 |
| `squad.repository.ts` | 스쿼드 저장소 인터페이스 |
| `action-item.repository.ts` | 액션아이템 저장소 인터페이스 |

## 엔티티 계층

```
Squad → Project → Sprint → Meeting/Context/ActionItem
```

## 타입 파일

| 파일 | 주요 타입 |
|------|----------|
| `meeting.types.ts` | Meeting, MeetingType, EmbeddedActionItem |
| `context.types.ts` | Context, ContextType, Importance |
| `tag.types.ts` | Tag, TagType, TagScope |
| `sprint.types.ts` | Sprint, SprintStatus |
| `project.types.ts` | Project, ProjectStatus |
| `squad.types.ts` | Squad |
| `action-item.types.ts` | ActionItem, ActionItemStatus, ActionItemPriority |
| `common.types.ts` | Pagination, PaginatedResult |

## 규칙

1. **인터페이스만 정의**: 구현은 `storage/` 폴더에서
2. **Zod 스키마 필수**: 모든 타입에 Zod 검증 스키마 동반
3. **네이밍**: `{entity}.repository.ts`, `{entity}.types.ts`
4. **Promise 반환**: 모든 메서드는 Promise 반환
5. **nullable 명시**: null 가능 필드는 명시적으로 표시
6. **하위 호환성**: 신규 FK 필드는 nullable/optional로 추가

## 타입 스키마 예시

```typescript
// Sprint 스키마
export const sprintSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  status: sprintStatusSchema.default("planning"),
  start_date: z.string().date(),
  end_date: z.string().date(),
  // ...
});

// Meeting 스키마 (확장)
export const meetingSchema = z.object({
  // 기존 필드
  id: z.string().uuid(),
  title: z.string().min(1),
  // ...
  // 신규 필드 (nullable/optional)
  sprint_id: z.string().uuid().nullable().optional(),
  meeting_type: meetingTypeSchema.nullable().optional(),
});
```
