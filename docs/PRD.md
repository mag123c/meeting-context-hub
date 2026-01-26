# Meeting Context Hub - Product Requirements Document

## Problem Statement

### Context

개발자들은 다양한 병렬 작업(스쿼드, 팀, 개인 프로젝트)을 진행합니다. 각 작업에서는 수많은 구두 논의가 발생합니다:

- 정책 결정 ("우리는 이 경우에 A 방식으로 처리하기로 했어")
- 방향성 합의 ("이 기능은 MVP에서 제외하고 v2에서 다루자")
- 컨벤션 정의 ("에러 코드는 E001 형식으로 통일하자")
- 엣지 케이스 처리 ("사용자가 로그아웃 상태에서 접근하면 리다이렉트")

### 문제

1. **기억의 한계**: 여러 프로젝트를 오가며 모든 세부 논의를 기억하기 불가능
2. **문서화 누락**: 회의 중 결정된 사항이 문서로 남지 않음
3. **컨텍스트 스위칭 비용**: 프로젝트 복귀 시 이전 논의 내용 파악에 시간 소요
4. **관련 정보 분산**: 연관된 논의가 서로 연결되지 않음

### 현재 상황

대부분의 논의가 구두로 진행되고 휘발됩니다. 회의록이 있더라도 개발 관점에서 필요한 정보(결정사항, 액션아이템, 정책)만 추출하기 어렵습니다.

---

## Solution

### 핵심 컨셉

**논의 → 개발 Artifact → 체이닝**

1. 논의 내용을 입력 (텍스트, 향후 오디오)
2. AI가 개발에 필요한 정보만 추출하여 구조화
3. 임베딩 기반으로 관련 논의를 자동 연결

### 제품 형태

- **TUI (Terminal User Interface)** 기반
- OS 독립적 (macOS, Linux, Windows)
- 로컬 우선 (SQLite)
- 향후 GUI 확장 가능한 아키텍처

---

## Core Features (MVP - v0.1~v0.2)

### 1. Add Context

**사용자 흐름:**
1. TUI 실행 → "Add Context" 선택
2. 프로젝트 선택 (또는 새로 생성)
3. 논의 내용 텍스트 입력
4. AI가 자동 추출 및 저장
5. 관련 컨텍스트 표시 (있는 경우)

**AI 추출 결과:**
```typescript
interface ExtractedContext {
  title: string;              // AI 생성 제목
  summary: string;            // 1-2문장 요약
  decisions: string[];        // 결정된 사항
  actionItems: ActionItem[];  // 할 일
  policies: string[];         // 정책/컨벤션
  openQuestions: string[];    // 열린 질문
  tags: string[];             // 자동 태그
}

interface ActionItem {
  task: string;
  assignee?: string;
  dueDate?: string;
}
```

### 2. Search Context

**검색 방식:**
- **의미론적 검색**: 임베딩 기반 유사도 검색
- **키워드 검색**: 정확한 텍스트 매칭

**사용자 흐름:**
1. "Search" 선택
2. 검색어 입력
3. 결과 목록 표시 (유사도 순)
4. 항목 선택하여 상세 보기

### 3. List Contexts

**필터 옵션:**
- 프로젝트별
- 태그별
- 날짜 범위

**정렬:**
- 최신순 (기본)
- 유사도순

### 4. Context Chaining

**자동 연결:**
- 새 컨텍스트 추가 시 관련 컨텍스트 자동 표시
- 상세 화면에서 "Related Contexts" 섹션
- 임베딩 코사인 유사도 기반 (threshold: 0.7)

### 5. Project Management

**기능:**
- 프로젝트 생성/수정/삭제
- 프로젝트별 컨텍스트 그룹화
- 프로젝트 설명 추가 가능

---

## Non-Goals (MVP)

다음 기능은 MVP에서 제외:

| Feature | 이유 | 계획 |
|---------|------|------|
| 이미지 처리 | 핵심 기능 아님 | 미정 |
| 파일 처리 (csv, json) | 핵심 기능 아님 | 미정 |
| 오디오 녹음/변환 | 복잡성 높음 | v0.3 |
| CLI 인터페이스 | TUI에 집중 | 제외 |
| Obsidian 연동 | 외부 의존성 | 미정 |
| 실시간 협업 | 로컬 우선 | 미정 |

