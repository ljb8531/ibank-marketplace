---
name: report-asis
description: >
  리포트 Section 1~2를 생성한다. 분석 목적/범위 정의와 자사 사이트 As-Is 진단을 수행하고,
  이후 모든 섹션에서 참조할 Pain Point 코드(PP-n)를 생성한다.
  report-writer가 Step 1에서 호출한다.
argument-hint: [project-brief.json 내용]
allowed-tools: Read, Write
---

# 리포트 As-Is 섹션 생성

## 입력

$ARGUMENTS = project-brief.json 내용(JSON) 또는 경로. report-writer가 전달한다.

## 참조 데이터

- output/data/project-brief.json (Read)
- output/data/reference-codes.json (참조 코드 매핑, Write로 pain_points 갱신)

## 실행 절차

### Part A: 리포트 메타 헤더

project-brief.json에서 추출하여 리포트 최상단에 배치한다.

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

### Part B: Section 1 — 분석 목적 및 범위

산문(prose) 형태. 불릿/번호 목록을 본문에 사용하지 않는다.

- **B-1. 분석 배경**: market_context, features.improvement_needed를 근거로 리뉴얼/신규 구축 필요성 서술. input_level이 Level 1~2면 context-builder 자율 추론임을 한 문장 명시.
- **B-2. 분석 대상 선정 기준**: Direct(동종·동일 타겟·traffic·discovery_path), Indirect(타 산업·benchmark_feature·implementation_detail), Inspire(수상·design_strength)의 선정 논리. "왜 이 기준으로 골랐는가" 명확히.
- **B-3. 분석 프레임워크 소개**: 7개 평가 영역 소개 — 전략/포지셔닝, IA/네비게이션, UX/UI 디자인, 콘텐츠 전략, 기술/퍼포먼스, 전환 설계, AI/개인화. 각 영역 중요성 1문장.

### Part C: Section 2 — 자사 사이트 현황 진단

**분기:** company.current_url 존재 여부.

**리뉴얼(current_url 있음):**

- C-1. 정량 진단 테이블: 진단 항목 | 현황 | 근거 — 월간 트래픽(traffic), 주요 기능(features.confirmed), 개선 필요 기능(features.improvement_needed), 정보 밀도·비주얼 포커스(design_direction).
- C-2. 정성 진단: design_direction.current_style, improvement_needed 기반으로 IA, UX/UI, 콘텐츠, 모바일 관점 핵심 약점 산문.
- C-3. 핵심 Pain Point: 치명적 문제 3~5개를 **PP-1**, **PP-2**, **PP-3** … 로 정의. 각 항목에 제목 + 구체적 설명(어떤 시나리오에서 어떤 문제인지, 정량 근거 있으면 포함).

**신규 구축(current_url 없음):**

- Section 2 제목을 "시장 현황 및 진입 과제"로. market_context 기반 진입 시 해결 과제를 PP-n으로 정의. 예: PP-1 후발 주자 인지도 부재, PP-2 기능 차별화 필요.

### Part D: Pain Point 코드 저장

생성한 PP-n을 reference-codes.json의 pain_points 배열에 반영한다.

```json
"pain_points": [
  {"code": "PP-1", "title": "...", "description": "...", "severity": "high|medium"},
  {"code": "PP-2", "title": "...", "description": "...", "severity": "high|medium"}
]
```

기존 reference-codes.json이 있으면 pain_points만 덮어쓴다. 없으면 report-writer가 Step 0에서 생성한 구조에 pain_points만 채운다.

## 출력

- **파일:** output/reports/sections/01-asis.md
- **갱신:** output/data/reference-codes.json (pain_points)

sections/ 디렉토리가 없으면 생성 후 저장한다.

## 품질 체크

- PP-n 코드가 최소 3개, 최대 5개 생성되었는가
- 각 PP-n에 구체적 설명(30자 이상)이 있는가
- 리뉴얼인데 Section 2가 스킵되지 않았는가
- 신규 구축인데 Section 2가 "자사 진단"으로 쓰이지 않았는가
