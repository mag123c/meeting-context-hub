# Meeting Context Hub - 구현 계획

## 프로젝트 개요

팀용 웹 애플리케이션: 회의록 PRD/Action Items 요약 + 컨텍스트 자동 태깅 → 옵시디언 저장

**참고**: MVP는 Supabase 사용, 향후 노션 DB로 교체 가능하도록 저장소 레이어 추상화

---

## 컨벤션 (andsys-project 기반 리팩토링)

### 1. AI Context 구조 (.claude/)

```
meeting-context-hub/
├── .claude/
│   ├── ai-context/
│   │   ├── meeting-domain/          # 회의 도메인 지식
│   │   │   ├── entities.json        # Meeting, Context, Tag 엔티티
│   │   │   ├── glossary.json        # PRD, Action Items 등 용어
│   │   │   └── rules.json           # 비즈니스 규칙
│   │   └── integrations/            # 외부 연동 설정
│   │       ├── obsidian.json        # Obsidian 저장 규칙
│   │       ├── slack.json           # Slack 연동 설정
│   │       └── notion.json          # Notion 연동 설정
│   ├── commands/                    # 워크플로우 커맨드
│   │   └── pr.md                    # PR 생성 가이드
│   └── settings.local.json
├── CLAUDE.md                        # 루트 프로젝트 가이드
└── src/
    ├── repositories/CLAUDE.md       # Repository 레이어 가이드
    ├── hooks/CLAUDE.md              # Hooks 가이드
    └── lib/ai/CLAUDE.md             # AI/프롬프트 가이드
```

### 2. 네이밍 컨벤션

| 구분 | 패턴 | 예시 |
|------|------|------|
| 컴포넌트 | `PascalCase.tsx` | `MeetingCard.tsx`, `TagSelector.tsx` |
| Hooks | `use{Name}.ts` | `useMeeting.ts`, `useContextTags.ts` |
| Repository 인터페이스 | `{entity}.repository.ts` | `meeting.repository.ts` |
| Repository 구현체 | `{entity}.{provider}.ts` | `meeting.supabase.ts` |
| UseCase | `{action}-{entity}.usecase.ts` | `summarize-meeting.usecase.ts` |
| 프롬프트 | `{purpose}.prompt.ts` | `meeting-summary.prompt.ts` |
| 타입 | `{entity}.types.ts` | `meeting.types.ts` |

### 3. 아키텍처 (Clean Architecture + 선언형)

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│   components/ (UI) → hooks/ (State) → app/ (Pages/Routes)   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│              application/ (UseCases + 비즈니스 로직)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                            │
│    repositories/ (인터페이스) + types/ (엔티티 타입)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│   storage/ (Supabase/Obsidian 구현체) + lib/ (외부 SDK)      │
└─────────────────────────────────────────────────────────────┘
```

### 4. 선언형 설정 관리

**프롬프트 선언 (lib/ai/prompts/)**
```typescript
// meeting-summary.prompt.ts
export const MEETING_SUMMARY_PROMPT = {
  version: "1.0.0",
  systemPrompt: `...`,
  outputSchema: z.object({
    problem: z.string(),
    goal: z.string(),
    scope: z.array(z.string()),
    requirements: z.array(z.string()),
  }),
} as const;
```

**Repository 인터페이스 선언 (repositories/)**
```typescript
// meeting.repository.ts
export interface MeetingRepository {
  create(data: CreateMeetingInput): Promise<Meeting>;
  getById(id: string): Promise<Meeting | null>;
  listByUser(userId: string): Promise<Meeting[]>;
  update(id: string, data: UpdateMeetingInput): Promise<Meeting>;
  delete(id: string): Promise<void>;
}
```

### 5. 모듈별 CLAUDE.md 템플릿

```markdown
# {모듈명}

## 역할
[이 모듈이 하는 일]

## 의존성
- [의존하는 모듈 목록]

## 파일 구조
| 파일 | 역할 |
|------|------|
| ... | ... |

