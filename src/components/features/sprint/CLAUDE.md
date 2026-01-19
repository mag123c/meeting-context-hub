# Sprint Components

## 역할

스프린트 관련 UI 컴포넌트

## 컴포넌트

| 컴포넌트 | 역할 | 타입 |
|----------|------|------|
| `SprintCard` | 스프린트 카드 (목록용) | Server |
| `SprintForm` | 스프린트 입력 폼 | Client |

## SprintCard

**기능:**
- 스프린트 정보 표시 (이름, 목표, 날짜)
- 상태 뱃지 (planning, active, completed, cancelled)
- 상세 페이지 링크

**Props:**
\`\`\`typescript
interface SprintCardProps {
  sprint: Sprint;
}
\`\`\`

## SprintForm

**기능:**
- 스프린트 생성/수정 폼
- 프로젝트 선택
- 날짜 범위 선택

**Props:**
\`\`\`typescript
interface SprintFormProps {
  projects: Project[];
  onSubmit: (data: CreateSprintInput) => Promise<void>;
  defaultValues?: Partial<Sprint>;
}
\`\`\`

## 페이지별 컴포넌트

`/sprints/[id]/` 폴더에는 페이지 전용 클라이언트 컴포넌트가 있습니다:

| 컴포넌트 | 역할 |
|----------|------|
| `SprintStatusControl` | 스프린트 상태 변경 드롭다운 |
| `ActionItemsSection` | 액션아이템 체크리스트 |
