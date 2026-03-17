---
name: report-deepdive
description: >
  리포트 항목 7, 8을 생성한다. 벤치마킹 대상 Overview와 사이트별 Deep Dive 상세분석을 수행한다.
  유형별(Direct/Indirect/Inspire) 분석 깊이와 포커스가 다르며, 01-asis의 Pain Point·목적/범위와 논리적 스토리라인 일관성을 유지한다. report-writer가 Step 2에서 호출한다.
argument-hint: [확정 후보 JSON]
allowed-tools: Read, Write
---

# 리포트 Deep Dive 섹션 생성 (항목 7, 8)

## 입력

$ARGUMENTS = 확정된 7~10개 후보 JSON (status: "Confirmed"). report-writer가 전달.

## 경로 (OUTPUT_BASE)

프로젝트 루트의 `.benchmark-output-root`를 읽어 OUTPUT_BASE 확정(없으면 `output`). 모든 경로는 `{OUTPUT_BASE}/output/...`.

## 참조 데이터

- {OUTPUT_BASE}/output/data/reference-codes.json (PP-n, D-n, I-n, R-n 매핑)
- {OUTPUT_BASE}/output/reports/sections/01-asis.md (목적·범위·Pain Point — 스토리라인 일관성 참조)
- {OUTPUT_BASE}/output/data/candidates.json (상세 메타)
- {OUTPUT_BASE}/output/branding/{서비스명}.json (Inspire)
- {OUTPUT_BASE}/output/screenshots/{서비스명}/ (Inspire)

## 실행 절차

### Part A: 7. 벤치마킹 대상 Overview

reference-codes.json의 코드를 사용해 마스터 테이블 생성.

**Direct:** 코드 | 서비스명 | URL | 월간 트래픽 | 발굴 경로 | 선정 사유  
**Indirect:** 코드 | 서비스명 | URL | 벤치마킹 기능 | 구현 방식 | 선정 사유  
**Inspire:** 코드 | 서비스명 | URL | 수상 이력 | 디자인 강점 | 선정 사유

"그래서 우리는 이런 대상을 벤치마킹했다"를 전제로, 유형별 서브섹션(7-1 Direct, 7-2 Indirect, 7-3 Inspire)으로 구분한다.

### Part B: 8. 벤치마킹 상세분석 (Deep Dive) — Direct

각 Direct 사이트(D-1, D-2, …)마다:

1. **사이트 개요**: 서비스·타겟·서비스 모델, 월간 트래픽·시장 위치 2~3문장.
2. **7개 영역 평가 테이블**: 평가 영역 | 평가(◉/◎/○) | 관찰 내용 | 자사 Pain Point 연결  
   - ◉ 상(업계 상위) / ◎ 중(업계 평균) / ○ 하(업계 하위)  
   - 영역: 전략/포지셔닝, IA/네비게이션, UX/UI 디자인, 콘텐츠 전략, 기술/퍼포먼스, 전환 설계, AI/개인화.
3. **핵심 Takeaway**: 배울 점 1~2가지 + 이 사이트 한계. "자사 [PP-n] 해결을 위해 이 사이트의 [요소]를 [이렇게] 참고할 수 있다" 형태로 액션 지향.

### Part C: 8. 벤치마킹 상세분석 (계속) — Indirect

각 Indirect(I-1, I-2, …)마다 **벤치마킹 대상 기능에만 집중**:

1. **기능 개요**: 해당 기능 구현 방식 3~4문장.
2. **구현 상세 분석 테이블**: 분석 항목 | 관찰 내용 — 사용자 동선(진입→완료 단계), 정보 구조, 마이크로 인터랙션, 에러/엣지케이스 처리.
3. **자사 프로젝트 적용 방안**: 우리 서비스에 적용 시 변형/적용 방법, 업종 차이 조정, 기술 고려사항. PP-n과 연결해 "이 접근이 [PP-n]을 [이렇게] 해결한다" 서술.

### Part D: 8. 벤치마킹 상세분석 (계속) — Design Inspiration

각 Inspire(R-1, R-2, …)마다:

1. **스크린샷**: Desktop/Mobile 이미지 링크 — {OUTPUT_BASE}/output/screenshots/{서비스명}/desktop_full.png, mobile_full.png
2. **디자인 시스템 요약 테이블**: Color Scheme, Primary/Secondary/Accent, Font Family, H1/Body Size, Base Spacing, Border Radius (branding JSON에서)
3. **페이지 레이아웃 구조**: layout.sections 있으면 순서·type·grid·스크롤 방식 서술
4. **디자인 강점 분석**: design_strength를 레이아웃·시각 위계·여백·타이포·인터랙션 관점으로 풀어서 서술. "왜 효과적인가" 논리적으로.
5. **자사 적용 시사점**: project-brief의 info_density, visual_focus와 비교해 차용 가능 요소·적합성 판단.

## 출력

{OUTPUT_BASE}/output/reports/sections/02-deepdive.md

## 품질 체크

- "7. 벤치마킹 대상 Overview", "8. 벤치마킹 상세분석" 제목이 명확히 구분되는가
- 01-asis의 분석 목적·범위·Pain Point와 논리적으로 연결된 스토리라인인가 (자사 적용 시사점이 PP-n과 연결되는가)
- 모든 Confirmed 사이트가 Deep Dive에 포함되는가
- 각 Direct에 7개 영역 평가 테이블이 있는가
- 각 사이트에 "자사 적용 시사점" 또는 "적용 방안"이 있는가
- PP-n 참조가 최소 3회 이상인가
- 금지 표현("좋아 보여서", "예쁘다" 등)이 없는가