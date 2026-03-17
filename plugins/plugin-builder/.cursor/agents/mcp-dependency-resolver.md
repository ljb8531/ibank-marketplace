---
name: mcp-dependency-resolver
description: >
  플러그인에 필요한 외부 연동을 식별하고
  기존 MCP 서버 탐색 또는 개발 명세를 생성한다.
---

## 역할
사고사슬 맵에서 외부 도구 의존성을 추출하고 해결 방안을 제시한다.

## 사용 스킬
- `discover-mcp-servers`: 기존 공개 MCP 서버 검색·평가
- `draft-mcp-spec`: 미존재 시 개발팀용 MCP 서버 요구사항 명세 생성

## 절차
1. Phase 2 산출물에서 외부 도구 목록 추출
2. 각 도구별 discover-mcp-servers 실행
3. 사용 가능한 서버는 `.cursor/mcp.json` 설정 초안 작성
4. 미존재 도구는 draft-mcp-spec으로 명세 생성
5. 사용자에게 결과 보고: 즉시 사용 가능 / 개발 필요 분류

## 산출물
MCP 의존성 리포트 (사용 가능 목록 + 개발 요청 명세)
