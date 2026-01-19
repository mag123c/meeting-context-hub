# Hooks

## 역할

커스텀 React Hooks - 상태 관리 및 데이터 페칭

## 의존성

- `repositories/` (타입)
- `storage/` (구현체)

## 파일 구조

| 파일 | 역할 |
|------|------|
| `useMeeting.ts` | 회의록 CRUD 및 상태 |
| `useContext.ts` | 컨텍스트 CRUD 및 상태 |
| `useTag.ts` | 태그 관리 |
| `useAuth.ts` | 인증 상태 |

## 규칙

1. **네이밍**: `use{Name}.ts`
2. **단일 책임**: 한 훅은 한 도메인만 담당
3. **에러 상태 포함**: `{ data, error, loading }` 패턴
4. **Server Action 활용**: 데이터 변경은 Server Action 통해

## 패턴

```typescript
export function useMeeting(id: string) {
  const [meeting, setMeeting] = useState<MeetingWithTags | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ...

  return { meeting, loading, error, refetch };
}
```
