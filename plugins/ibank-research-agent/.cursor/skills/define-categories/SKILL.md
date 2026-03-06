---
name: define-categories
description: RFP/브리프를 분석해 산업·서비스 카테고리(1~3개), 핵심 목적, 주요 기능, 타깃 사용자를 정의한다. Domain Scout가 벤치마크 선정 전에 호출. Use when starting benchmark selection or when user asks to define project categories from a brief.
---

# define-categories

브리프(RFP)에서 서비스 유형을 분석해 **1~3개의 명확한 산업/서비스 카테고리**와 핵심 속성을 정의한다. 이후 Direct/Indirect/Inspiration 선정의 기준이 된다.

## 입력

- **brief_summary** (또는 **brief_text**): 프로젝트 브리프 요약 또는 원문. 다음이 포함될 수 있다.
  - 만들고자 하는 서비스 설명
  - 타겟 사용자
  - 참고하고 싶은 서비스
  - domain, keywords, scope, must_include (Orchestrator가 이미 추출한 경우)

## 목표 및 기준

- RFP의 서비스 유형을 분석해 **1~3개의 명확한 카테고리**로 분류한다.
- **핵심 목적**: 정보제공 vs 커머스 vs 커뮤니티 vs 예약/결제 등
- **주요 기능**: 예약, 결제, 스트리밍, 게시판, 검색, 추천 등
- **타깃 사용자 및 서비스 모델**: B2B, B2C, C2C 등

## RFP → 카테고리 매핑 예시

| 브리프 유형     | 산업 카테고리   |
|----------------|----------------|
| 쇼핑몰 구축    | eCommerce      |
| 교육 플랫폼    | eLearning      |
| 병원 홈페이지  | Healthcare     |
| 여행 예약      | Travel Booking |
| SaaS B2B 도구  | SaaS / B2B     |

"RFP에서 제시된 서비스 유형을 분석하여 해당 웹사이트가 속하는 산업 카테고리를 1개~3개 정의하라. 서비스의 핵심 목적과 주요 기능을 기반으로 가장 적합한 표준 산업 분류를 사용할 것."

## 실행 절차

1. 브리프에서 **서비스 유형·목적·기능·타깃**을 추출한다.
2. 위 매핑 예시와 핵심 목적(정보/커머스/커뮤니티 등)을 참고해 **industry_categories**(1~3개)를 정한다.
3. **core_purpose**, **main_features**, **target_users**, **service_model**(B2B/B2C/C2C 등)을 한 줄씩 요약한다.

## 출력

다음 JSON 구조로 반환한다.

```json
{
  "industry_categories": ["eCommerce", "Beauty"],
  "core_purpose": "화장품 이커머스, 제품 정보 제공 및 구매 전환",
  "main_features": ["제품 카탈로그", "검색/필터", "결제", "리뷰"],
  "target_users": "국내 소비자, 20~40대 여성",
  "service_model": "B2C",
  "rationale": "브리프에서 언급된 내용을 바탕으로 한 카테고리 선정 이유 (1~2문장)"
}
```

## 호출자

- **Domain Scout**: Phase 1에서 1회 호출. 반환값을 select-benchmark-candidates 호출 시 categories·core_purpose 등으로 전달한다.
