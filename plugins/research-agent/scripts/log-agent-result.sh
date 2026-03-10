#!/bin/bash
# 서브에이전트 완료 시 실행되는 로깅 스크립트
# subagentStop 이벤트에서 호출됨 (Cursor hooks.json)

INPUT=$(cat)

# 에이전트 이름과 타임스탬프 추출 (Cursor는 agent_type 또는 유사 필드 전달)
AGENT_NAME=$(echo "$INPUT" | jq -r '.agent_type // .subagent_type // .name // "unknown"')
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# 로그 디렉토리 확인 및 생성
mkdir -p output/data

# 로그 기록 (JSON Lines 형식)
echo "{\"timestamp\": \"$TIMESTAMP\", \"agent\": \"$AGENT_NAME\", \"event\": \"completed\"}" \
  >> output/data/agent-activity.jsonl

exit 0
