---
name: benchmark-report
description: >
  Generates structured benchmark reports from the final confirmed site list (7–10 items).
  Use when the orchestrator has completed PHASE 4 site selection and needs to produce
  benchmark-report.md and executive-summary.md. Called exactly once per run, by orchestrator only.
argument-hint: [최종 확정 데이터 JSON]
allowed-tools: Read, Write
---

# Benchmark Report

최종 확정된 벤치마킹 사이트 목록을 받아 `output/reports/` 하위에 마크다운 리포트 두 개를 생성한다. **MCP는 사용하지 않는다.** Read·Write만 사용.

---

## 언제·누가·어떻게

| 항목 | 내용 |
|------|------|
| **호출 시점** | PHASE 4 Step 3 — site-auditor 검증 후, 최종 7~10개 선정 및 `status: "Confirmed"` 반영 직후 |
| **호출 주체** | **orchestrator만** (context-builder, market/ux/design-researcher, site-auditor는 사용하지 않음) |
| **호출 횟수** | 벤치마킹 1회당 **1회** |
| **인자** | 확정된 7~10개 후보 JSON (type, name, url, selection_reason, discovery_path, traffic; Indirect는 benchmark_feature·implementation_detail, Inspire는 screenshots·branding·design_strength 등) |

---

## MCP / 도구

- **MCP 서버:** **사용하지 않음.** (brave-search, firecrawl 등 불필요)
- **사용 도구:** **Read**, **Write** 만.
  - **Read:** `output/branding/*.json`, `output/screenshots/` 구조, 필요 시 `output/data/candidates.json` 참조.
  - **Write:** `output/reports/benchmark-report.md`, `output/reports/executive-summary.md` 저장.

---

## 입력

`$ARGUMENTS` = 최종 확정 사이트 리스트(JSON). 각 항목은 `output-format.mdc` 공통 포맷 준수, `status: "Confirmed"`인 7~10개.

---

## 실행 절차

### Step 1: 벤치마킹 테이블

확정 리스트를 마크다운 테이블로 정리한다.

```markdown
| Type | Service | URL | Selection Reason |
|------|---------|-----|------------------|
| DIRECT | ... | ... | ... |
| INDIRECT | ... | ... | ... |
| INSPIRE | ... | ... | ... |
```

### Step 2: 디자인 시스템·레이아웃 비교표 (Inspire만)

- **Read** `output/branding/{서비스명}.json` — Inspire 유형 사이트에 해당하는 파일만.
- **디자인 시스템:** Color Scheme, Primary Color, Font Family, Base Spacing 등 사이트별 컬럼으로 비교표 작성.
- **레이아웃 구조:** JSON에 `branding.layout.sections`가 있으면, 각 사이트의 페이지 레이아웃(상단→하단 섹션 순서·타입: GNB, hero, grid, carousel, footer 등)을 비교표 또는 리스트로 리포트에 포함한다. 예: "Site A: gnb → hero → 4열 그리드(우측 로그인) → 가로 스크롤 카드 → footer".

### Step 3: 스크린샷 참조

- **Read** `output/screenshots/` 디렉토리 구조.
- 사이트별 `desktop_full`, `mobile_full` 등 경로를 마크다운에 삽입.

### Step 4: 경영진 요약 (500자 이내)

- 벤치마킹 대상 개요 (Direct/Indirect/Inspire 각 개수)
- 핵심 인사이트 3가지
- 시장 포지셔닝·디자인 트렌드 요약
- 권고 사항

### Step 5: 저장 및 반환

- **Write** `output/reports/benchmark-report.md` — 전체 리포트(테이블 + 디자인 시스템·레이아웃 비교표 + 스크린샷 참조).
- **Write** `output/reports/executive-summary.md` — 경영진 요약만.
- 응답: "리포트가 다음 경로에 저장되었습니다:" + 두 파일 경로.

---

## 출력 경로 (file-conventions.mdc 준수)

| 파일 | 내용 |
|------|------|
| `output/reports/benchmark-report.md` | 벤치마킹 테이블, 디자인 시스템·레이아웃 구조 비교(Inspire), 스크린샷 참조 |
| `output/reports/executive-summary.md` | 500자 이내 경영진 요약 |
