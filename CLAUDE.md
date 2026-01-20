# Meeting Context Hub

CLI 도구: 멀티모달 입력(텍스트/이미지/음성/파일/회의록)을 AI로 처리하여 Obsidian에 저장. 태그 + 임베딩으로 연관성 체이닝.

## Quick Start

```bash
# API 키 설정 (macOS 키체인)
mch config set ANTHROPIC_API_KEY sk-ant-xxx
mch config set OPENAI_API_KEY sk-xxx

# 또는 환경변수 (폴백)
cp .env.local.example .env.local

# 설치 및 빌드
pnpm install
pnpm build

# 사용
mch add -t "회의 내용..."
mch add -m ./meeting.txt       # 회의록 요약
mch search "키워드"
mch list --tag "회의"
```

---

## CLI 명령어

```bash
mch add                          # 대화형 모드
mch add -t "텍스트"              # 텍스트 추가
mch add -i ./image.png           # 이미지 (Claude Vision)
mch add -a ./audio.mp3           # 음성 (Whisper)
mch add -f ./data.csv            # 파일 (txt, md, csv, json)
mch add -m ./meeting.txt         # 회의록 (PRD 요약 + Action Items)

mch search "키워드"              # 의미론적 검색 (임베딩 유사도, 기본)
mch search "키워드" --exact      # 정확한 텍스트 매칭 검색
mch search --similar <id>        # 특정 문서와 유사한 문서 검색
mch search --tag "회의"          # 태그 필터

mch list                         # 전체 목록
mch list --tag "회의"            # 태그 필터
mch list --type text             # 타입 필터

mch config show                  # 설정 확인
mch config set <KEY> <value>     # API 키 설정 (키체인)
mch config check                 # API 키 상태 확인
```

### 회의록 출력 형식

`mch add -m` 명령은 회의 녹취록을 분석하여 다음 형식으로 저장:

```markdown
# 회의 제목

**일시**: YYYY-MM-DD
**참석자**: 이름(역할), ...

## 📋 회의 요약
## 🎯 핵심 결정사항
## ✅ Action Items (테이블)
## 💡 주요 논의 포인트
## ❓ 미해결 이슈
## 📅 다음 단계
```

---

## Git Convention

### 브랜치 전략

| 타입 | 브랜치 접두사 | 설명 |
|------|---------------|------|
| 새 기능 | `feat/` | 새로운 기능 추가 |
| 버그 수정 | `fix/` | 버그 수정 |
| 리팩토링 | `refactor/` | 코드 개선 |
| 문서 | `docs/` | 문서 작성/수정 |

### 커밋 메시지 (Conventional Commits)

```
{타입}: {설명}

# 예시
feat: 이미지 분석 기능 추가
fix: 임베딩 유사도 계산 버그 수정
```

**규칙**:
- 한글 커밋 메시지 허용
- **Co-Authored-By 금지** (Claude/AI 마킹 절대 금지)
- main 직접 커밋 금지 (브랜치에서 작업)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│   CLI Layer                                                  │
│   cli/commands/ → 사용자 입력 처리                           │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│   Application Layer                                          │
│   core/ (UseCases + Factories)                               │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│   Domain Layer                                               │
│   repositories/ (인터페이스) + types/ (엔티티 + Zod 스키마)  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│   Infrastructure Layer                                       │
│   storage/ (Obsidian 구현체) + ai/ (Claude, Whisper, Embed) │
└─────────────────────────────────────────────────────────────┘
```

## Structure

```
src/
├── cli/
│   ├── index.ts            # 진입점 (bin)
│   └── commands/
│       ├── add.command.ts
│       ├── search.command.ts
│       ├── list.command.ts
│       └── config.command.ts
│
├── core/                   # Application Layer
│   ├── add-context.usecase.ts
│   ├── summarize-meeting.usecase.ts
│   ├── search-context.usecase.ts
│   └── factories.ts        # DI Factory
│
├── repositories/           # Domain Layer (인터페이스)
│   └── context.repository.ts
│
├── types/                  # Domain Layer (타입 + Zod 스키마)
│   ├── context.types.ts
│   ├── context.schema.ts
│   ├── meeting.types.ts
│   ├── meeting.schema.ts
│   ├── prompt.types.ts
│   ├── tag.types.ts
│   └── config.types.ts
│
├── storage/                # Infrastructure (Obsidian)
│   └── obsidian/
│       ├── context.obsidian.ts
│       └── frontmatter.ts
│
├── ai/                     # Infrastructure (AI 클라이언트)
│   ├── clients/
│   │   ├── claude.client.ts
│   │   ├── whisper.client.ts
│   │   └── embedding.client.ts
│   └── prompts/
│       ├── tagging.prompt.ts
│       ├── summarize.prompt.ts
│       └── meeting-summary.prompt.ts
│
├── input/                  # 입력 핸들러
│   ├── text.handler.ts
│   ├── image.handler.ts
│   ├── audio.handler.ts
│   ├── file.handler.ts
│   └── meeting.handler.ts
│
└── config/
    ├── config.ts
    ├── keychain.ts         # macOS 키체인 통합
    └── env.ts
