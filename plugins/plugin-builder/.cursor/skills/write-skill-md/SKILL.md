---
name: write-skill-md
description: >
  Cursor 스펙에 따른 SKILL.md를 생성한다.
  표준 템플릿과 500자 제한을 적용하여 작성한다.
---

## 목적
설계 결과를 실제 SKILL.md 파일로 변환한다.

## 절차
1. `references/skill-template.md` 양식 참조
2. YAML 프론트매터: name(kebab-case), description(40~80자) 작성
3. 본문: 목적(1문장), 절차(번호 리스트), 완료 기준, 실패 시 작성
4. 글자수 확인: 500자 미만 검증
5. `.cursor/skills/[name]/SKILL.md` 경로에 파일 생성
**/create-skill 내장 스킬 참고**

## 완료 기준
- 프론트매터 완전, 500자 미만, 폴더명=name 일치

## 실패 시
- 500자 초과 시 enforce-split 기준으로 분할
