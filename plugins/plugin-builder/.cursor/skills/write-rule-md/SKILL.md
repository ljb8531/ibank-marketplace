---
name: write-rule-md
description: >
  Cursor 스펙에 따른 Rule md를 생성한다.
  alwaysApply 여부를 판단하고 불변 규칙을 작성한다.
---

## 목적
플러그인의 기반이 되는 불변 규칙 파일을 생성한다.

## 절차
1. YAML 프론트매터: name(kebab-case), alwaysApply(true/false) 작성
2. 본문: 규칙 내용을 명확하고 간결하게 서술
3. alwaysApply 판단: 모든 상황 적용→true / 특정 파일·상황만→false + globs 패턴
4. `.cursor/rules/[name].md` 경로에 파일 생성
**/create-rule 내장 스킬 참고**

## 완료 기준
- 규칙이 모호하지 않고 검증 가능한 문장으로 작성됨
