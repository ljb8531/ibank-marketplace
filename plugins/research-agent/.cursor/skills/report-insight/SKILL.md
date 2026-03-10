---
name: report-insight
description: >
  리포트 Section 7~8을 생성한다. 앞선 3개 섹션을 종합해 핵심 인사이트를 Table Stakes / White Space / Leapfrog 3분류로 도출하고,
  구체적 권고안과 실행 로드맵을 제시한다. report-writer가 Step 4에서 호출한다.
argument-hint: [01-asis.md, 02-deepdive.md, 03-matrix.md]
allowed-tools: Read, Write
---

# 리포트 인사이트 및 권고안 생성

## 입력

$ARGUMENTS = 앞선 3개 섹션 파일 경로 또는 요약. report-writer가 전달.

## 참조 데이터

- output/reports/sections/01-asis.md, 02-deepdive.md, 03-matrix.md
- output/data/reference-codes.json
- output/data/project-brief.json

## 원칙

"그래서 뭘 해야 하는가"를 도출한다. 모든 인사이트·권고안에 참조 코드(PP-n, D-n, I-n, R-n)를 포함해 앞선 분석과 논리적으로 연결한다.

## 실행 절차

### Part A: Section 7 — 핵심 인사이트

01~03 섹션을 Read한 뒤 발견사항을 3가지 카테고리로 분류해 서술.

**7-1. Table Stakes — 반드시 갖춰야 할 요소**

경쟁사 과반(Direct 3개 이상)이 이미 채택한 기능/UX/디자인. 없으면 시장 기본 기대치 미충족.

- **TS-1, TS-2, TS-3 …**: 요소명 + 구체적 서술. 어떤 D-n에서 관찰했는지, 어떤 PP-n을 해소하는지, 구현 시 참고 벤치마크(I-n 또는 D-n).

**7-2. White Space — 차별화 기회**

경쟁사 대부분이 미비한 영역. 주로 Indirect(I-n)에서 발견한 크로스 인더스트리 인사이트.

- **WS-1, WS-2 …**: 기회명 + 구체적 서술. 03-matrix 갭 분석에서 경쟁사가 ○인 영역에 I-n 접근을 적용하면 차별화 가능한 점. "[I-n]의 [기능/UX]를 우리 서비스에서 [이렇게] 변형하면 [PP-n] 해결과 차별화 동시에 가능."

**7-3. Leapfrog vs. Avoid — 전략적 판단 필요**

특정 D-n이 압도적으로 앞선 영역. 정면 경쟁 대신 우회·뛰어넘기 필요.

- **LA-1 …**: 영역명 + 해당 영역·압도적 경쟁사(D-n)·정면 경쟁 회피 이유·대안적 접근(우회/뛰어넘기) 제안.

### Part B: Section 8 — 권고안 및 실행 로드맵

**8-1. 사이트 컨셉 방향**  
인사이트 종합. 리뉴얼/신규의 포지셔닝·핵심 가치 제안. core_purpose 대비 강화/조정. Table Stakes로 기본 확보, White Space로 차별화, Leapfrog/Avoid로 리소스 배분 전략.

**8-2. 핵심 기능 우선순위 테이블**

| 우선순위 | 기능 | 근거 | 참조 | 연결 인사이트 |
|---------|------|------|------|---------------|
| Must-Have | … | PP-n 해소 + TS-n | D-n, I-n | Table Stakes |
| Nice-to-Have | … | WS-n 차별화 | I-n | White Space |
| Future | … | 기술 성숙도 또는 LA-n | D-n | Leapfrog |

**8-3. 디자인 방향 권고**  
03-matrix Section 6 결과 기반. 정보 밀도·비주얼 포커스·컬러·타이포·레이아웃. "R-n의 [요소] + R-n의 [요소] 참고, [자사 특성]으로 [조정]" 형태.

**8-4. 실행 로드맵 테이블**

| Phase | 기간 | 핵심 작업 | 연결 인사이트 | 핵심 산출물 |
|-------|------|----------|---------------|------------|
| Phase 1: Quick Win | 1~2개월 | PP-n 중 기술 난이도 낮은 즉시 개선 | TS-n | 구체적 산출물 |
| Phase 2: Core Build | 3~6개월 | Must-Have 구현, 디자인 시스템 구축 | TS-n, WS-n | 구체적 산출물 |
| Phase 3: Optimization | 6개월~ | Nice-to-Have/Future, 데이터 기반 개선 | WS-n, LA-n | 구체적 산출물 |

## 출력

output/reports/sections/04-insight.md

## 품질 체크

- Table Stakes 최소 2개 이상
- White Space 최소 1개 이상
- TS-n, WS-n, LA-n에 참조 코드(PP-n, D-n, I-n, R-n) 포함
- 기능 우선순위 "근거" 열이 인사이트 코드와 연결
- 로드맵 각 Phase에 구체적 산출물 명시
- 금지 표현 없음