## 규칙
- [지켜야 할 규칙들]
```

### 6. Git 컨벤션

- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `docs:`
- **No Co-Authored-By** (사용자 지정 규칙)
- **한글 커밋 메시지** 허용

### 7. Skills + Hooks 구조 (ai-transformation 패턴 기반)

**핵심 패턴**: `clarify + HOOK 조합` + `VS Design Diverge`

```
.claude/
├── hooks/
│   └── clarify-prompt.sh   # 첫 프롬프트 시 /clarify 강제 실행
├── skills/
│   ├── clarify/SKILL.md    # 요구사항 명확화 → Plan Mode
│   └── vs-design/SKILL.md  # VS Design Diverge (프로젝트 맞춤)
└── settings.json           # hooks 설정
```

#### Hook: clarify-prompt.sh (UserPromptSubmit)

```bash
#!/bin/bash
# UserPromptSubmit Hook - 세션당 첫 프롬프트에만 /clarify 강제

set -e
INPUT=$(cat)

SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
MARKER_DIR="/tmp/claude-clarify-markers"
MARKER_FILE="$MARKER_DIR/$SESSION_ID"

mkdir -p "$MARKER_DIR"

# 이미 이 세션에서 평가했으면 스킵
if [ -f "$MARKER_FILE" ]; then
  exit 0
fi

touch "$MARKER_FILE"

cat << 'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "## MANDATORY: First Prompt Clarification\n\n**POLICY**: 세션의 첫 프롬프트는 반드시 `/clarify` 스킬을 실행해야 합니다.\n\n**ACTION REQUIRED:**\n1. 즉시 Skill tool을 사용하여 `/clarify` 스킬 실행\n2. 사용자 요청이 명확해 보여도 clarify 실행 필수\n3. clarify 없이 작업 진행 금지"
  }
}
EOF
```

#### settings.json

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/clarify-prompt.sh\""
          }
        ]
      }
    ]
  }
}
```

#### Skill 1: `/clarify` (요구사항 명확화)

```yaml
name: clarify
description: 모호한 요구사항 명확화 후 Plan Mode 진입
---

# Clarify (Meeting Context Hub)

## 실행 순서

1. 원본 요청 기록
2. AskUserQuestion으로 모호한 점 해결 (2-4개 선택지)
3. Before/After 요약
4. EnterPlanMode 호출

## Phase 1: 원본 기록

```
## Original: "{원본 요청}"
모호한 점: [scope/behavior/data/constraints 중 해당 항목]
```

## Phase 2: 질문

AskUserQuestion 사용. 한 번에 여러 질문 가능.

## Phase 3: 요약

```
## Clarified
- Goal: [목표]
- Scope: [범위]
- Constraints: [제약]
```

## Phase 4: Plan Mode 진입

```
요구사항 명확화 완료. Plan Mode로 진입합니다.
```
→ EnterPlanMode() 호출

## Meeting Context Hub 예시

**Original**: "회의록 요약 기능"

**Questions**:
1. 요약 형식? → PRD (problem/goal/scope/requirements)
2. Action Items 포함? → 예, 담당자/기한
3. 저장 위치? → Supabase + Obsidian
4. 태그 자동 생성? → 기존 태그 재활용

**Clarified**:
- Goal: 회의록 → PRD + Action Items
- Scope: PRD 추출, Action Items, 태그 생성
- Constraints: Claude API, Zod 스키마

## 규칙

- 가정 금지, 질문하기
- PRD 수준으로 구체화될 때까지 질문
- 명확화 후 반드시 EnterPlanMode 호출
```

#### Skill 2: `/vs-design` (VS Design Diverge)

