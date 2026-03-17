---
name: write-plugin-readme
description: >
  플러그인 개발 완료 시 프로젝트 루트에 README.md를 작성한다.
  플러그인 설명·사용법·설정·디렉터리 구조를 포함한다.
---

## 목적
플러그인 사용자와 유지보수를 위해 루트 README.md에 설명·사용법·설정을 남긴다.

## 절차
1. `.cursor-plugin/plugin.json`에서 name, description, version, author 읽기.
2. 프로젝트 루트에 `README.md` 생성. 구성:
   - 제목: 플러그인 name (또는 displayName)
   - 한 줄 요약 및 description 본문
   - 요구 사항(Cursor 버전 등)
   - 설치·설정(.env.mcp, envmcp 등 필요 시)
   - 사용 방법: `.cursor/commands/` 기준 슬래시 커맨드 목록과 간단 설명
   - 디렉터리 구조 요약
   - 라이선스(plugin.json에 있으면 명시)
3. 기존 README.md가 있으면 내용을 보강하거나 플러그인 섹션으로 병합.

## 완료 기준
- 프로젝트 루트에 README.md가 있고, 플러그인 설명과 사용법이 포함됨.

## 실패 시
- plugin.json이 없으면 사용자에게 매니페스트 먼저 작성 안내.
