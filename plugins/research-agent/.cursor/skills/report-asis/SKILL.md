---
name: report-asis
description: >
  리포트 항목 1, 2, 3, 5, 6을 생성한다. 리포트 개요(메타정보), 분석 목적/범위, 시장·동종 업계 트렌드, 자사 AS-Is 진단, 핵심 Pain Point(PP-n)를 작성한다.
  report-writer가 Step 1에서 호출한다.
argument-hint: [project-brief.json 내용]
allowed-tools: Read, Write
---

# 리포트 As-Is·트렌드 섹션 생성 (항목 1, 2, 3, 5, 6)

## 입력

$ARGUMENTS = project-brief.json 내용(JSON) 또는 경로. report-writer가 전달한다.

## 경로 (OUTPUT_BASE)

프로젝트 루트의 `.benchmark-output-root`를 읽어 OUTPUT_BASE 확정(없으면 `output`). 모든 경로는 `{OUTPUT_BASE}/output/...`.

## 참조 데이터

- {OUTPUT_BASE}/output/data/project-brief.json (Read)
- {OUTPUT_BASE}/output/data/reference-codes.json (참조 코드 매핑, Write로 pain_points 갱신)

## 실행 절차

### Part A: 1. 리포트 개요 (메타정보)

project-brief.json에서 추출하여 리포트 최상단에 **"1. 리포트 개요"** 제목으로 배치한다.

| 항목 | project-brief 필드 |
|------|-------------------|
| 프로젝트 | company.name, project.type |
| 대상 URL | company.current_url |
| 업종/카테고리 | company.industry, categories[0].name_ko |
| 타겟 | target_users.segment, target_users.demographics |
| 서비스 모델 | service_model.type |
| 인풋 레벨 | input_level |
| 분석 일시 | 현재 날짜·시각 |
| 벤치마킹 대상 | Direct n개 · Indirect n개 · Inspire n개 (reference-codes.json 기준) |

마크다운 테이블 형태로 작성한다.

### Part B: 2. 분석의 목적과 범위

**"2. 분석의 목적과 범위"** 제목 하에 산문(prose) 형태. 불릿/번호 목록을 본문에 사용하지 않는다.

- **B-1. 분석 배경**: market_context, features.improvement_needed를 근거로 리뉴얼/신규 구축 필요성 서술. input_level이 Level 1~2면 context-builder 자율 추론임을 한 문장 명시.
- **B-2. 분석 대상 선정 기준**: Direct(동종·동일 타겟·traffic·discovery_path), Indirect(타 산업·benchmark_feature·implementation_detail), Inspire(수상·design_strength)의 선정 논리. "왜 이 기준으로 골랐는가" 명확히.
- **B-3. 분석 프레임워크 소개**: 7개 평가 영역 소개 — 전략/포지셔닝, IA/네비게이션, UX/UI 디자인, 콘텐츠 전략, 기술/퍼포먼스, 전환 설계, AI/개인화. 각 영역 중요성 1문장.

### Part C: 3. 시장·동종 업계 트렌드

**"3. 시장·동종 업계 트렌드"** 제목 하에, 고객 요청·사전 정리된 내용·요청 방향에 포커싱된 트렌드를 서술한다.

- **입력**: project-brief의 `market_context`, `design_direction.industry_trend`, 인풋(raw-input)에 명시된 고객 관심사·요청 방향이 있으면 반영.
- **내용**: (1) 시장·동종 업계에서의 UX/디자인·기능·콘텐츠 트렌드 요약 (2~4문단). (2) "이번 분석 요청의 방향성"에 맞춰 어떤 트렌드가 특히 관련 있는지 명시. 포괄적 나열이 아니라 **요청 방향에 초점을 맞춘** 트렌드 정리.
- 산문 형태. 출처(브리프·검색 추론)가 context-builder 기반이면 한 문장으로 명시.

### Part D: 5. AS-Is 분석 (자사 사이트 현황 진단)

**"5. AS-Is 분석"** 제목. **분기:** company.current_url 존재 여부.

**리뉴얼(current_url 있음):**

- D-1. 정량 진단 테이블: 진단 항목 | 현황 | 근거 — 월간 트래픽(traffic), 주요 기능(features.confirmed), 개선 필요 기능(features.improvement_needed), 정보 밀도·비주얼 포커스(design_direction).
- D-2. 정성 진단: design_direction.current_style, improvement_needed 기반으로 IA, UX/UI, 콘텐츠, 모바일 관점 핵심 약점 산문. "그렇다면 우리는 어떠한가"를 명확히 서술.

**신규 구축(current_url 없음):**

- 제목을 "5. 시장 현황 및 진입 과제"로. market_context 기반 진입 시 해결 과제를 서술. 자사 진입 포지셔닝·과제를 구체적으로.

### Part E: 6. 핵심 Pain Point

**"6. 핵심 Pain Point"** 제목. 치명적 문제 3~5개를 **PP-1**, **PP-2**, **PP-3** … 로 정의.

- 각 항목: 제목 + 구체적 설명(어떤 시나리오에서 어떤 문제인지, 정량 근거 있으면 포함).
- 신규 구축인 경우: PP-1 후발 주자 인지도 부재, PP-2 기능 차별화 필요 등 market_context 기반 진입 과제를 PP-n으로 정의.

### Part F: Pain Point 코드 저장

생성한 PP-n을 reference-codes.json의 pain_points 배열에 반영한다.

```json
"pain_points": [
  {"code": "PP-1", "title": "...", "description": "...", "severity": "high|medium"},
  {"code": "PP-2", "title": "...", "description": "...", "severity": "high|medium"}
]
```

기존 reference-codes.json이 있으면 pain_points만 덮어쓴다. 없으면 report-writer가 Step 0에서 생성한 구조에 pain_points만 채운다.

## 출력

- **파일:** {OUTPUT_BASE}/output/reports/sections/01-asis.md (항목 1, 2, 3, 5, 6 포함)
- **갱신:** {OUTPUT_BASE}/output/data/reference-codes.json (pain_points)

sections/ 디렉토리가 없으면 생성 후 저장한다.

## 품질 체크

- "1. 리포트 개요", "2. 분석의 목적과 범위", "3. 시장·동종 업계 트렌드", "5. AS-Is 분석", "6. 핵심 Pain Point" 제목이 모두 포함되는가
- PP-n 코드가 최소 3개, 최대 5개 생성되었는가
- 각 PP-n에 구체적 설명(30자 이상)이 있는가
- 항목 3이 요청 방향에 포커싱된 트렌드로 작성되었는가 (포괄적 나열 지양)
- 리뉴얼인데 AS-Is(5)가 스킵되지 않았는가
- 신규 구축인데 5번이 "자사 사이트 진단"이 아닌 "시장 현황·진입 과제"로 되어 있는가
