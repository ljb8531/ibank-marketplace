---
name: setup-mcp-env
description: >
  MCP 환경을 최초 설정한다. .env.mcp 없으면 생성하고
  npm install -g envmcp를 실행하도록 안내한다.
disable-model-invocation: true
---

## 실행 흐름
1. 프로젝트 루트에 `.env.mcp` 존재 여부 확인
2. 없으면 `setup-mcp-env` 스킬 실행: `npm install -g envmcp` 실행 후 `.env.mcp` 템플릿 생성
3. 있으면 이미 설정됨 안내

플러그인 최초 실행 시 또는 MCP 연결 오류 시 이 커맨드를 실행한다.
