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
