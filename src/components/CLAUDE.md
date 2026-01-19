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
| `layout/` | 레이아웃 컴포넌트 (Navbar) |
| `providers/` | Context Provider (ThemeProvider) |

## 규칙

1. **네이밍**: `PascalCase.tsx`
2. **서버/클라이언트 구분**: 필요시 `"use client"` 명시
3. **Props 타입**: 인라인 또는 별도 interface
4. **스타일**: Tailwind CSS + cn() 유틸리티
5. **색상**: CSS 변수 사용 (하드코딩 금지)

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

---

## 디자인 시스템

### 테마

- **모드**: Dark & Technical (기본값: dark, 시스템 설정 지원)
- **톤**: 개발자 친화적 다크 테마
- **레퍼런스**: Notion 스타일 (깔끔한 블록 기반, 여백 활용)

### 컬러 토큰 (OKLch 기반)

```css
/* 배경 계층 */
--background    /* body 배경 */
--card          /* card/panel */
--accent        /* hover/selected */
--muted         /* 비활성 영역 */

/* 텍스트 */
--foreground         /* 주요 텍스트 */
--muted-foreground   /* 보조 텍스트 */

/* 액센트 */
--primary            /* Technical Blue - 주요 액션 */
--primary-foreground /* 버튼 텍스트 */

/* 시맨틱 */
--destructive   /* 에러/삭제 */
--success       /* 성공 */
--warning       /* 경고 */

/* 테두리 */
--border        /* 기본 테두리 */
--input         /* 입력 필드 테두리 */
--ring          /* 포커스 링 */
```

### 스타일 가이드

| 요소 | 패턴 |
|------|------|
| 카드 hover | `hover:bg-accent/50 transition-colors` |
| 섹션 구분선 | `border-t border-border` |
| 섹션 라벨 | `text-sm font-semibold text-primary` |
| 보조 텍스트 | `text-muted-foreground` |
| 에러 메시지 | `text-destructive` |
| 아바타 배경 | `bg-primary/10 text-primary` |

### 컴포넌트 스타일 예시

```tsx
// Card with hover
<Card className="hover:bg-accent/50 transition-colors cursor-pointer">

// Section divider
<div className="border-t border-border" />

// Section label
<h3 className="text-sm font-semibold text-primary mb-2">

// Error card
<Card className="border-destructive/50 bg-destructive/10">

// Avatar fallback
<AvatarFallback className="bg-primary/10 text-primary">
```

### 반응형 브레이크포인트

- 모바일: 375px
- 태블릿: 768px
- 데스크톱: 1280px
