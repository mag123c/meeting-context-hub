# Hooks

## 역할

커스텀 React Hooks - 상태 관리 및 데이터 페칭

## 의존성

- `repositories/types/` (타입)
- API Routes (`/api/*`)

## 파일 구조

| 파일 | 역할 | 상태 |
|------|------|------|
| `useAuth.ts` | 인증 상태 및 로그아웃 | ✅ 구현됨 |
| `useMeetings.ts` | 회의록 CRUD 및 상태 | ✅ 구현됨 |
| `useContexts.ts` | 컨텍스트 CRUD 및 상태 | ✅ 구현됨 |
| `useSprints.ts` | 스프린트 CRUD 및 상태 | ✅ 구현됨 |
| `useProjects.ts` | 프로젝트 CRUD 및 상태 | ✅ 구현됨 |
| `useActionItems.ts` | 액션아이템 CRUD 및 상태 | ✅ 구현됨 |
| `index.ts` | 통합 export | ✅ |

## 규칙

1. **네이밍**: `use{Name}s.ts` (복수형)
2. **단일 책임**: 한 훅은 한 도메인만 담당
3. **상태 패턴**: `{ data, loading, error, refetch }` 반환
4. **API 호출**: fetch로 API Routes 호출

## 훅별 기능

### useMeetings

```typescript
const {
  data,           // PaginatedResult<MeetingWithTags>
  loading,
  error,
  fetchMeetings,  // (sprintId?: string) => void
  createMeeting,  // (input) => Promise<MeetingWithTags>
  deleteMeeting,  // (id: string) => void
  refetch,
} = useMeetings();
```

### useSprints

```typescript
const {
  data,           // PaginatedResult<Sprint>
  loading,
  error,
  fetchSprints,   // (projectId?: string) => void
  createSprint,   // (input) => Promise<Sprint>
  updateSprint,   // (id, input) => Promise<Sprint>
  deleteSprint,   // (id: string) => void
} = useSprints();
```

### useActionItems

```typescript
const {
  data,               // PaginatedResult<ActionItem>
  loading,
  error,
  fetchActionItems,   // (sprintId?: string) => void
  createActionItem,   // (input) => Promise<ActionItem>
  updateActionItem,   // (id, input) => Promise<ActionItem>
  toggleStatus,       // (id: string) => void (pending ↔ completed)
  deleteActionItem,   // (id: string) => void
} = useActionItems();
```

### useProjects

```typescript
const {
  data,           // PaginatedResult<Project>
  loading,
  error,
  fetchProjects,  // (squadId?: string) => void
  createProject,  // (input) => Promise<Project>
  updateProject,  // (id, input) => Promise<Project>
  deleteProject,  // (id: string) => void
} = useProjects();
```

### useContexts

```typescript
const {
  data,           // PaginatedResult<ContextWithTags>
  loading,
  error,
  fetchContexts,  // (sprintId?: string) => void
  createContext,  // (input) => Promise<ContextWithTags>
  deleteContext,  // (id: string) => void
} = useContexts();
```

## 패턴

```typescript
export function useSprints(initialProjectId?: string) {
  const [data, setData] = useState<PaginatedResult<Sprint> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSprints = useCallback(async (projectId?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (projectId) params.set("projectId", projectId);
      const res = await fetch(\`/api/sprint?\${params}\`);
      if (!res.ok) throw new Error("Failed to fetch");
      setData(await res.json());
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialProjectId) fetchSprints(initialProjectId);
  }, [initialProjectId, fetchSprints]);

  return { data, loading, error, fetchSprints, refetch: fetchSprints };
}
```
