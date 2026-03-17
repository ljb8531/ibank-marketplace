---
name: report-matrix
description: >
  리포트 항목 9를 생성한다. 7개 영역 통합 비교 매트릭스와 디자인 시스템 비교표를 작성하여 시각적으로 효과적인 분석으로 정리한다.
  Deep Dive 산출물의 평가 결과를 구조화해 복잡한 설명을 한눈에 비교 가능하게 한다. report-writer가 Step 3에서 호출한다.
argument-hint: [02-deepdive.md 경로]
allowed-tools: Read, Write
---

# 리포트 비교 매트릭스 섹션 생성 (항목 9)

## 입력

$ARGUMENTS = {OUTPUT_BASE}/output/reports/sections/02-deepdive.md 경로 또는 내용. (OUTPUT_BASE는 .benchmark-output-root에서 읽음, 없으면 output.)

## 참조 데이터

- {OUTPUT_BASE}/output/reports/sections/02-deepdive.md (7개 영역 평가 ◉/◎/○)
- {OUTPUT_BASE}/output/reports/sections/01-asis.md (자사 평가)
- {OUTPUT_BASE}/output/data/reference-codes.json
- {OUTPUT_BASE}/output/branding/*.json (Inspire 디자인 시스템)
- {OUTPUT_BASE}/output/data/project-brief.json (design_direction)

## 실행 절차

### Part A: 9. 비교 매트릭스 — 7개 영역 통합

02-deepdive.md에서 각 Direct의 7개 영역 평가(◉/◎/○)를 추출하고, 01-asis.md 기반으로 자사 열을 추가해 통합 테이블 구성.

**테이블:** 평가 영역 | 자사(As-Is) | D-1 | D-2 | D-3 | … (리뉴얼이면 자사 열 포함, 신규 구축이면 자사 열 생략 가능)

**매트릭스 아래 산문 해석 3가지:**

1. **갭 분석**: 자사가 ○(하)인 영역 나열, 해당 영역에서 ◉인 경쟁사(D-n) 명시. "자사는 [영역]에서 하위이며, D-n이 [구체적 방식]으로 선도한다."
2. **경쟁 강도**: 대부분 ◉인 영역(경쟁 치열) vs 편차 큰 영역(미정립) 구분.
3. **자사 상대적 위치**: 전체 종합해 자사가 업계에서 어디쯤인지 한 문단.

### Part B: 9. 비교 매트릭스 (계속) — 디자인 시스템 비교

{OUTPUT_BASE}/output/branding/ 의 JSON을 Read해 비교표 구성.

**테이블 컬럼:** 항목 | R-1: {name} | R-2: {name} | R-3: {name} | 공통 트렌드  
**행:** Color Scheme, Primary Color, Secondary Color, Accent Color, Font Family, H1/Body Size, Base Spacing, Border Radius, Button Style, Layout 구조.

**비교표 아래 산문:**

- **공통 디자인 트렌드**: 3개 사이트에서 공통 관찰 패턴 (타이포, 여백, 라운드, 다크모드 등).
- **자사 프로젝트 적합도**: project-brief의 design_direction(info_density, visual_focus)과 가장 부합하는 사이트 + 이유.
- **디자인 방향 시사점**: "R-n의 [요소] + R-n의 [요소] 참고, 정보 밀도는 [수준]으로 조정" 등 구체적·조합적 권고.

branding JSON이 없는 Inspire는 "디자인 시스템 데이터 미수집"으로 표기.

## 출력

{OUTPUT_BASE}/output/reports/sections/03-matrix.md

## 품질 체크

- "9. 비교 매트릭스" 제목으로 시각적·효과적인 한눈에 비교 구조인가
- 매트릭스에 모든 Direct 사이트가 포함되는가
- 리뉴얼인 경우 자사 열이 있는가
- 갭 분석·경쟁 강도·상대적 위치 해석이 모두 있는가
- 디자인 비교표 "공통 트렌드" 열이 채워져 있는가
