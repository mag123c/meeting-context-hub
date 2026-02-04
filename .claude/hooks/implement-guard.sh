#!/bin/bash
# Edit/Write 호출 전 워크플로우 체크
# 1. Plan Mode 종료 후 implement 스킬 없이 직접 코드 수정 시 차단
# 2. clarify 진행 중 Plan Mode 없이 직접 코드 수정 시 차단
set -e
INPUT=$(cat)

# Plan 파일은 항상 수정 허용
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')
if [[ "$FILE_PATH" == *".claude/plans/"* ]]; then
  exit 0
fi

# verify, review, wrap 스킬에서 수정하는 파일들 예외 처리
# - CLAUDE.md: wrap에서 문서 업데이트
# - ai-context: wrap에서 문서 업데이트
# - hooks: hook 자체 수정
if [[ "$FILE_PATH" == *"CLAUDE.md"* ]] || \
   [[ "$FILE_PATH" == *"ai-context"* ]] || \
   [[ "$FILE_PATH" == *".claude/hooks/"* ]]; then
  exit 0
fi

SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')

PLAN_EXITED_MARKER="/tmp/mch-plan-exited-$SESSION_ID"
IMPLEMENT_STARTED_MARKER="/tmp/mch-implement-started-$SESSION_ID"
CLARIFY_IN_PROGRESS_MARKER="/tmp/mch-clarify-in-progress-$SESSION_ID"

# clarify 진행 중인데 Plan Mode 없이 직접 수정 시도 시 차단
if [ -f "$CLARIFY_IN_PROGRESS_MARKER" ]; then
  echo "/clarify 후 반드시 Plan Mode(EnterPlanMode)를 거쳐야 합니다." >&2
  exit 2
fi

# Plan Mode 종료됐는데 implement 스킬 미실행 상태면 차단
if [ -f "$PLAN_EXITED_MARKER" ] && [ ! -f "$IMPLEMENT_STARTED_MARKER" ]; then
  echo "Plan Mode 종료 후 /implement 스킬을 먼저 실행해야 합니다. TDD 워크플로우를 따르세요." >&2
  exit 2
fi

exit 0