---

## Technical Requirements

### OS Independence

**제거할 macOS 의존성:**
- Keychain (보안 저장소) → 환경변수
- sox/ffmpeg (오디오 처리) → Whisper API 직접 전송

**크로스 플랫폼:**
- Node.js 20+ 기반
- SQLite (better-sqlite3)
- 파일 경로 표준화 (path.join)

### API Keys

```bash
# 환경변수로 관리
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx

# 선택적 설정
MCH_DB_PATH=~/.mch/data.db
MCH_LANGUAGE=ko
```

### Data Storage

**SQLite 사용 이유:**
- 설치 불필요 (embedded)
- 크로스 플랫폼
- 단일 파일 백업 용이
- 복잡한 쿼리 지원

---

## User Stories

### US-1: 회의 후 내용 기록
> 개발자로서, 회의가 끝난 후 논의 내용을 빠르게 입력하고 싶다. 그래야 중요한 결정사항을 잃어버리지 않는다.

**인수 조건:**
- [ ] 텍스트 입력 후 3초 내 AI 추출 완료
- [ ] 결정사항, 액션아이템, 정책이 자동 분류됨
- [ ] 저장 후 확인 메시지 표시

### US-2: 이전 논의 검색
> 개발자로서, "결제 정책"에 대해 논의했던 내용을 찾고 싶다. 그래야 일관된 구현을 할 수 있다.

**인수 조건:**
- [ ] "결제"로 검색 시 관련 컨텍스트 모두 표시
- [ ] 유사도 높은 순으로 정렬
- [ ] 검색 결과에서 바로 상세 보기 가능

### US-3: 프로젝트별 컨텍스트 관리
> 개발자로서, 프로젝트별로 컨텍스트를 분리해서 보고 싶다. 그래야 다른 프로젝트 정보와 혼동하지 않는다.

**인수 조건:**
- [ ] 프로젝트 선택 시 해당 프로젝트 컨텍스트만 표시
- [ ] 새 컨텍스트 추가 시 프로젝트 선택 가능
- [ ] 프로젝트 없이도 컨텍스트 추가 가능 (Uncategorized)

### US-4: 관련 논의 발견
> 개발자로서, 새 논의를 추가할 때 관련된 이전 논의를 보고 싶다. 그래야 맥락을 파악하고 일관성을 유지할 수 있다.

**인수 조건:**
- [ ] 컨텍스트 추가 후 관련 항목 3-5개 표시
- [ ] 상세 화면에서 관련 컨텍스트 링크
- [ ] 관련 항목 클릭 시 해당 상세 화면으로 이동

---

## Success Metrics

### 정량적 지표
- 컨텍스트 추가 소요 시간: < 30초
- AI 추출 정확도: 사용자 수정률 < 20%
- 검색 관련성: 상위 5개 결과 중 관련 항목 비율 > 80%

### 정성적 지표
- 컨텍스트 스위칭 시 이전 논의 찾기 용이
- 결정사항 누락으로 인한 재작업 감소
- 논의 내용 문서화 습관 형성

---

## Release Plan

| Version | Focus | Target |
|---------|-------|--------|
| v0.1 | Core TUI + Text Input | Week 1-2 |
| v0.2 | Search + Chaining | Week 3-4 |
| v0.3 | Audio File Support | Week 5-6 |
| v0.4 | Polish + GUI 준비 | Week 7-8 |

---

## Appendix

### A. Competitive Analysis

| Tool | 장점 | 단점 |
|------|------|------|
| Notion | 범용 문서화 | 개발 특화 아님 |
| Obsidian | 로컬, 마크다운 | 수동 입력 필요 |
| Otter.ai | 자동 전사 | 개발 artifact 추출 불가 |

### B. Glossary

- **Context**: 하나의 논의 단위 (회의, 대화, 메모 등)
- **Artifact**: AI가 추출한 개발 관련 정보 (Decisions, Actions, Policies)
- **Chaining**: 임베딩 기반 관련 컨텍스트 연결
