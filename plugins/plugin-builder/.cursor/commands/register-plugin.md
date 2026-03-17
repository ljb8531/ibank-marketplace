---
name: register-plugin
description: >
  새로 만든 플러그인 정보를 marketplace.json의 plugins에
  name, source, description, version, category 형식으로 등록한다.
disable-model-invocation: true
---

## 실행 흐름
1. `register-plugin-to-marketplace` 스킬 실행
2. 플러그인 루트는 현재 워크스페이스 루트 또는 사용자 지정 경로
3. `.cursor-plugin/plugin.json`에서 name, description, version 수집 → marketplace.json plugins에 추가·갱신
4. 등록 결과(추가됨/갱신됨) 사용자에게 안내

플러그인 생성·검증 완료 후 또는 배포 전에 실행한다.
