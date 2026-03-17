---
name: search-external-context
description: >
  BRAVE_SEARCH와 FIRECRAWL로 업무 도메인 트렌드,
  유사 플러그인, 베스트 프랙티스를 수집한다.
---

## 목적
사용자 입력 외의 외부 정보로 플러그인 설계를 보강한다.

## 절차
1. 사용자 업무 키워드로 BRAVE_SEARCH 실행
2. Cursor Marketplace에서 유사 플러그인 존재 여부 확인
3. 유망한 참조 대상 발견 시 FIRECRAWL로 상세 구조 수집
4. 수집 결과를 출처와 함께 사용자에게 제시

## 완료 기준
- 최소 1회 이상 외부 검색 수행 후 결과 보고

## 실패 시
- 관련 정보 없으면 "관련 사례 미발견"으로 진행
