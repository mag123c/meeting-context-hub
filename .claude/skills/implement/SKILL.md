---
name: implement
description: 작업 오케스트레이션 스킬. 분석 → 구현 → 검증 → 커밋까지 전체 워크플로우 관리. 기능 개발, 버그 수정 등 모든 코드 작업에 사용.
---

# Implement Skill

통합 워크플로우 오케스트레이션. 작업 분석부터 Git 커밋까지 전체 사이클 관리.

## 워크플로우

```
/implement "작업 설명"
    │
    ├─ Phase 1: 분석
    │   ├─ 요구사항 파악 (Plan 문서 참조)
    │   ├─ 영향받는 파일 식별
    │   ├─ 작업 타입 결정 (feat/fix/refactor)
    │   └─ 브랜치 생성
    │
    ├─ Phase 2: 구현
    │   ├─ Clean Architecture 준수
    │   ├─ 네이밍 컨벤션 준수
    │   └─ 기능 단위로 중간 커밋
    │
    ├─ Phase 3: 검증 (/verify)
    │   ├─ pnpm build
    │   ├─ pnpm lint
    │   └─ 실패 시 수정 → 재검증 (Self-Healing Loop)
    │
    └─ Phase 4: 마무리
        ├─ 최종 커밋
        ├─ CLAUDE.md / ai-context 업데이트 (필요시)
        └─ (선택) PR 생성 안내
```

## Phase 1: 분석

### Plan 문서 확인

구현 전 반드시 Plan 문서 확인:
- `.claude/plans/implementation-plan.md`
- `PLAN.md` (상세 계획)

### 작업 타입 판별

| 타입 | 브랜치 접두사 | 설명 |
|------|---------------|------|
| 새 기능 | `feat/` | 새로운 기능 추가 |
| 버그 수정 | `fix/` | 버그 수정 |
| 리팩토링 | `refactor/` | 코드 개선 (기능 변경 없음) |
| 문서 | `docs/` | 문서 작성/수정 |
| 스타일 | `style/` | 코드 포맷팅 |
| 테스트 | `test/` | 테스트 추가/수정 |

### 브랜치 생성

```bash
git checkout -b {타입}/{kebab-case-설명}
# 예시: feat/meeting-summary, fix/tag-duplicate
```

### 분석 체크리스트

- [ ] 요구사항 명확히 이해 (Plan 문서 참조)
- [ ] 영향받는 파일/모듈 식별
- [ ] Clean Architecture 레이어 확인
- [ ] 작업 단위 분할 (커밋 단위)

## Phase 2: 구현

### 아키텍처 준수

```
Presentation → Application → Domain → Infrastructure
components/   application/   repositories/   storage/
hooks/                       types/          lib/
app/
```

### 네이밍 컨벤션

| 구분 | 패턴 |
|------|------|
| 컴포넌트 | `PascalCase.tsx` |
| Hooks | `use{Name}.ts` |
| Repository 인터페이스 | `{entity}.repository.ts` |
| Repository 구현체 | `{entity}.{provider}.ts` |
| UseCase | `{action}-{entity}.usecase.ts` |
| 프롬프트 | `{purpose}.prompt.ts` |
| 타입 | `{entity}.types.ts` |

### 기능 단위 커밋

구현 중 의미 있는 단위마다 커밋:

```bash
git add <관련 파일들>
git commit -m "{타입}: {설명}"
```

**커밋 메시지 규칙** (Conventional Commits):
```
feat: 회의록 요약 API 구현
fix: 태그 중복 생성 버그 수정
refactor: Claude SDK 래퍼 정리
```

**커밋 단위 기준**:
- 하나의 논리적 변경 = 하나의 커밋
- 롤백 시 독립적으로 되돌릴 수 있는 단위
- 너무 작지 않게 (파일 하나씩 X)
- 너무 크지 않게 (전체 기능 한 번에 X)

## Phase 3: 검증

### /verify 스킬 호출

구현 완료 후 반드시 `/verify` 호출:

```
/verify
    ├─ pnpm build    # 빌드 확인
    ├─ pnpm lint     # 린트 확인
    └─ 실패 시 → 수정 → 재검증
```

### Self-Healing Loop

```
구현 → /verify → 실패? → 에러 분석 → 수정 → 재검증
                   ↓
                 (루프)
```

**핵심**: 검증 실패 시 사용자 개입 없이 스스로 수정하고 재검증.
동일 에러 3회 이상 실패 시 사용자에게 알림.

## Phase 4: 마무리

### 문서 업데이트 체크

| 변경 유형 | 업데이트 대상 |
|----------|--------------|
| 새 도메인 용어 | `ai-context/meeting-domain/glossary.json` |
| 엔티티 변경 | `ai-context/meeting-domain/entities.json` |
| 비즈니스 규칙 | `ai-context/meeting-domain/rules.json` |
| 새 디렉토리 | 해당 디렉토리에 `CLAUDE.md` 작성 |

### 최종 커밋

```bash
git add .
git commit -m "{타입}: {전체 작업 요약}"
```

### PR 안내 (선택)

```bash
git push -u origin {브랜치명}
gh pr create --title "{제목}" --body "{설명}"
```

## 예시

### 입력
```
/implement PLAN.md Phase 3 - 회의록 요약 기능 구현
```

### 실행 흐름

```
1. 분석
   - Plan 확인: Phase 3 요구사항
   - 타입: feat (새 기능)
   - 브랜치: feat/meeting-summary
   - 영향: application/, storage/, lib/ai/

2. 구현
   - summarize-meeting.usecase.ts
   - meeting-summary.prompt.ts
   - meeting.supabase.ts 확장
   - 커밋: "feat: 회의록 요약 UseCase 구현"

3. 검증
   - /verify 호출
   - pnpm build ✓
   - pnpm lint ✓

4. 마무리
   - ai-context 업데이트 (필요시)
   - 최종 커밋
```

## 주의사항

- **Co-Authored-By 금지**: Claude/AI 마킹 절대 금지
- **git -C 금지**: working directory에서 직접 실행
- **브랜치 보호**: main 직접 커밋 금지
- **빌드 확인**: 커밋 전 반드시 /verify 실행
- **Plan 참조**: 구현 전 Plan 문서 확인 필수