```yaml
name: vs-design
description: 고품질 UI 디자인. Mode Collapse 방지, Low-Typicality 선택. 컴포넌트, 페이지, 대시보드 디자인 시 사용.
---

# VS Design Diverge (Meeting Context Hub)

## Phase 0: Context Discovery (MANDATORY)

AskUserQuestion으로 다음 차원 탐색:
1. **Emotional Tone**: 신뢰감? 엣지? 차분함?
2. **Target Audience**: 누가 사용? 기술 수준?
3. **Reference/Anti-Reference**: 참고할 것, 피할 것
4. **Business Context**: 어떤 문제 해결?

## Phase 1: Identify the Mode (Generic Baseline)

가장 예측 가능한 (P≈0.95) 디자인 명시. 이것은 선택 금지.

Meeting Context Hub 기본 패턴 (AI-slop):
- Inter 폰트, 보라색 그라디언트
- F-패턴 레이아웃, 흰 배경
- 8px border-radius 일괄 적용

## Phase 2: Sample the Long-Tail (3가지 방향)

| 방향 | T-Score | 설명 |
|------|---------|------|
| A | ~0.7 | Modern/Clean but safe |
| B | ~0.4 | Distinctive/Characterful |
| C | <0.2 | Experimental/Bold |

각 방향에 T-Score 정당화 필수.

## Phase 3: Commit to Low-Typicality

Quality Guardrails 만족하는 가장 낮은 T-Score 선택:
- Visual Hierarchy
- Contrast & Legibility (WCAG AA)
- Internal Consistency
- Functional Clarity

## Meeting Context Hub 디자인 톤

**Professional + Calm + Organized**
- 키워드: 생산성, 팀 협업, 정보 정리
- 컬러: 중립 톤 (slate, zinc) + 포인트 (blue, green)
- 타이포: JetBrains Mono (코드), Pretendard (본문)

## 도메인 컴포넌트

| 컴포넌트 | 미학 방향 |
|----------|----------|
| MeetingCard | 태그 뱃지, 날짜 메타 |
| PRDSummary | Problem/Goal/Scope 섹션 |
| ActionItemList | 체크박스, 담당자 아바타 |
| TagSelector | 칩 형태, 자동완성 |
| ContextTimeline | 타임라인/그리드 전환 |

## Final Validation

1. **Intentionality**: 모든 결정 정당화 가능?
2. **Consistency**: 자체 로직 일관성?
3. **Guardrails**: 계층/가독성/명확성?
4. **Surprise**: AI-generated lineup에서 눈에 띔?
```

#### Skill 3: `/verify` (검증 루프)

```yaml
name: verify
description: 자체 검증 루프. 빌드/린트/테스트 검증. 커밋/PR 전 필수. AI가 스스로 수정.
---

# Verify Skill (Meeting Context Hub)

## 검증 단계

```
/verify
    │
    ├─ Step 1: 빌드 검증
    │   └─ pnpm build
    │       ├─ 성공 → Step 2
    │       └─ 실패 → 에러 분석 → 코드 수정 → 재검증
    │
    ├─ Step 2: 린트 검증
    │   └─ pnpm lint
    │       ├─ 성공 → Step 3
    │       └─ 에러 → 자동 수정 → 재검증
    │
    └─ Step 3: 테스트 검증
        └─ pnpm test:run
            ├─ 성공 → 검증 완료
            └─ 실패 → 테스트/코드 수정 → 재검증
```

## 호출 시점

| 시점 | 필수 여부 |
|------|----------|
| 커밋 전 | **필수** |
| PR 생성 전 | **필수** |
| 구현 완료 후 | 권장 |

## Self-Healing Loop

```
코드 수정 → /verify → 실패? → 에러 분석 → 수정 → 재검증
                         ↓
                       (루프)
```

**핵심**: 검증 실패 시 사용자 개입 없이 Claude가 스스로 수정하고 재검증

## 명령어

```bash
pnpm build     # 빌드
pnpm lint      # 린트
pnpm lint --fix # 린트 자동 수정
pnpm test:run  # 테스트
```

## 규칙

- 커밋/PR 전 반드시 /verify 실행
- 동일 에러 3회 이상 실패 시 사용자 알림
```

#### Hook: convention-check (PreToolUse)

코드 작성 시 프로젝트 컨벤션 준수 여부 검증:

