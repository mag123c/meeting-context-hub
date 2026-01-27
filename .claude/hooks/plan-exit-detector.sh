#!/bin/bash
set -e
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
MARKER="/tmp/mch-plan-completed-$SESSION_ID"

if [ "$TOOL_NAME" = "ExitPlanMode" ]; then
  touch "$MARKER"
fi

echo '{"decision": "allow"}'
