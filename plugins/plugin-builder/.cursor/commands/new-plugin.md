---
name: new-plugin
description: >
  새 플러그인 생성을 시작한다.
  인터뷰부터 검증까지 전체 5단계를 순차 진행한다.
disable-model-invocation: true
---

## 실행 흐름
0. 프로젝트 루트에 `.env.mcp` 없으면 `setup-mcp-env` 스킬 실행(`npm install -g envmcp` 후 `.env.mcp` 생성). 있으면 생략.
1. `process-interviewer` 에이전트 호출 → Phase 1 완료
2. `thought-chain-mapper` 에이전트 호출 → Phase 2 완료
3. `mcp-dependency-resolver` 에이전트 호출 → Phase 2.5 완료
4. `plugin-architect` 에이전트 호출 → Phase 3 완료
5. `component-writer` 에이전트 호출 → Phase 4 완료
6. `plugin-validator` 에이전트 호출 → Phase 5 완료

각 Phase 사이에 사용자 확인(승인/수정)을 받는다.