**settings.json 추가**:
```json
{
  "hooks": {
    "UserPromptSubmit": [...],
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Meeting Context Hub 컨벤션 검증:\n\n1. **Clean Architecture**: Repository 인터페이스 → Storage 구현체 분리?\n2. **네이밍**: {entity}.repository.ts, {entity}.supabase.ts, use{Name}.ts?\n3. **타입**: Zod 스키마 정의? types/ 폴더 구조?\n4. **RSC 보안**: Server Action 민감 데이터 반환 금지?\n5. **프롬프트 파일**: version 필드 포함?\n\n위반 항목이 있으면 'deny: [이유]' 반환. 모두 준수하면 'allow'."
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "작업 완료 검증:\n\n1. /verify 실행됨? (빌드/린트/테스트 통과)\n2. 관련 CLAUDE.md 업데이트됨?\n3. ai-context JSON 업데이트 필요?\n\n미완료 항목 있으면 'block: [이유]'. 모두 완료면 'approve'."
          }
        ]
      }
    ]
  }
}
```

#### 최종 스킬 + 훅 구조

```
.claude/
├── hooks/
│   └── clarify-prompt.sh       # 첫 프롬프트 → /clarify 강제
├── skills/
│   ├── clarify/SKILL.md        # 요구사항 명확화 → Plan Mode
│   ├── vs-design/SKILL.md      # VS Design Diverge
│   └── verify/SKILL.md         # 빌드/린트/테스트 검증 루프
└── settings.json               # hooks 설정 (clarify + convention + stop)
```

**워크플로우**:
```
세션 시작
    ↓
[HOOK: clarify-prompt.sh] 첫 프롬프트 감지
    ↓
[SKILL: /clarify] 요구사항 명확화
    ↓
[AUTO: EnterPlanMode] Plan Mode 진입
    ↓
계획 승인 후 구현
    ↓
[HOOK: convention-check] 코드 작성 시 컨벤션 검증
    ↓
[SKILL: /verify] 커밋 전 빌드/린트/테스트
    ↓
[HOOK: stop-check] 작업 완료 전 최종 검증
    ↓
커밋/PR
```

---

## 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ 회의록   │  │ 컨텍스트 │  │ 검색/    │  │ 설정     │    │
│  │ 입력     │  │ 입력     │  │ 트래킹   │  │          │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ /api/    │  │ /api/    │  │ /api/    │  │ /api/    │    │
│  │ meeting  │  │ context  │  │ search   │  │ sync     │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
          │              │              │              │
          ▼              ▼              ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Claude SDK  │  │ Supabase    │  │ Obsidian    │  │ Slack/Notion│
│ (AI 처리)   │  │ (DB/Auth)   │  │ (저장소)    │  │ (외부 연동) │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

## 디렉토리 구조 (Clean Architecture 적용)

```
meeting-context-hub/
├── .claude/
│   ├── ai-context/
│   │   ├── meeting-domain/
│   │   │   ├── entities.json
│   │   │   ├── glossary.json
│   │   │   └── rules.json
│   │   └── integrations/
│   │       ├── obsidian.json
│   │       ├── slack.json
│   │       └── notion.json
│   ├── commands/
│   │   └── pr.md
│   └── settings.local.json
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── page.tsx                 # 대시보드
│   │   ├── meeting/page.tsx         # 회의록 입력/요약
│   │   ├── context/page.tsx         # 컨텍스트 입력/그룹핑
│   │   ├── search/page.tsx          # 검색/트래킹
│   │   ├── api/
│   │   │   ├── meeting/route.ts
│   │   │   ├── context/route.ts
│   │   │   ├── search/route.ts
│   │   │   └── sync/
│   │   │       ├── slack/route.ts
│   │   │       └── notion/route.ts
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                      # shadcn/ui 컴포넌트
│   │   ├── features/
│   │   │   ├── meeting/             # 회의록 관련
│   │   │   ├── context/             # 컨텍스트 관련
│   │   │   └── search/              # 검색 관련
│   │   └── CLAUDE.md
│   ├── hooks/                       # 커스텀 React Hooks
│   │   ├── useMeeting.ts
│   │   ├── useContext.ts
│   │   ├── useTag.ts
│   │   └── CLAUDE.md
│   ├── repositories/                # Domain Layer (인터페이스)
│   │   ├── meeting.repository.ts
│   │   ├── context.repository.ts
│   │   ├── tag.repository.ts
│   │   ├── types/                   # 엔티티 타입
│   │   │   ├── meeting.types.ts
│   │   │   ├── context.types.ts
│   │   │   └── tag.types.ts
│   │   └── CLAUDE.md
│   ├── storage/                     # Infrastructure Layer (구현체)
│   │   ├── supabase/
│   │   │   ├── meeting.supabase.ts
│   │   │   ├── context.supabase.ts
│   │   │   ├── tag.supabase.ts
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   ├── obsidian/
│   │   │   └── obsidian.storage.ts
│   │   └── CLAUDE.md
│   ├── application/                 # Application Layer (UseCase)
│   │   ├── summarize-meeting.usecase.ts
│   │   ├── extract-tags.usecase.ts
│   │   ├── search-context.usecase.ts
│   │   └── CLAUDE.md
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── claude.ts            # Claude SDK 래퍼
│   │   │   ├── prompts/
│   │   │   │   ├── meeting-summary.prompt.ts
│   │   │   │   ├── context-tagging.prompt.ts
│   │   │   │   └── qa-search.prompt.ts
│   │   │   └── CLAUDE.md
│   │   ├── external/
│   │   │   ├── slack.ts             # Slack API
│   │   │   └── notion.ts            # Notion API
│   │   └── utils.ts
│   └── types/                       # 공통 타입 (deprecated → repositories/types/)
├── supabase/
│   └── migrations/
├── CLAUDE.md                        # 루트 프로젝트 가이드
├── .env.local.example
└── package.json
```

