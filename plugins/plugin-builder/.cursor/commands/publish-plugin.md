---
name: publish-plugin
description: >
  검증 통과한 플러그인의 배포 방법을 안내한다.
  로컬 설치 또는 Marketplace 배포를 가이드한다.
disable-model-invocation: true
---

## 실행 흐름
1. validate-plugin 미실행 시 먼저 실행
2. 전체 통과 확인 후 배포 옵션 제시: 로컬 설치(프로젝트 `.cursor/` 복사), 사용자 전역(`~/.cursor/plugins/`), Marketplace(패키징·제출 절차)
3. 팀 마켓플레이스에 등록할 경우 `/register-plugin` 실행 → `marketplace.json`의 plugins에 name, source, description, version, category 추가·갱신
4. 선택에 따른 단계별 가이드 출력
