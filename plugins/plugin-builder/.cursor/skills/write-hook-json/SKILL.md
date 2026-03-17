---
name: write-hook-json
description: >
  Cursor 스펙에 따른 hooks.json을 생성한다.
  라이프사이클 이벤트와 매칭 패턴을 설정한다.
---

## 목적
에이전트 라이프사이클 이벤트에 반응하는 자동화 훅을 설정한다.

## 절차
1. 설계에서 식별된 자동화 트리거 목록 확인
2. 각 트리거를 Cursor 훅 이벤트에 매핑: afterFileEdit(파일 편집 후), stop(에이전트 작업 완료 시)
3. command(실행 스크립트), matcher(대상 파일 패턴) 설정
4. `.cursor/hooks.json`에 통합 출력

## 완료 기준
- JSON 구문 유효, version 필드 포함
