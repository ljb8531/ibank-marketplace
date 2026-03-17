# Cursor Plugin System 스펙 요약

## 디렉토리 구조
- `.cursor-plugin/plugin.json` — 매니페스트 (필수)
- `.cursor/skills/[name]/SKILL.md` — 스킬
- `.cursor/agents/[name].md` — 서브에이전트
- `.cursor/commands/[name].md` — 슬래시 커맨드
- `.cursor/rules/[name].md` — 룰
- `.cursor/hooks.json` — 훅
- `.cursor/mcp.json` — MCP 서버 설정. env 항목에 값을 넣지 않고, envmcp로 실행하며 환경변수는 프로젝트 루트 `.env.mcp`에서 로드. 없으면 `/setup-mcp-env` 실행.

## plugin.json 필드 (패턴)
name, description, version, author({ name, email }), homepage, repository, license, keywords, logo, rules, agents, skills, hooks, mcpServers (.cursor/ 경로)

## YAML 프론트매터 필수 필드
- Skill: name, description
- Agent: name, description
- Rule: name, alwaysApply (boolean)
- Command: name, description, disable-model-invocation (optional)

## Hook 이벤트 유형
- afterFileEdit: 파일 편집 후 (matcher 패턴 지원)
- stop: 에이전트 작업 종료 시

## 핵심 원칙
- 모든 컴포넌트는 file-based markdown과 JSON
- 코드 빌드 불필요, 인프라 불필요
- progressive disclosure: 필요한 스킬만 동적 로딩
