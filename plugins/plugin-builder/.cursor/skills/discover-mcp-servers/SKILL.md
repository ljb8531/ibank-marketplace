---
name: discover-mcp-servers
description: >
  필요한 외부 도구의 기존 MCP 서버를 웹서치로 탐색하고
  사용 가능 여부를 평가하여 재사용 우선으로 추천한다.
---

## 목적
추가 개발 없이 사용 가능한 MCP 서버를 최대한 찾아 활용한다.

## 절차
1. Phase 1에서 식별된 외부 도구 목록을 입력받음
2. 각 도구별로 BRAVE_SEARCH 실행: "[도구명] MCP server", 대상: mcp.so, glama.ai, GitHub, npm
3. 후보 발견 시 FIRECRAWL로 README 확인: 기능 범위, 라이선스, 유지보수 상태
4. 평가 결과를 [도구명 / MCP서버 / 상태 / 추천여부]로 정리

## 완료 기준
- 모든 외부 도구에 대해 탐색 완료 및 결과 분류

## 실패 시
- 검색 결과 없으면 "미발견"으로 분류하고 draft-mcp-spec으로 전달
