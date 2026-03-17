---
name: report-assemble
description: >
  앞선 4개 스킬 산출물(01~04 섹션)을 **1~12항목 순서**의 완전한 리포트로 조립하고, Executive Summary를 생성하며,
  부록을 추가해 최종 파일을 저장한다. report-writer가 Step 5에서 호출한다.
argument-hint: [섹션 파일 경로 목록]
allowed-tools: Read, Write, Grep
---

# 리포트 최종 조립 (12항목 + 부록)

## 입력

$ARGUMENTS = {OUTPUT_BASE}/output/reports/sections/ 디렉토리 경로 또는 01~04 파일 경로 목록. (OUTPUT_BASE는 .benchmark-output-root에서 읽음, 없으면 output.)

## 참조 데이터

- {OUTPUT_BASE}/output/reports/sections/01-asis.md, 02-deepdive.md, 03-matrix.md, 04-insight.md
- {OUTPUT_BASE}/output/data/candidates.json (Excluded — 부록 A)
- {OUTPUT_BASE}/output/data/reference-codes.json (부록 B, 검증용)
- {OUTPUT_BASE}/output/data/project-brief.json (input_level — Executive Summary)

## 최종 리포트 목차 (1~12 + 부록)

| # | 항목 | 출처 |
|---|------|------|
| 1 | 리포트 개요 | 01-asis |
| 2 | 분석의 목적과 범위 | 01-asis |
| 3 | 시장·동종 업계 트렌드 | 01-asis |
| 4 | 특화·선도 트렌드 | 04-insight |
| 5 | AS-Is 분석 | 01-asis |
| 6 | 핵심 Pain Point | 01-asis |
| 7 | 벤치마킹 대상 Overview | 02-deepdive |
| 8 | 벤치마킹 상세분석 | 02-deepdive |
| 9 | 비교 매트릭스 | 03-matrix |
| 10 | 핵심 인사이트 | 04-insight |
| 11 | 실행 방안/전략 | 04-insight |
| 12 | 최종정리 | 04-insight |
| 부록 A~C | 제외 후보·참조 코드·후보 로그 | 본 스킬에서 생성 |

## 실행 절차

### Step 1: 섹션 파일 존재 확인

01-asis.md, 02-deepdive.md, 03-matrix.md, 04-insight.md 4개 모두 존재 확인. 누락 시 에러 반환 후 중단.

### Step 2: 전체 리포트 조립 (목차 1~12 순서 유지)

4개 섹션을 **읽은 뒤** 아래 순서로 연결하여 본문 목차가 **1 → 2 → … → 12**가 되도록 한다.

- **01-asis.md**: 1, 2, 3, 5, 6 포함. **"3. 시장·동종 업계 트렌드"** 끝까지 출력한 후 중단.
- **04-insight.md**에서 **"4. 특화·선도 트렌드"** 섹션만 추출하여 위 직후에 삽입.
- **01-asis.md**의 **"5. AS-Is 분석"** ~ **"6. 핵심 Pain Point"** 이어서 출력.
- **02-deepdive.md** 전체 (7, 8).
- **03-matrix.md** 전체 (9).
- **04-insight.md**에서 **"10. 핵심 인사이트"** ~ **"12. 최종정리"** 까지 출력.

**본문 순서:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12. 연결 후 부록 A~C 추가.

**부록 A — 제외된 후보 사이트**  
candidates.json에서 status: "Excluded"만 추출. 테이블: 서비스명 | URL | 제외 사유(fail_reason).

**부록 B — 참조 코드 인덱스**  
reference-codes.json 기반. 테이블: 코드 | 유형(Pain Point/Direct/Indirect/Inspire) | 대상(name/title) | 비고(url, feature 등).

**부록 C — 전체 후보 데이터 로그**  
candidates.json 전체를 코드 블록(```json ... ```)으로 첨부. 감사 추적·재분석용.

### Step 3: Executive Summary 생성

01-asis.md, 04-insight.md(특히 10. 핵심 인사이트, 11. 실행 방안, 12. 최종정리)를 Read해 독립 문서로 생성. 의사결정자가 이 문서만 읽어도 판단 가능해야 함.

**구조:**

- **결론**: 한 문장 핵심 결론. "[company.name]은 [핵심 방향]을 중심으로 [project.type]을 추진해야 합니다."
- **현재 상태**: 자사 핵심 문제 한 문단(PP-1, PP-2, PP-3 반영). 신규 구축이면 시장 현황·진입 과제.
- **벤치마킹 핵심 발견**: 반드시 갖춰야 할 것(Table Stakes 1가지) / 차별화 기회(White Space 1가지) / 전략적 판단(Leapfrog-Avoid 1가지).
- **권고 사항**: 컨셉 방향 1문장, Must-Have 상위 3가지, 디자인 방향 1문장, Phase 1 Quick Win 핵심 액션 1가지.
- **분석 범위**: Direct n개, Indirect n개, Inspire n개, 총 n개. 인풋 레벨, 분석 일시.
- 마지막에 "상세 분석은 benchmark-report.md 참조" 안내.

800자 이내 권장.

### Step 4: 품질 최종 검증

1. **12항목 목차 완결성**: 본문에 "1. 리포트 개요" ~ "12. 최종정리"가 순서대로 포함되는지 확인 (Grep으로 제목 검색).
2. **참조 코드 완결성**: reference-codes.json의 모든 코드가 본문에 최소 1회 등장하는지 (Grep 가능).
3. **Confirmed 사이트 완결성**: status "Confirmed"인 모든 사이트가 8. 벤치마킹 상세분석에 있는지.
4. **금지 표현**: "좋아 보여서|예쁘다|유명해서|깔끔하다|트렌디하다" 검색. 발견 시 해당 문장을 구체적 근거로 대체.
5. **부록**: 부록 A, B, C 존재 확인.
6. **Executive Summary**: 결론, 현재 상태, 핵심 발견, 권고 사항 4개 섹션 존재 확인.

검증 실패 항목이 있으면 해당 부분 수정 후 재저장.

### Step 5: 최종 저장

- {OUTPUT_BASE}/output/reports/benchmark-report.md (전체 리포트, 목차 1~12 + 부록 A~C)
- {OUTPUT_BASE}/output/reports/executive-summary.md (경영진 요약)

## 출력

두 파일 저장 경로와 함께 다음 반환:

- 전체 리포트 글자 수 및 12항목 목차 완결 여부
- 품질 검증 결과(통과/미통과 항목)
- 핵심 인사이트 3가지 요약(TS-1, WS-1, LA-1 등)
