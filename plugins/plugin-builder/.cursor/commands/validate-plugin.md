---
name: validate-plugin
description: >
  현재 플러그인 구조의 유효성을 검증하고
  검증 리포트를 출력한다.
disable-model-invocation: true
---

## 실행 흐름
1. `plugin-validator` 에이전트 호출
2. `validate-and-report` 스킬 실행
3. 검증 리포트 출력
4. 실패 항목이 있으면 수정 가이드 제시
