---
name: report-assemble
description: >
  앞선 4개 스킬 산출물(01~04 섹션)을 하나의 완전한 리포트로 조립하고, Executive Summary를 생성하며,
  부록을 추가해 최종 파일을 저장한다. report-writer가 Step 5에서 호출한다.
argument-hint: [섹션 파일 경로 목록]
allowed-tools: Read, Write, Grep
---

# 리포트 최종 조립

## 입력

$ARGUMENTS = output/reports/sections/ 디렉토리 경로 또는 01~04 파일 경로 목록.

## 참조 데이터

- output/reports/sections/01-asis.md, 02-deepdive.md, 03-matrix.md, 04-insight.md
- output/data/candidates.json (Excluded — 부록 A)
- output/data/reference-codes.json (부록 B, 검증용)
- output/data/project-brief.json (input_level — Executive Summary)

## 실행 절차

### Step 1: 섹션 파일 존재 확인

01-asis.md, 02-deepdive.md, 03-matrix.md, 04-insight.md 4개 모두 존재 확인. 누락 시 에러 반환 후 중단.

### Step 2: 전체 리포트 조립

4개 섹션을 순서대로 연결한 뒤 아래 부록을 추가한다.

**본문:** 01-asis.md + 02-deepdive.md + 03-matrix.md + 04-insight.md

**부록 A — 제외된 후보 사이트**  
candidates.json에서 status: "Excluded"만 추출. 테이블: 서비스명 | URL | 제외 사유(fail_reason).

**부록 B — 참조 코드 인덱스**  
reference-codes.json 기반. 테이블: 코드 | 유형(Pain Point/Direct/Indirect/Inspire) | 대상(name/title) | 비고(url, feature 등).

**부록 C — 전체 후보 데이터 로그**  
candidates.json 전체를 코드 블록(```json ... ```)으로 첨부. 감사 추적·재분석용.

### Step 3: Executive Summary 생성

01-asis.md, 04-insight.md를 Read해 독립 문서로 생성. 의사결정자가 이 문서만 읽어도 판단 가능해야 함.

**구조:**

- **결론**: 한 문장 핵심 결론. "[company.name]은 [핵심 방향]을 중심으로 [project.type]을 추진해야 합니다."
- **현재 상태**: 자사 핵심 문제 한 문단(PP-1, PP-2, PP-3 반영). 신규 구축이면 시장 현황·진입 과제.
- **벤치마킹 핵심 발견**: 반드시 갖춰야 할 것(Table Stakes 1가지) / 차별화 기회(White Space 1가지) / 전략적 판단(Leapfrog-Avoid 1가지).
- **권고 사항**: 컨셉 방향 1문장, Must-Have 상위 3가지, 디자인 방향 1문장, Phase 1 Quick Win 핵심 액션 1가지.
- **분석 범위**: Direct n개, Indirect n개, Inspire n개, 총 n개. 인풋 레벨, 분석 일시.
- 마지막에 "상세 분석은 benchmark-report.md 참조" 안내.

800자 이내 권장.

### Step 4: 품질 최종 검증

1. **참조 코드 완결성**: reference-codes.json의 모든 코드가 본문에 최소 1회 등장하는지 (Grep 가능).
2. **Confirmed 사이트 완결성**: status "Confirmed"인 모든 사이트가 Deep Dive에 있는지.
3. **금지 표현**: "좋아 보여서|예쁘다|유명해서|깔끔하다|트렌디하다" 검색. 발견 시 해당 문장을 구체적 근거로 대체.
4. **섹션 완결성**: Section 1~8 + 부록 A~C 존재 확인.
5. **Executive Summary**: 결론, 현재 상태, 핵심 발견, 권고 사항 4개 섹션 존재 확인.

검증 실패 항목이 있으면 해당 부분 수정 후 재저장.

### Step 5: 최종 저장

- output/reports/benchmark-report.md (전체 리포트)
- output/reports/executive-summary.md (경영진 요약)

## 출력

두 파일 저장 경로와 함께 다음 반환:

- 전체 리포트 글자 수(또는 섹션 수)
- 품질 검증 결과(통과/미통과 항목)
- 핵심 인사이트 3가지 요약(TS-1, WS-1, LA-1 등)
