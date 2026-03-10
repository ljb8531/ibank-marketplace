#!/bin/bash
# Write 도구 실행 전, output 하위 디렉토리가 존재하는지 확인
# preToolUse (matcher: Write) 이벤트에서 호출됨 (Cursor hooks.json)

mkdir -p output/screenshots
mkdir -p output/branding
mkdir -p output/reports
mkdir -p output/data

exit 0
