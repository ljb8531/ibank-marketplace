---
name: mcp-first-reuse
description: 외부 연동 시 기존 MCP 서버 우선 탐색, 없을 때만 명세 작성
alwaysApply: true
---

외부 도구 연동이 필요할 때 반드시 기존 공개 MCP 서버 존재 여부를 먼저 확인한다. 검색 우선순위: (1) Anthropic 공식 MCP 서버 (2) MCP 레지스트리(mcp.so, glama.ai 등) (3) GitHub 오픈소스. 기존 서버로 해결 가능하면 추가 개발 없이 사용한다. 불가능할 때만 `draft-mcp-spec` 스킬로 개발 요구사항 명세를 생성하여 개발팀에 전달한다.
