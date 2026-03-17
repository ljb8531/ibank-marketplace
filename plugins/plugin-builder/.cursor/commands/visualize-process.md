---
name: visualize-process
description: >
  추출된 T-T-D-A-V 사고사슬 맵을
  Mermaid 다이어그램으로 시각화한다.
disable-model-invocation: true
---

## 실행 흐름
1. 현재 Phase 2 산출물(T-T-D-A-V 맵) 로드
2. `render-mermaid` 스킬 호출
3. Mermaid 코드블록 출력
4. 사용자 수정 요청 시 맵 갱신 후 재렌더링
