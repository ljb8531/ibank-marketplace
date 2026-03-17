#!/bin/bash
# 서브에이전트 완료 시 실행되는 로깅 스크립트
# subagentStop 이벤트에서 호출됨 (Cursor hooks.json)
# .benchmark-output-root가 있으면 해당 경로 하위 output/data 사용

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_FILE="$PROJECT_ROOT/.benchmark-output-root"

if [ -f "$ROOT_FILE" ] && [ -s "$ROOT_FILE" ]; then
  RUN_ROOT="$(cat "$ROOT_FILE" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [ -n "$RUN_ROOT" ] || RUN_ROOT="output"
else
  RUN_ROOT="output"
fi

if [ "$RUN_ROOT" = "output" ]; then
  LOG_DIR="$PROJECT_ROOT/output/data"
else
  LOG_DIR="$PROJECT_ROOT/$RUN_ROOT/output/data"
fi

INPUT=$(cat)
AGENT_NAME=$(echo "$INPUT" | jq -r '.agent_type // .subagent_type // .name // "unknown"')
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

mkdir -p "$LOG_DIR"
echo "{\"timestamp\": \"$TIMESTAMP\", \"agent\": \"$AGENT_NAME\", \"event\": \"completed\"}" >> "$LOG_DIR/agent-activity.jsonl"

exit 0
