---
name: classify-components
description: >
  T-T-D-A-V 맵의 각 요소를 Cursor 플러그인 컴포넌트
  유형으로 분류하는 의사결정 트리를 적용한다.
---

## 목적
추출된 사고 사슬의 각 요소를 적절한 컴포넌트로 변환한다.

## 절차
1. `references/component-decision-tree.md`의 분류 트리 참조
2. 각 요소에 순차 적용: 항상 적용?→Rule / 사용자 명시 호출?→Command / 상황별 자동 로딩?→Skill / 독립 전문가?→Subagent / 이벤트 반응?→Hook / 외부 연결?→MCP
3. 분류 결과를 컴포넌트 유형별 목록으로 정리

## 완료 기준
- 모든 T-T-D-A-V 요소가 하나 이상의 컴포넌트에 매핑됨
