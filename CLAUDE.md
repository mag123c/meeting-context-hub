# Meeting Context Hub

팀용 웹 애플리케이션: 회의록 PRD/Action Items 요약 + 컨텍스트 자동 태깅 → 옵시디언 저장

## Quick Start

```bash
cp .env.local.example .env.local  # 환경변수 설정
pnpm install
pnpm dev  # localhost:3000
```

---

## 스킬 자동 호출 규칙 (필수 준수)

| 트리거 상황 | 필수 스킬 | 이유 |
|-------------|----------|------|
| 세션 첫 프롬프트 | `/clarify` 먼저 호출 | 요구사항 명확화 (Hook으로 강제) |
| clarify 완료 후 | `EnterPlanMode` 자동 호출 | 계획 작성 |
| Plan 승인 후 구현 시작 | `/implement` 호출 | 워크플로우 일관성 |
| 코드 변경 요청 시 | `/implement` 먼저 호출 | 분석→구현→검증 체이닝 |
| 구현 완료 / 커밋 전 | `/verify` 실행 | 빌드/린트/테스트 검증 |
| UI 디자인 작업 시 | `/vs-design` 호출 | Mode Collapse 방지 |
| 세션 마무리 시 | `/mch-wrap` 호출 | 문서 최신화 |

**규칙**: 스킬 호출 없이 직접 코드를 작성하면 안 됩니다. 사용자가 명시적으로 스킬을 호출하지 않아도, Claude가 먼저 적절한 스킬을 호출해야 합니다.

### 워크플로우

```
세션 시작
    ↓
[HOOK] clarify-prompt.sh → /clarify 강제
    ↓
[SKILL] /clarify → 요구사항 명확화
    ↓
[AUTO] EnterPlanMode → 계획 작성
    ↓
사용자 승인
    ↓
[SKILL] /implement → 분석 → 구현 → /verify → 커밋
    ↓
[SKILL] /mch-wrap → 세션 마무리 (선택)
```

### Skills (`.claude/skills/`)

| 스킬 | 용도 |
|------|------|
| `/clarify` | 요구사항 명확화 → Plan Mode 자동 진입 |
| `/implement` | 전체 워크플로우 오케스트레이션 (분석→구현→검증→커밋) |
| `/verify` | 자체 검증 루프 (빌드/린트/테스트) |
| `/vs-design` | VS Design Diverge (UI 디자인) |
| `/mch-wrap` | 세션 마무리 (문서 최신화) |

---

## Git Convention

### 브랜치 전략

| 타입 | 브랜치 접두사 | 설명 |
|------|---------------|------|
| 새 기능 | `feat/` | 새로운 기능 추가 |
| 버그 수정 | `fix/` | 버그 수정 |
| 리팩토링 | `refactor/` | 코드 개선 (기능 변경 없음) |
| 문서 | `docs/` | 문서 작성/수정 |
| 스타일 | `style/` | 코드 포맷팅 |
| 테스트 | `test/` | 테스트 추가/수정 |

```bash
# 예시
git checkout -b feat/meeting-summary
git checkout -b fix/tag-duplicate
```

### 커밋 메시지 (Conventional Commits)

```
{타입}: {설명}

# 예시
feat: 회의록 요약 API 구현
fix: 태그 중복 생성 버그 수정
refactor: Claude SDK 래퍼 정리
docs: README 업데이트
```

**규칙**:
- 한글 커밋 메시지 허용
- **Co-Authored-By 금지** (Claude/AI 마킹 절대 금지)
- `git -C` 명령어 사용 금지 (working directory에서 직접 실행)
- main 직접 커밋 금지 (브랜치에서 작업)

### PR 템플릿

```markdown
## Summary
- {변경 사항 요약}

## Changes
- {구체적 변경 목록}

## Test
- [ ] pnpm build 통과
- [ ] pnpm lint 통과
- [ ] 기능 테스트 완료
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│   Presentation Layer                                         │
│   components/ (UI) → hooks/ (State) → app/ (Pages/Routes)   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│   Application Layer                                          │
│   application/ (UseCases + 비즈니스 로직)                    │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│   Domain Layer                                               │
│   repositories/ (인터페이스) + types/ (엔티티 타입)          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│   Infrastructure Layer                                       │
│   storage/ (Supabase/Obsidian 구현체) + lib/ (외부 SDK)      │
└─────────────────────────────────────────────────────────────┘
```

## Structure

```
src/
├── app/                  # Next.js App Router
├── components/
│   ├── ui/               # shadcn/ui 기본 컴포넌트
│   ├── features/         # 도메인별 컴포넌트 (meeting, context, search)
│   ├── layout/           # 레이아웃 컴포넌트 (Navbar)
│   └── providers/        # Context Providers (ThemeProvider)
├── hooks/                # 커스텀 React Hooks
├── repositories/         # Domain Layer (인터페이스)
│   └── types/            # 엔티티 타입
├── storage/              # Infrastructure (구현체)
│   ├── supabase/         # Supabase 구현
│   └── obsidian/         # Obsidian 저장
├── application/          # UseCase
└── lib/
    ├── ai/               # Claude SDK + 프롬프트
    └── external/         # Slack, Notion API
```

---

## Naming Convention

| 구분 | 패턴 | 예시 |
|------|------|------|
| 컴포넌트 | `PascalCase.tsx` | `MeetingCard.tsx` |
| Hooks | `use{Name}.ts` | `useMeeting.ts` |
| Repository 인터페이스 | `{entity}.repository.ts` | `meeting.repository.ts` |
| Repository 구현체 | `{entity}.{provider}.ts` | `meeting.supabase.ts` |
| UseCase | `{action}-{entity}.usecase.ts` | `summarize-meeting.usecase.ts` |
| 프롬프트 | `{purpose}.prompt.ts` | `meeting-summary.prompt.ts` |
| 타입 | `{entity}.types.ts` | `meeting.types.ts` |

---

## Core Rules

1. **Clean Architecture**: Repository 인터페이스 → Storage 구현체 분리
2. **선언형 프롬프트**: lib/ai/prompts에 version 필드 포함
3. **Zod 스키마**: 모든 API 응답/입력 검증
4. **RSC 보안**: Server Action에서 민감 데이터 반환 금지
5. **디렉토리 문서화**: 새 디렉토리 생성 시 `CLAUDE.md` 작성

---

## Commands

```bash
pnpm dev          # 개발 서버
pnpm build        # 빌드
pnpm lint         # ESLint 실행
pnpm lint --fix   # 린트 자동 수정
```

---

## AI Context (`.claude/ai-context/`)

| 문서 | 경로 | 설명 |
|------|------|------|
| 도메인 용어 | `meeting-domain/glossary.json` | PRD, Action Items 등 용어 |
| 엔티티 정의 | `meeting-domain/entities.json` | Meeting, Context, Tag |
| 비즈니스 규칙 | `meeting-domain/rules.json` | 요약/태깅 규칙 |
| Obsidian 설정 | `integrations/obsidian.json` | 저장 경로, 템플릿 |
| Slack 연동 | `integrations/slack.json` | API 설정 |
| Notion 연동 | `integrations/notion.json` | API 설정 |

### 문서 업데이트 규칙

| 변경 유형 | 대상 |
|----------|------|
| 도메인 용어 | `.claude/ai-context/meeting-domain/glossary.json` |
| 엔티티 정의 | `.claude/ai-context/meeting-domain/entities.json` |
| 비즈니스 규칙 | `.claude/ai-context/meeting-domain/rules.json` |
| 통합 설정 | `.claude/ai-context/integrations/*.json` |
| 모듈/규칙 | `CLAUDE.md` |
