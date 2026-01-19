---
name: verify
description: 자체 검증 루프. 빌드/린트 검증. 커밋/PR 전 필수. 실패 시 스스로 수정하고 재검증.
---

# Verify Skill

빌드/린트 검증 및 Self-Healing Loop. 커밋 전 필수 실행.

## 워크플로우

```
/verify
    │
    ├─ Step 1: 빌드 검증
    │   └─ pnpm build
    │       ├─ 성공 → Step 2
    │       └─ 실패 → 에러 분석 → 코드 수정 → Step 1 재시도
    │
    └─ Step 2: 린트 검증
        └─ pnpm lint
            ├─ 성공 → 검증 완료 ✓
            └─ 에러 → pnpm lint --fix → 재검증
```

## 호출 시점

| 시점 | 필수 여부 |
|------|----------|
| `/implement` 완료 후 | **필수** (자동 호출) |
| 커밋 전 | **필수** |
| PR 생성 전 | **필수** |

## Self-Healing Loop

```
코드 수정 → /verify → 실패?
                        │
                        ├─ YES → 에러 분석 → 수정 → 재검증 (루프)
                        │
                        └─ NO → 검증 완료 ✓
```

**핵심 규칙**:
1. 검증 실패 시 사용자 개입 없이 스스로 수정
2. 수정 후 반드시 재검증
3. 동일 에러 **3회 이상** 실패 시 사용자에게 알림

## 명령어

```bash
pnpm build      # 빌드 검증
pnpm lint       # 린트 검증
pnpm lint --fix # 린트 자동 수정
```

## 에러 처리

### 빌드 에러

1. 에러 메시지 분석
2. 원인 파일 식별
3. 코드 수정
4. `pnpm build` 재실행

### 린트 에러

1. `pnpm lint --fix` 먼저 시도
2. 자동 수정 안 되면 수동 수정
3. `pnpm lint` 재실행

## /implement와의 연계

`/implement` 스킬 Phase 3에서 자동으로 `/verify` 호출됨:

```
/implement
    ├─ Phase 1: 분석
    ├─ Phase 2: 구현
    ├─ Phase 3: 검증 ← /verify 자동 호출
    └─ Phase 4: 마무리
```

## 검증 완료 후

검증 통과 시:
```
✓ 빌드 성공
✓ 린트 통과

커밋 준비 완료.
```

→ `/implement` Phase 4 (마무리) 진행
→ 또는 수동 커밋

## 규칙

1. **커밋 전 필수**: verify 없이 커밋 금지
2. **Self-Healing**: 실패 시 스스로 수정
3. **3회 실패 알림**: 동일 에러 반복 시 사용자 개입 요청
4. **순서 준수**: build → lint 순서
