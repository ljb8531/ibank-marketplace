#!/bin/bash
# Write 도구 실행 전, output 하위 디렉토리가 존재하는지 확인
# preToolUse (matcher: Write) 이벤트에서 호출됨 (Cursor hooks.json)
# .benchmark-output-root가 있으면 해당 경로 하위에 output/ 생성, 없으면 프로젝트 루트의 output/ 사용

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
  mkdir -p "$PROJECT_ROOT/output/screenshots"
  mkdir -p "$PROJECT_ROOT/output/branding"
  mkdir -p "$PROJECT_ROOT/output/reports"
  mkdir -p "$PROJECT_ROOT/output/reports/sections"
  mkdir -p "$PROJECT_ROOT/output/data"
else
  mkdir -p "$PROJECT_ROOT/$RUN_ROOT/output/screenshots"
  mkdir -p "$PROJECT_ROOT/$RUN_ROOT/output/branding"
  mkdir -p "$PROJECT_ROOT/$RUN_ROOT/output/reports"
  mkdir -p "$PROJECT_ROOT/$RUN_ROOT/output/reports/sections"
  mkdir -p "$PROJECT_ROOT/$RUN_ROOT/output/data"
fi

exit 0