## 데이터베이스 스키마

```sql
-- 사용자 (Supabase Auth 연동)
-- auth.users 테이블 사용

-- 태그
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 회의록
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  raw_content TEXT NOT NULL,
  prd_summary JSONB,        -- { problem, goal, scope, requirements }
  action_items JSONB,       -- [{ assignee, task, deadline }]
  obsidian_path TEXT,       -- 옵시디언 저장 경로
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 컨텍스트
CREATE TABLE contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  source TEXT NOT NULL,     -- 'slack', 'notion', 'manual', 'meeting'
  source_id TEXT,           -- 원본 ID (슬랙 메시지 ID 등)
  content TEXT NOT NULL,
  obsidian_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 컨텍스트-태그 연결
CREATE TABLE context_tags (
  context_id UUID REFERENCES contexts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (context_id, tag_id)
);

-- 회의록-태그 연결
CREATE TABLE meeting_tags (
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (meeting_id, tag_id)
);
```

## 구현 단계

### Phase 1: 프로젝트 셋업 ✅ 완료
1. ✅ Next.js 프로젝트 생성 (App Router)
2. ✅ Supabase 프로젝트 연결
3. ✅ 환경변수 설정
4. ✅ DB 마이그레이션 적용
5. ✅ 인증 (Supabase Auth) 구현

### Phase 2: 핵심 인프라 ✅ 완료
1. ✅ Claude SDK 래퍼 구현
2. ✅ 저장소 인터페이스 정의 (추상화 레이어)
3. ✅ 옵시디언 저장소 구현체
4. ✅ Supabase 저장소 구현체

### Phase 3: 회의록 요약 기능 ✅ 완료
1. ✅ 회의록 입력 UI
2. ✅ PRD 추출 프롬프트 및 API
3. ✅ Action Items 추출 프롬프트 및 API
4. ✅ 옵시디언 마크다운 생성/저장
5. ✅ DB 저장

### Phase 4: 컨텍스트 그룹핑 기능 ✅ 완료
1. ✅ 컨텍스트 입력 UI (수동)
2. ✅ 자동 태깅 프롬프트 및 API
3. ✅ 태그 생성/재활용 로직
4. ✅ 옵시디언 저장 (frontmatter 포함)
5. ✅ DB 저장

### Phase 5: 외부 연동 ✅ 완료
1. ✅ Slack API 연동 (메시지 읽기)
2. ✅ Notion API 연동 (페이지 읽기)
3. ✅ 연동 설정 UI (`/settings` 페이지)

### Phase 6: 검색/트래킹 ✅ 완료
1. ✅ 프로젝트별 진행 상황 조회 UI
2. ✅ Q&A 검색 기능 (Claude 활용)
3. ✅ 대시보드 UI

