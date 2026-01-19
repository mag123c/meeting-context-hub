---
name: mch-wrap
description: Meeting Context Hub 세션 마무리. 문서 최신화 중심.
---

# MCH Wrap

Meeting Context Hub 프로젝트 전용 세션 마무리. 문서 최신화에 집중.

## 실행 순서

1. git status/diff 확인
2. 문서 최신화 분석 (Task 에이전트)
3. 결과 통합 및 사용자 선택
4. 선택된 작업 실행

## Phase 1: Git 상태

```bash
git status --short
git diff --stat HEAD~3
```

## Phase 2: 문서 최신화 분석

Task(subagent_type="Explore")로 분석:

### AI Context (.claude/ai-context/)

| 변경 유형 | 대상 |
|----------|------|
| 도메인 용어 | .claude/ai-context/meeting-domain/glossary.json |
| 엔티티 정의 | .claude/ai-context/meeting-domain/entities.json |
| 비즈니스 규칙 | .claude/ai-context/meeting-domain/rules.json |
| Obsidian 설정 | .claude/ai-context/integrations/obsidian.json |
| Slack 연동 | .claude/ai-context/integrations/slack.json |
| Notion 연동 | .claude/ai-context/integrations/notion.json |

### 프로젝트 문서

| 변경 유형 | 대상 |
|----------|------|
| 아키텍처 | CLAUDE.md → Architecture |
| 네이밍 컨벤션 | CLAUDE.md → Naming Convention |
| 핵심 규칙 | CLAUDE.md → Core Rules |
| 모듈별 가이드 | src/*/CLAUDE.md |

### 모듈별 CLAUDE.md

| 모듈 | 체크 항목 |
|------|----------|
| repositories/ | 인터페이스 목록, 규칙 |
| hooks/ | 훅 목록, 사용법 |
| lib/ai/ | 프롬프트 목록, 버전 |
| storage/ | 구현체 목록, 전환 방법 |
| application/ | UseCase 목록 |

## Phase 3: 사용자 선택

AskUserQuestion:
- 문서 업데이트 실행
- 커밋 생성
- 둘 다
- 건너뛰기

## Phase 4: 실행

선택된 작업 수행.

## 추가 체크리스트

- [ ] Zod 스키마 버전 일관성
- [ ] 프롬프트 version 필드 업데이트
- [ ] 환경변수 .env.local.example 동기화
