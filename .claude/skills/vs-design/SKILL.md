---
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
