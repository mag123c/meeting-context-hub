# Components

## 역할

Presentation Layer - UI 컴포넌트

## 의존성

- `shadcn/ui` (기본 컴포넌트)
- `hooks/` (상태)
- `repositories/types/` (타입)

## 파일 구조

| 폴더 | 역할 |
|------|------|
| `ui/` | shadcn/ui 기본 컴포넌트 |
| `features/meeting/` | 회의록 관련 컴포넌트 |
| `features/context/` | 컨텍스트 관련 컴포넌트 |
| `features/search/` | 검색 관련 컴포넌트 |

## 규칙

1. **네이밍**: `PascalCase.tsx`
2. **서버/클라이언트 구분**: 필요시 `"use client"` 명시
3. **Props 타입**: 인라인 또는 별도 interface
4. **스타일**: Tailwind CSS + cn() 유틸리티

## 도메인 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `MeetingCard` | 회의록 카드 (요약 표시) |
| `MeetingForm` | 회의록 입력 폼 |
| `PRDSummary` | PRD 섹션별 표시 |
| `ActionItemList` | 액션 아이템 목록 |
| `ContextCard` | 컨텍스트 카드 |
| `ContextForm` | 컨텍스트 입력 폼 |
| `TagSelector` | 태그 선택/생성 |
| `TagBadge` | 태그 뱃지 |
