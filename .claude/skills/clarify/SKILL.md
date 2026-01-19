---
name: clarify
description: 모호한 요구사항 명확화 후 Plan Mode 자동 진입. 세션 첫 프롬프트에 필수 호출.
---

# Clarify (Meeting Context Hub)

요구사항을 명확화하고 Plan Mode로 자동 진입하는 스킬.

## 워크플로우

```
/clarify
    │
    ├─ Phase 1: 원본 기록
    │   └─ 원본 요청 그대로 기록
    │
    ├─ Phase 2: 질문
    │   └─ AskUserQuestion으로 모호점 해결
    │
    ├─ Phase 3: 요약
    │   └─ Before/After 비교
    │
    └─ Phase 4: Plan Mode 자동 진입
        └─ EnterPlanMode() 호출
```

## Phase 1: 원본 기록

```markdown
## Original Requirement
"{원본 요청 그대로}"

식별된 모호점:
- Scope: [범위가 불명확한 부분]
- Behavior: [동작이 불명확한 부분]
- Data: [데이터 형식이 불명확한 부분]
- Constraints: [제약조건이 불명확한 부분]
```

## Phase 2: 질문

AskUserQuestion 도구 사용. 한 번에 여러 질문 가능.

**질문 설계 원칙**:
- 구체적 > 추상적
- 선택지 제공 > 열린 질문
- 한 번에 하나의 관심사

```
AskUserQuestion:
question: "어떤 인증 방식을 사용할까요?"
options:
  - label: "Supabase Auth (추천)"
    description: "이메일/비밀번호 + OAuth"
  - label: "NextAuth"
    description: "다양한 프로바이더 지원"
```

## Phase 3: 요약

```markdown
## Requirement Clarification Summary

### Before (Original)
"{원본 요청}"

### After (Clarified)
**Goal**: [정확한 목표]
**Scope**: [포함/제외 범위]
**Constraints**: [제약조건]
**Success Criteria**: [완료 기준]

**Decisions Made**:
| Question | Decision |
|----------|----------|
| [질문 1] | [결정] |
| [질문 2] | [결정] |
```

## Phase 4: Plan Mode 자동 진입

명확화 완료 후 **반드시** EnterPlanMode 호출:

```
요구사항 명확화 완료. Plan Mode로 진입합니다.
```
→ `EnterPlanMode()` 호출

**중요**: clarify 완료 후 사용자에게 묻지 않고 자동으로 Plan Mode 진입.

## Meeting Context Hub 예시

### 입력
```
"회의록 요약 기능 구현해줘"
```

### Phase 2 질문들

```
AskUserQuestion:
1. 요약 형식? → PRD (problem/goal/scope/requirements)
2. Action Items 포함? → 예, 담당자/기한
3. 저장 위치? → Supabase + Obsidian
4. 태그 자동 생성? → 기존 태그 재활용
```

### Phase 3 요약

```markdown
### Before
"회의록 요약 기능 구현해줘"

### After
**Goal**: 회의록 텍스트를 PRD 형식으로 요약 + Action Items 추출
**Scope**:
- 포함: PRD 추출, Action Items, 자동 태깅, Obsidian 저장
- 제외: 음성 인식, 실시간 녹음
**Constraints**: Claude API 사용, Zod 스키마 검증
**Success Criteria**: 회의록 입력 시 PRD + Action Items 생성되어 저장됨
```

### Phase 4

```
요구사항 명확화 완료. Plan Mode로 진입합니다.
```
→ EnterPlanMode() 호출

## 규칙

1. **가정 금지**: 불명확하면 질문하기
2. **PRD 수준**: 구현 가능할 정도로 구체화
3. **자동 진입**: 명확화 후 반드시 EnterPlanMode 호출
4. **Plan 참조**: 기존 PLAN.md, implementation-plan.md 확인

## 다음 단계

Plan Mode에서 계획 작성 후:
- 사용자 승인
- `/implement` 스킬로 구현 시작
