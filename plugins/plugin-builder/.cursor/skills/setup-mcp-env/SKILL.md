---
name: setup-mcp-env
description: >
  프로젝트 루트 .env.mcp 존재 여부를 확인하고, 없으면 envmcp 전역 설치 후 .env.mcp 템플릿을 생성한다.
  envmcp 설치 여부를 항상 확인하며, Cursor가 다른 cwd에서 MCP를 실행할 때를 대비해 ~/.env.mcp 동기화를 수행한다.
---

## 목적
MCP 서버가 `.cursor/mcp.json`의 envmcp를 통해 환경변수를 쓰도록, 프로젝트 루트 `.env.mcp`, envmcp 전역 설치, 그리고 홈 디렉터리 `~/.env.mcp` 동기화를 준비한다.

## 절차
1. **envmcp 전역 설치 여부 확인**
   - 터미널에서 `which envmcp` 또는 `envmcp --version` 실행
   - 실행 불가(명령을 찾을 수 없음)이면 `npm install -g envmcp` 실행
   - `.env.mcp` 존재 여부와 관계없이 이 단계를 먼저 수행한다.
2. **프로젝트 루트 `.env.mcp` 확인**
   - 프로젝트 루트에 `.env.mcp` 파일 존재 여부 확인
   - **존재하지 않을 경우**
     - 프로젝트 루트에 `.env.mcp` 생성, 아래 내용으로 작성:
       ```
       BRAVE_API_KEY=your_brave_api_key_here
       FIRECRAWL_API_KEY=your_firecrawl_api_key_here
       ```
     - 사용자에게 실제 API 키를 채워 넣으라고 안내
3. **~/.env.mcp 동기화(프로젝트 .env.mcp 인식 보장)**
   - envmcp는 "현재 디렉터리 → 상위 디렉터리 → 홈 ~/.env.mcp" 순으로 탐색한다.
   - Cursor가 MCP 서버를 플러그인/캐시 디렉터리 등 프로젝트 루트가 아닌 cwd에서 실행하면, 프로젝트의 `.env.mcp`를 찾지 못할 수 있다.
   - **홈에 `~/.env.mcp`가 없거나**, **프로젝트 `.env.mcp`와 내용이 다르면**:
     - 프로젝트 루트의 `.env.mcp` 내용을 `~/.env.mcp`에 복사(덮어쓰기)하여 동기화한다.
   - 이렇게 하면 MCP가 어디서 실행되든 envmcp가 `~/.env.mcp`를 읽을 수 있다.
4. **존재하고 이미 동기화된 경우** 별도 작업 없이 완료

## 완료 기준
- envmcp가 전역 설치되어 있음(필요 시 설치함)
- 프로젝트 루트에 `.env.mcp`가 존재함(없으면 템플릿 생성)
- `~/.env.mcp`가 존재하며 프로젝트 `.env.mcp`와 동일한 내용임(동기화됨)

## 참고
- `.cursor/mcp.json`에는 env 값을 넣지 않는다. envmcp가 `.env.mcp`를 읽어 연결한다.
- API 키 변경 시: `~/.env.mcp`를 수정하거나, 프로젝트만 쓰려면 Cursor MCP 설정에서 `--env-file`로 프로젝트 `.env.mcp` 경로를 지정하는 방식도 가능하다.