```

---

## Naming Convention

| 구분 | 패턴 | 예시 |
|------|------|------|
| Repository 인터페이스 | `{entity}.repository.ts` | `context.repository.ts` |
| Repository 구현체 | `{entity}.obsidian.ts` | `context.obsidian.ts` |
| UseCase | `{action}-{entity}.usecase.ts` | `add-context.usecase.ts`, `summarize-meeting.usecase.ts` |
| AI 클라이언트 | `{provider}.client.ts` | `claude.client.ts` |
| 프롬프트 | `{purpose}.prompt.ts` | `tagging.prompt.ts`, `meeting-summary.prompt.ts` |
| 타입 | `{entity}.types.ts` | `context.types.ts`, `meeting.types.ts` |
| Zod 스키마 | `{entity}.schema.ts` | `context.schema.ts`, `meeting.schema.ts` |
| CLI 명령어 | `{name}.command.ts` | `add.command.ts` |
| 입력 핸들러 | `{type}.handler.ts` | `image.handler.ts`, `meeting.handler.ts` |

---

## Core Rules

1. **Clean Architecture**: Repository 인터페이스 → Storage 구현체 분리
2. **선언형 프롬프트**: ai/prompts에 version 필드 포함
3. **Zod 스키마**: types/에 스키마 정의
4. **디렉토리 문서화**: 새 디렉토리 생성 시 CLAUDE.md 작성

---

## Commands

```bash
pnpm dev          # 개발 모드 (tsx)
pnpm build        # TypeScript 빌드
pnpm lint         # ESLint 실행
pnpm start        # 빌드된 CLI 실행
```

---

## 환경변수 & 키체인

### macOS 키체인 우선

API 키는 macOS 키체인에서 가져오고, 없으면 환경변수 폴백:

```bash
# 키체인 등록
mch config set ANTHROPIC_API_KEY sk-ant-xxx
mch config set OPENAI_API_KEY sk-xxx

# 또는 직접 등록
security add-generic-password -s "mch" -a "ANTHROPIC_API_KEY" -w "sk-ant-xxx"
```

### 기본값

| 설정 | 기본값 |
|------|--------|
| OBSIDIAN_VAULT_PATH | `~/Library/Mobile Documents/iCloud~md~obsidian/Documents` |
| MCH_FOLDER | `mch` |

### .env.local (폴백용)

```bash
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
OBSIDIAN_VAULT_PATH=~/path/to/vault
MCH_FOLDER=mch
```

---

## Obsidian 통합

### 파일 구조

컨텍스트는 `{VAULT}/{MCH_FOLDER}/{sanitized-summary}_{short-id}.md` 형식으로 저장:

**파일명 규칙**:
- summary 앞 30자 + UUID 앞 8자
- 특수문자 제거, 공백 → 하이픈
- 예: `회의록-요약-테스트_a1b2c3d4.md`
- 구버전 UUID 파일명 호환성 유지

```markdown
---
id: uuid
type: text
summary: 요약 내용
tags:
  - 태그1
  - 태그2
embedding: [0.1, 0.2, ...]
createdAt: 2024-01-01T00:00:00.000Z
updatedAt: 2024-01-01T00:00:00.000Z
---

실제 컨텍스트 내용
```

### 시각화

- **Graph View**: 태그 기반 연결 확인
- **Dataview**: 커스텀 쿼리로 목록 조회
