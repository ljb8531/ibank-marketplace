---
name: write-agent-md
description: >
  Cursor 스펙에 따른 서브에이전트 md를 생성한다.
  역할, 사용 스킬, 절차, 산출물을 표준 구조로 작성한다.
---

## 목적
설계 결과를 실제 에이전트 md 파일로 변환한다.

## 절차
1. `references/agent-template.md` 양식 참조
2. YAML 프론트매터: name(kebab-case), description(40~80자) 작성
3. 본문: 역할(1문장), 사용 스킬 목록, 작업 절차, 산출물 작성
4. 글자수 확인: 500자 미만 검증
5. `.cursor/agents/[name].md` 경로에 파일 생성
**/create-subagent 내장 스킬 참고**

## 완료 기준
- 참조하는 모든 스킬이 실제 존재함
- 500자 미만 준수

## 실패 시
- 500자 초과 시 역할을 분리하여 복수 에이전트로 분할
