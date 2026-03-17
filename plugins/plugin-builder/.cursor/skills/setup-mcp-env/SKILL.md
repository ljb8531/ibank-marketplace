---
name: setup-mcp-env
description: >
  프로젝트 루트 .env.mcp 존재 여부를 확인하고,
  없으면 envmcp 전역 설치 후 .env.mcp 템플릿을 생성한다.
---

## 목적
MCP 서버가 `.cursor/mcp.json`의 envmcp를 통해 환경변수를 쓰도록, 프로젝트 루트 `.env.mcp`와 envmcp를 준비한다.

## 절차
1. 프로젝트 루트에 `.env.mcp` 파일 존재 여부 확인
2. **존재하지 않을 경우**
   - 터미널에서 `npm install -g envmcp` 실행
   - 설치 완료 후 프로젝트 루트에 `.env.mcp` 파일 생성, 아래 내용으로 작성:
     ```
     BRAVE_API_KEY=your_brave_api_key_here
     FIRECRAWL_API_KEY=your_firecrawl_api_key_here
     ```
   - 사용자에게 실제 API 키를 채워 넣으라고 안내
3. **존재할 경우** 별도 작업 없이 완료

## 완료 기준
- `.env.mcp`가 존재하고, envmcp가 전역 설치됨(필요 시)

## 참고
- `.cursor/mcp.json`에는 env 값을 넣지 않는다. envmcp가 `.env.mcp`를 읽어 연결한다.
