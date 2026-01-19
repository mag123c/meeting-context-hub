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
| `index.ts` | 통합 export |

## 엔티티 계층

```
Squad → Project → Sprint → Meeting/Context/ActionItem
         ↓
        Tag (many-to-many with Meeting/Context)
```

## 타입 파일

| 파일 | 주요 타입 |
|------|----------|
| `meeting.types.ts` | Meeting, MeetingWithTags, MeetingType, EmbeddedActionItem |
| `context.types.ts` | Context, ContextWithTags, ContextType, Importance |
| `tag.types.ts` | Tag, TagType, TagScope |
| `sprint.types.ts` | Sprint, SprintStatus |
| `project.types.ts` | Project, ProjectStatus |
| `squad.types.ts` | Squad |
| `action-item.types.ts` | ActionItem, ActionItemStatus, ActionItemPriority |
| `common.types.ts` | Pagination, PaginatedResult |

---

## Repository 메서드 정의

### MeetingRepository

| 메서드 | 설명 |
|--------|------|
| `create(input)` | 회의록 생성 (태그 연결 포함) |
| `getById(id)` | ID로 조회 (태그 포함) |
| `listByUser(userId, pagination)` | 사용자별 목록 (페이지네이션) |
| `listBySprint(sprintId, pagination)` | 스프린트별 목록 |
| `update(id, input)` | 회의록 수정 (태그 동기화 포함) |
| `delete(id)` | 삭제 |

### ContextRepository

| 메서드 | 설명 |
|--------|------|
| `create(input)` | 컨텍스트 생성 (태그 연결 포함) |
| `getById(id)` | ID로 조회 (태그 포함) |
| `listByUser(userId, pagination)` | 사용자별 목록 |
| `listBySprint(sprintId, pagination)` | 스프린트별 목록 |
| `update(id, input)` | 수정 |
| `delete(id)` | 삭제 |

### TagRepository

| 메서드 | 설명 |
|--------|------|
| `create(input)` | 태그 생성 |
| `getById(id)` | ID로 조회 |
| `getByName(name)` | 이름으로 조회 (unique) |
| `list()` | 전체 목록 |
| `update(id, input)` | 수정 |
| `delete(id)` | 삭제 |

### SprintRepository

| 메서드 | 설명 |
|--------|------|
| `create(input)` | 스프린트 생성 |
| `getById(id)` | ID로 조회 |
| `listByProject(projectId, pagination)` | 프로젝트별 목록 |
| `listActive(userId)` | 활성 스프린트 목록 |
| `update(id, input)` | 수정 (상태 변경 포함) |
| `delete(id)` | 삭제 |

### ProjectRepository

| 메서드 | 설명 |
|--------|------|
| `create(input)` | 프로젝트 생성 |
| `getById(id)` | ID로 조회 |
| `listBySquad(squadId, pagination)` | 스쿼드별 목록 |
| `listByUser(userId, pagination)` | 사용자별 목록 |
| `update(id, input)` | 수정 |
| `delete(id)` | 삭제 |

### SquadRepository

| 메서드 | 설명 |
|--------|------|
| `create(input)` | 스쿼드 생성 |
| `getById(id)` | ID로 조회 |
| `listByUser(userId)` | 사용자별 목록 |
| `update(id, input)` | 수정 |
| `delete(id)` | 삭제 |

### ActionItemRepository

| 메서드 | 설명 |
|--------|------|
| `create(input)` | 액션아이템 생성 |
| `getById(id)` | ID로 조회 |
| `listBySprint(sprintId, pagination)` | 스프린트별 목록 |
| `listByMeeting(meetingId)` | 회의록별 목록 |
| `update(id, input)` | 수정 (상태 변경 포함) |
| `delete(id)` | 삭제 |

---

## 규칙

1. **인터페이스만 정의**: 구현은 `storage/` 폴더에서
2. **Zod 스키마 필수**: 모든 타입에 Zod 검증 스키마 동반
3. **네이밍**: `{entity}.repository.ts`, `{entity}.types.ts`
4. **Promise 반환**: 모든 메서드는 Promise 반환
5. **nullable 명시**: null 가능 필드는 명시적으로 표시
6. **하위 호환성**: 신규 FK 필드는 nullable/optional로 추가
7. **WithTags 타입**: 관계 조회 시 `{Entity}WithTags` 타입 사용

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
  id: z.string().uuid(),
  title: z.string().min(1),
  sprint_id: z.string().uuid().nullable().optional(),
  meeting_type: meetingTypeSchema.nullable().optional(),
  // ...
});

// WithTags 타입
export type MeetingWithTags = Meeting & { tags: Tag[] };
```

## 구현체 위치

| Repository | Storage 구현체 |
|------------|----------------|
| MeetingRepository | `storage/supabase/meeting.supabase.ts` |
| ContextRepository | `storage/supabase/context.supabase.ts` |
| TagRepository | `storage/supabase/tag.supabase.ts` |
| SprintRepository | `storage/supabase/sprint.supabase.ts` |
| ProjectRepository | `storage/supabase/project.supabase.ts` |
| SquadRepository | `storage/supabase/squad.supabase.ts` |
| ActionItemRepository | `storage/supabase/action-item.supabase.ts` |
