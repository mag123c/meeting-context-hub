---
name: implement
description: Task orchestration skill. Manages full workflow from analysis → implementation → verification → commit. Use for feature dev, bug fixes, and all code work.
---

# Implement Skill

Unified workflow orchestration. Manages entire cycle from task analysis to Git commit.

## Workflow

```
/implement "task description"
    │
    ├─ Phase 1: Analysis
    │   ├─ Understand requirements (reference Plan docs)
    │   ├─ Identify affected files
    │   ├─ Determine task type (feat/fix/refactor)
    │   └─ Create branch
    │
    ├─ Phase 2: TDD Implementation (RED → GREEN → REFACTOR)
    │   ├─ RED: Write failing test first
    │   ├─ GREEN: Write minimal code to pass
    │   ├─ REFACTOR: Clean up while tests pass
    │   └─ Intermediate commits per feature unit
    │
    ├─ Phase 3: Verification (/verify)
    │   ├─ pnpm test (TDD tests must pass)
    │   ├─ pnpm build
    │   ├─ pnpm lint
    │   └─ On failure: fix → re-verify (Self-Healing Loop)
    │
    └─ Phase 4: Finalize
        ├─ Final commit
        ├─ Update CLAUDE.md / ai-context (if needed)
        └─ (Optional) PR creation guide
```

## Phase 1: Analysis

### Check Plan Documents

Always check Plan docs before implementation:
- `.claude/plans/implementation-plan.md`
- `PLAN.md` (detailed plan)

### Determine Task Type

| Type | Branch Prefix | Description |
|------|---------------|-------------|
| New feature | `feat/` | Add new functionality |
| Bug fix | `fix/` | Fix bugs |
| Refactoring | `refactor/` | Code improvement (no feature change) |
| Documentation | `docs/` | Documentation |
| Style | `style/` | Code formatting |
| Test | `test/` | Add/modify tests |

### Create Branch

```bash
git checkout -b {type}/{kebab-case-description}
# Example: feat/meeting-summary, fix/tag-duplicate
```

### Analysis Checklist

- [ ] Understand requirements clearly (reference Plan docs)
- [ ] Identify affected files/modules
- [ ] Verify Clean Architecture layers
- [ ] Break down work units (commit units)

## Phase 2: TDD Implementation

### TDD Cycle (Required)

**모든 기능 구현은 TDD 방식을 따릅니다:**

```
1. RED    - 실패하는 테스트 먼저 작성
           └─ 구현할 동작을 테스트로 정의

2. GREEN  - 테스트를 통과하는 최소한의 코드 작성
           └─ "완벽한" 코드가 아닌 "동작하는" 코드

3. REFACTOR - 코드 정리 (테스트는 계속 통과해야 함)
           └─ 중복 제거, 네이밍 개선, 구조 정리
```

### Test File Conventions

| Layer | Test File | Example |
|-------|-----------|---------|
| Services | `{name}.service.test.ts` | `extract.service.test.ts` |
| UseCases | `{name}.usecase.test.ts` | `add-context.usecase.test.ts` |
| Adapters | `{name}.adapter.test.ts` | `claude.adapter.test.ts` |
| Components | `{Name}.test.tsx` | `ErrorDisplay.test.tsx` |

### TDD Rules

- **No implementation without test**: 테스트 먼저 작성
- **Mock external dependencies**: AI API, DB 등은 mock 처리
- **Test describes behavior**: 테스트가 스펙 문서 역할
- **Small increments**: 작은 단위로 RED → GREEN → REFACTOR 반복

### Follow Architecture

```
Presentation → Application → Domain → Infrastructure
tui/          usecases/     services/   adapters/
components/                 domain/
hooks/
```

### Naming Conventions

| Type | Pattern |
|------|---------|
| Component | `PascalCase.tsx` |
| Hooks | `use{Name}.ts` |
| Repository interface | `{entity}.repository.ts` |
| Repository impl | `{entity}.{provider}.ts` |
| UseCase | `{action}-{entity}.usecase.ts` |
| Prompt | `{purpose}.prompt.ts` |
| Types | `{entity}.types.ts` |

### Feature Unit Commits

Commit at meaningful units during implementation:

```bash
git add <related files>
git commit -m "{type}: {description}"
```

**Commit Message Rules** (Conventional Commits):
```
feat: implement meeting summary API
fix: fix tag duplicate creation bug
refactor: clean up Claude SDK wrapper
```

**Commit Unit Criteria**:
- One logical change = one commit
- Unit that can be independently rolled back
- Not too small (not per file)
- Not too large (not entire feature at once)

## Phase 3: Verification

### Call /verify Skill

Always call `/verify` after implementation:

```
/verify
    ├─ pnpm test     # TDD tests must pass
    ├─ pnpm build    # Build check
    ├─ pnpm lint     # Lint check
    └─ On failure → fix → re-verify
```

### Self-Healing Loop

```
Implement → /verify → Failure?
                        │
                        ├─ YES → Analyze error → Fix → Re-verify
                        │
                        └─ NO → Verification complete
```

**Key**: On verification failure, fix and re-verify without user intervention.
Alert user after 3+ failures on same error.

## Phase 4: Finalize

### Document Update Check

| Change Type | Update Target |
|-------------|---------------|
| New domain term | `ai-context/domain/glossary.json` |
| Entity change | `ai-context/domain/entities.json` |
| Business rule | `ai-context/domain/rules.json` |
| New directory | Create `CLAUDE.md` in that directory |

### Final Commit

```bash
git add .
git commit -m "{type}: {overall task summary}"
```

### PR Guide (Optional)

```bash
git push -u origin {branch-name}
gh pr create --title "{title}" --body "{description}"
```

## Example

### Input
```
/implement PLAN.md Phase 3 - Implement meeting summary feature
```

### Execution Flow

```
1. Analysis
   - Check Plan: Phase 3 requirements
   - Type: feat (new feature)
   - Branch: feat/meeting-summary
   - Affects: core/usecases/, core/services/, adapters/

2. TDD Implementation
   RED:
   - Write summarize-meeting.usecase.test.ts
   - pnpm test → FAIL (expected)

   GREEN:
   - Implement summarize-meeting.usecase.ts
   - pnpm test → PASS

   REFACTOR:
   - Clean up code structure
   - pnpm test → PASS (must stay green)

   Commit: "feat: implement meeting summary UseCase"

3. Verification
   - Call /verify
   - pnpm test ✓
   - pnpm build ✓
   - pnpm lint ✓

4. Finalize
   - Update ai-context (if needed)
   - Final commit
```

## Important Notes

- **No Co-Authored-By**: Never add Claude/AI markers
- **No git -C**: Execute directly in working directory
- **Branch protection**: No direct commits to main
- **Build check**: Always run /verify before commit
- **Reference Plan**: Always check Plan docs before implementation
