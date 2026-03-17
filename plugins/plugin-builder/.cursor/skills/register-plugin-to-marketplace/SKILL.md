---
name: register-plugin-to-marketplace
description: >
  새로 만든 플러그인의 정보를 프로젝트 루트 marketplace.json
  의 plugins 배열에 추가하거나 기존 항목을 갱신한다.
---

## 목적
플러그인 생성·수정 후 marketplace.json에 name, source, description, version, category 형식으로 등록한다.

## 절차
1. 프로젝트 루트에 `marketplace.json` 존재 여부 확인. 없으면 name, owner, metadata, plugins([]) 구조로 생성.
2. 등록할 플러그인 루트의 `.cursor-plugin/plugin.json`에서 name, description, version 읽기.
3. 항목 구성: name(매니페스트와 동일), source(플러그인 폴더명 또는 경로), description, version, category(사용자 지정 없으면 "productivity").
4. `marketplace.json`의 plugins 배열에서 동일 name이 있으면 해당 요소 교체, 없으면 끝에 추가.
5. JSON 저장 시 들여쓰기 유지.

## 완료 기준
- marketplace.json의 plugins 배열에 해당 플러그인 객체가 정확히 한 개 존재.

## 실패 시
- pluginRoot가 다른 구조면 metadata.pluginRoot는 기존 값 유지. 플러그인만 추가·갱신.
