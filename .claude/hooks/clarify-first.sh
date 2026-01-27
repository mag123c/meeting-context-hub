#!/bin/bash
set -e
INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
MARKER="/tmp/mch-clarify-$SESSION_ID"

[ -f "$MARKER" ] && exit 0
touch "$MARKER"

cat << 'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "## 첫 프롬프트: /clarify 필수\n\n세션 첫 요청은 반드시 `/clarify` 실행 후 진행."
  }
}
EOF
