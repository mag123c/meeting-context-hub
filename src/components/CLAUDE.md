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
| `features/sprint/` | 스프린트 관련 컴포넌트 |
| `features/tag/` | 태그 관련 컴포넌트 |
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
| `SprintCard` | 스프린트 카드 (상태, 날짜 표시) |
| `SprintForm` | 스프린트 입력 폼 |
| `TagSelector` | 태그 선택/생성 (Command + Popover) |
| `TagBadge` | 태그 뱃지 |

---

## 디자인 시스템 (Editorial Notion)

### 테마

- **스타일**: Editorial Notion (깔끔한 블록 기반, 여백 활용)
- **모드**: Dark 기본 (시스템 설정 지원)
- **특징**: Serif 제목, Block-style radius, Opacity hover

### 타이포그래피

| 역할 | 폰트 | 사이즈 | 클래스 |
|------|------|--------|--------|
| H1 | Lora (serif) | 32px | `font-serif text-3xl` |
| H2 | Lora (serif) | 24px | `font-serif text-2xl` |
| H3 | Lora (serif) | 18px | `font-serif text-lg` |
| Body | Inter (sans) | 14px | `text-sm` |
| Caption | Inter (sans) | 12px | `text-xs text-muted-foreground` |
| Code | JetBrains Mono | 13px | `font-mono text-sm` |

### 컬러 토큰 (Notion Dark)

```css
/* 배경 계층 */
--background: #191919;     /* body 배경 */
--card: #252525;           /* 카드/패널 */
--muted: #2F2F2F;          /* 보조 영역 */
--accent: #373737;         /* hover/selected */

/* 텍스트 */
--foreground: #EBEBEB;     /* 주요 텍스트 */
--muted-foreground: #9B9B9B; /* 보조 텍스트 */

/* 액센트 */
--primary: #529CCA;        /* Notion Blue - 링크, 인터랙티브 */

/* 시맨틱 */
--success: #4DAB9A;        /* 성공/진행 중 */
--warning: #CB9037;        /* 경고/계획 중 */
--destructive: #D16969;    /* 에러/취소 */

/* 테두리 */
--border: #373737;
```

### Border Radius (Block Style)

| 용도 | 값 | Tailwind |
|------|-----|----------|
| 카드, 다이얼로그 | 6px | `rounded-md` |
| 버튼, 인풋 | 4px | `rounded` |
| 뱃지, 작은 요소 | 2px | `rounded-sm` |

### Badge Variants

| Variant | 용도 | 색상 |
|---------|------|------|
| `default` | 기본/완료 | primary |
| `secondary` | 태그 | muted |
| `success` | 진행 중 | green |
| `warning` | 계획 중 | amber |
| `destructive` | 취소/에러 | red |
| `outline` | 아웃라인 | border |

### 스타일 패턴

```tsx
// 페이지 제목
<h1 className="font-serif text-3xl font-semibold tracking-tight">제목</h1>
<p className="text-muted-foreground mt-1">설명 텍스트</p>

// 카드 hover
<Card className="hover:bg-accent/50 transition-colors cursor-pointer">

// 섹션 헤더
<h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">

// 상태 뱃지
<Badge variant="success">진행 중</Badge>
<Badge variant="warning">계획 중</Badge>

// 아이콘 + 텍스트
<span className="flex items-center gap-1.5">
  <Calendar className="h-4 w-4" />
  {date}
</span>
```

### 반응형 브레이크포인트

| 디바이스 | 너비 | 콘텐츠 너비 |
|----------|------|-------------|
| 모바일 | 375px | 100% |
| 태블릿 | 768px | max-w-3xl |
| 데스크톱 | 1280px | container |

### 접근성

- WCAG AA 대비율 준수 (텍스트 4.5:1, UI 3:1)
- 키보드 네비게이션 지원
- 포커스 링 가시성 (`ring-2 ring-ring`)
- 모바일 터치 타겟 44px
