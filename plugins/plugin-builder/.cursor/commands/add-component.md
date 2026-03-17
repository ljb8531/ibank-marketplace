---
name: add-component
description: >
  기존 플러그인에 개별 컴포넌트를 추가한다.
  Skill, Agent, Rule, Hook, Command 중 선택한다.
disable-model-invocation: true
---

## 실행 흐름
1. 사용자에게 추가할 컴포넌트 유형 질의
2. 해당 유형의 write 스킬 호출 (write-skill-md 등)
3. 기존 플러그인 구조와의 정합성 확인
4. validate-and-report로 추가 후 전체 재검증
