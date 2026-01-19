# Tag Components

## 역할

태그 관련 UI 컴포넌트

## 컴포넌트

| 컴포넌트 | 역할 | 타입 |
|----------|------|------|
| `TagSelector` | 태그 선택/생성 Popover | Client |

## TagSelector

**기능:**
- 기존 태그 목록 표시 (Command 기반 검색)
- 태그 선택/해제 (체크박스 스타일)
- 새 태그 생성 (검색어가 기존 태그와 불일치 시)
- 선택된 태그 Badge 표시

**Props:**
\`\`\`typescript
interface TagSelectorProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  disabled?: boolean;
}
\`\`\`

**의존성:**
- `@/components/ui/command` - 검색 UI
- `@/components/ui/popover` - 드롭다운
- `@/components/ui/badge` - 선택된 태그 표시
- `/api/tag` - 태그 목록/생성 API

## 사용 예시

\`\`\`tsx
<TagSelector
  selectedTags={tags}
  onTagsChange={setTags}
  disabled={isLoading}
/>
\`\`\`
