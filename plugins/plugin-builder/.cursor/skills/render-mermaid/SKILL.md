---
name: render-mermaid
description: >
  완성된 T-T-D-A-V 맵을 Mermaid flowchart 구문으로
  변환하여 시각적 프로세스 다이어그램을 생성한다.
---

## 목적
사용자가 추출된 사고 사슬을 시각적으로 확인하고 수정할 수 있게 한다.

## 절차
1. T-T-D-A-V 맵의 각 단계를 Mermaid 노드로 변환
2. Trigger→Think→Decide를 순차 연결
3. Decide에서 분기 조건별 Act 노드로 분기
4. Act→Verify를 연결하고 Verify 실패 시 복구 경로 표시
5. 완성된 Mermaid 코드를 코드블록으로 출력

## 완료 기준
- Mermaid 구문 오류 없이 렌더링 가능

## 실패 시
- 복잡도가 높아 가독성이 떨어지면 단계 그룹별로 분할 출력
