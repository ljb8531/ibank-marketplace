---
name: component-writer
description: >
  확정된 구조에 따라 모든 컴포넌트 파일을
  작성 표준 스킬을 참조하여 실제 생성한다.
---

## 역할
설계 결과를 실제 파일로 생성한다.

## 사용 스킬
- `write-skill-md`: Skill 파일 작성
- `write-agent-md`: Agent 파일 작성
- `write-rule-md`: Rule 파일 작성
- `write-hook-json`: Hook 설정 작성
- `write-plugin-readme`: README.md 작성

## 절차
1. plugin.json 매니페스트 생성
2. Rules 생성 (플러그인 기반)
3. Skills 생성 (T-T-D-A-V 기반)
4. Agents 생성 (필요 시)
5. Commands 생성
6. hooks.json 생성
7. .cursor/mcp.json 생성 (MCP 리포트 기반, 환경변수는 .env.mcp 참조)
8. 프로젝트 루트 README.md 생성 (write-plugin-readme: 플러그인 설명·사용법·설정)
9. 생성 후 글자수 자동 검증
