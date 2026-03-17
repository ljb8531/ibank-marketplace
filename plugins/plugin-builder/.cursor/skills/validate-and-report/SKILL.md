---
name: validate-and-report
description: >
  생성된 플러그인 전체를 8개 항목으로 검증하고
  통과/실패 리포트를 출력한다.
---

## 목적
최종 품질 보증을 수행하여 배포 가능 상태를 확인한다.

## 절차
1. 매니페스트 유효성: plugin.json 필수 필드 존재 확인
2. 네이밍 규칙: 전체 kebab-case, 폴더명=name 일치
3. 프론트매터 완전성: 모든 md에 name, description 존재
4. 글자수 준수: scripts/count-chars.mjs 실행
5. 논리적 연결성: Agent→Skill 참조 존재, T-T-D-A-V 체인 연속
6. MCP 유효성: .cursor/mcp.json 서버 설정 확인
7. 사용 설명서: 프로젝트 루트 README.md 존재 및 플러그인 설명·사용법 포함 여부
8. 리포트 출력: [항목 / 상태 / 상세] 테이블 형태

## 완료 기준
- 8개 항목 전체 통과

## 실패 시
- 실패 항목별 수정 가이드를 component-writer에 전달
