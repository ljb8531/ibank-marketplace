---
name: cursor-plugin-spec
description: Cursor 플러그인 공식 스펙 준수 (매니페스트, 디렉토리, 프론트매터)
alwaysApply: true
---

생성하는 모든 플러그인은 Cursor 공식 스펙을 따른다. 매니페스트는 `.cursor-plugin/plugin.json`에 위치하며 name, description, version, author(객체 시 name·email), rules, agents, skills, hooks, mcpServers(.cursor/ 경로)를 포함한다. 스킬은 `.cursor/skills/[name]/SKILL.md`, 에이전트는 `.cursor/agents/[name].md`, 커맨드는 `.cursor/commands/[name].md`, 룰은 `.cursor/rules/[name].md`에 배치한다. 훅은 `.cursor/hooks.json`, MCP 설정은 `.cursor/mcp.json`에 둔다. env 값은 mcp.json에 적지 않고, 프로젝트 루트 `.env.mcp`에만 두며, mcp.json에서는 envmcp로 연결한다. `.env.mcp`가 없으면 `/setup-mcp-env` 실행. 모든 md 파일은 YAML 프론트매터에 name과 description을 필수 포함한다. 상세 스펙은 `references/cursor-spec-summary.md`를 참조한다.