---

## 전면 재설계 (2026-01)

### 재설계 Phase 1: 도메인 모델 ✅ 완료
1. ✅ 신규 엔티티 Zod 스키마 (Sprint, Project, Squad, ActionItem)
2. ✅ Repository 인터페이스 정의
3. ✅ Supabase 구현체 작성
4. ✅ 기존 엔티티 확장 (Meeting, Context, Tag에 FK 추가)

### 재설계 Phase 2: 아키텍처 개선 ✅ 완료
1. ✅ UseCase Factory 패턴 도입 (`src/application/factories.ts`)
2. ✅ Custom Hooks 구현 (useMeetings, useContexts, useSprints, useActionItems)
3. ✅ Repository/UseCase 통합 export 정리

### 재설계 Phase 3: 기능 완성 ✅ 완료
**P0 (핵심)**
1. ✅ 회의록 수정/삭제 UI (Dialog + AlertDialog)
2. ✅ PATCH API 메서드 추가
3. ✅ 태그 편집 기능 (TagSelector 컴포넌트)

**P1 (중요)**
1. ✅ 검색 결과 출처 클릭 → 상세 페이지 이동
2. ✅ URL 기반 페이지네이션 (대시보드)
3. ✅ Skeleton 로딩 (meeting, sprint 상세 페이지)

**스프린트 관리**
1. ✅ 스프린트 목록/생성/상세 페이지
2. ✅ 액션아이템 상태 관리 (체크박스)
3. ✅ 스프린트 상태 변경 (planning → active → completed)

### 재설계 Phase 4: DB 마이그레이션 ✅ 완료
1. ✅ squads 테이블 생성
2. ✅ projects 테이블 생성
3. ✅ sprints 테이블 생성
4. ✅ action_items 테이블 생성
5. ✅ meetings 테이블 확장 (sprint_id, project_id, meeting_type 등)
6. ✅ contexts 테이블 확장 (sprint_id, context_type, importance 등)
7. ✅ tags 테이블 확장 (tag_type, scope, scope_id 등)
8. ✅ 인덱스 생성 (idx_*_sprint, idx_*_project 등)
9. ✅ RLS 활성화

### 재설계 Phase 5: 문서 최신화 ✅ 완료
1. ✅ glossary.json 업데이트 (신규 용어)
2. ✅ entities.json 상세화 (DB 스키마 반영)
3. ✅ rules.json 워크플로우 추가 (project/squad/action_item lifecycle)
4. ✅ src/repositories/CLAUDE.md 메서드 문서화
5. ✅ PLAN.md 완료 상태 업데이트

---

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `src/lib/ai/claude.ts` | Claude SDK 초기화 및 래퍼 |
| `src/lib/ai/prompts/meeting-summary.ts` | 회의록 → PRD/Action Items 프롬프트 |
| `src/lib/ai/prompts/context-tagging.ts` | 컨텍스트 → 태그 추출 프롬프트 |
| `src/lib/storage/interface.ts` | 저장소 추상화 인터페이스 |
| `src/lib/storage/obsidian.ts` | 옵시디언 파일 읽기/쓰기 |
| `src/app/api/meeting/route.ts` | 회의록 처리 API |
| `src/app/api/context/route.ts` | 컨텍스트 처리 API |

## 검증 방법

1. **회의록 요약**: 샘플 회의록 텍스트 입력 → PRD + Action Items 출력 확인 → 옵시디언 파일 생성 확인
2. **컨텍스트 그룹핑**: 여러 텍스트 입력 → 자동 태그 생성 확인 → 동일 주제 재입력 시 태그 재활용 확인
3. **검색**: "프로젝트 X 어디까지 했지?" 질문 → 관련 컨텍스트 기반 답변 확인
4. **팀 사용**: 다른 계정으로 로그인 → 데이터 공유 확인

## 환경변수

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Claude
ANTHROPIC_API_KEY=

# Obsidian
OBSIDIAN_VAULT_PATH=/Users/jaehojang/Documents

# External APIs (선택)
SLACK_BOT_TOKEN=
NOTION_API_KEY=
```
