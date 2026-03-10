# Benchmark-Report 스킬 가이드

벤치마킹 에이전트 워크플로우에서 **benchmark-report** 스킬의 역할, 사용 방법, 구성 방법을 정리한 문서입니다.  
상위 설계서: [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md), [orchestrator-agent-guide.md](./orchestrator-agent-guide.md)

---

## 1. 역할 (Role)

### 1-1. 목적

**benchmark-report**는 **최종 확정된 벤치마킹 사이트 목록과 수집된 분석 데이터를 기반으로 구조화된 벤치마킹 리포트를 생성하는 스킬**입니다.

- **핵심 가치:** PHASE 2~3에서 수집한 후보 데이터, 스크린샷, 브랜딩 JSON을 한곳에 정리하여 **벤치마킹 테이블**, **디자인 시스템 비교표**, **경영진 요약**을 산출합니다.
- **워크플로우 내 위치:** 벤치마킹 프로세스의 **마지막 단계(PHASE 4)**에서, orchestrator가 최종 7~10개를 확정한 뒤 **한 번만** 호출합니다.

### 1-2. 담당 기능

| 구분 | 내용 |
|------|------|
| **입력** | 최종 확정된 사이트 리스트(JSON) — status가 "Confirmed"인 7~10개 후보 및 메타데이터 |
| **실행 방식** | MCP 미사용. `output/` 하위 기존 산출물(브랜딩 JSON, 스크린샷 경로, candidates 데이터)을 Read로 읽어 마크다운 리포트 생성 후 Write로 저장 |
| **출력** | `output/reports/benchmark-report.md`(전체 리포트), `output/reports/executive-summary.md`(경영진 요약) |
| **품질 보장** | 확정 데이터만 포함, Direct/Indirect/Inspire 유형별 테이블 정리, Inspire 유형에 한해 디자인 시스템 비교표 포함 |

### 1-3. 파일 규칙과의 관계

`.cursor/rules/file-conventions.mdc`에 정의된 리포트 저장 규칙을 따릅니다.

- **리포트:** `output/reports/benchmark-report.md` (메인 리포트), `output/reports/executive-summary.md` (경영진 요약)
- **참조 데이터:** `output/branding/{서비스명}.json`, `output/screenshots/{서비스명}/`, `output/data/candidates.json`

---

## 2. 사용 방법 (Usage)

### 2-1. 호출 방식

- **스킬 이름:** `benchmark-report`
- **인자 힌트:** `[최종 확정 데이터 JSON]`
- **사용 예:** orchestrator가 PHASE 4 Step 3에서 확정된 7~10개 후보(JSON 배열 또는 객체)를 인자로 넘겨 호출합니다.

최종 확정 데이터에는 각 사이트의 `type`, `name`, `url`, `selection_reason`, `discovery_path`, `traffic`, (Indirect인 경우) `benchmark_feature`·`implementation_detail`, (Inspire인 경우) `screenshots`·`branding`·`design_strength` 등이 포함됩니다.

### 2-2. 서브에이전트별 사용처

#### Orchestrator (PHASE 4)

| 단계 | 용도 | 설명 |
|------|------|------|
| PHASE 4 Step 3 | 리포트 생성 | PASS 후보 중 최종 7~10개 선정 및 `status: "Confirmed"` 반영 후, 해당 확정 데이터를 인자로 `/benchmark-report` 호출. 스킬 내부에서 `benchmark-report.md`, `executive-summary.md` 생성 |

- **필수 여부:** **필수.** 벤치마킹 런의 최종 산출물은 이 스킬을 통해 생성됩니다.
- **호출 주체:** **orchestrator만** 사용합니다. context-builder, market/ux/design-researcher, site-auditor는 이 스킬을 사용하지 않습니다.

### 2-3. PHASE별 사용 시점 요약

| PHASE | benchmark-report 사용 여부 |
|-------|---------------------------|
| PHASE 0 (context-builder) | ❌ 미사용 |
| PHASE 1 (orchestrator 작업 분배) | ❌ 미사용 |
| PHASE 2 (병렬 탐색) | ❌ 미사용 |
| PHASE 3 (site-auditor 검증) | ❌ 미사용 |
| **PHASE 4 (최종 확정 및 리포트)** | ✅ **사용** — Step 3에서 1회 호출 |

---

## 3. 구성 방법 (Configuration)

### 3-1. 스킬 정의 파일 구조

스킬은 `.cursor/skills/benchmark-report/SKILL.md`에 정의합니다.

```yaml
---
name: benchmark-report
description: >
  최종 확정된 벤치마킹 사이트 목록과 분석 데이터를 기반으로
  구조화된 벤치마킹 리포트를 생성하는 스킬.
  벤치마킹 프로세스의 마지막 단계에서 사용.
disable-model-invocation: true
argument-hint: [최종 확정 데이터 JSON]
allowed-tools: Read, Write
---

# 벤치마킹 리포트 생성

## 입력
$ARGUMENTS = 최종 확정된 사이트 리스트 (JSON)

## 실행 절차

### Step 1: 벤치마킹 테이블 생성
확정된 7~10개 사이트를 다음 마크다운 테이블로 정리한다:

| Type | Service | URL | Selection Reason |
|------|---------|-----|-----------------|
| DIRECT | ... | ... | ... |
| INDIRECT | ... | ... | ... |
| INSPIRE | ... | ... | ... |

### Step 2: 디자인 시스템 비교표 생성 (Inspire 유형만)
output/branding/ 디렉토리의 JSON 파일을 읽어서 비교표를 생성한다:

| 항목 | Site A | Site B | Site C |
|------|--------|--------|--------|
| Color Scheme | light | dark | light |
| Primary Color | #FF6B35 | #004E89 | ... |
| Font Family | Inter | Roboto | ... |
| Base Spacing | 8px | 4px | ... |

### Step 3: 스크린샷 참조 정리
output/screenshots/ 디렉토리의 이미지를 사이트별로 정리하여
마크다운에 이미지 경로를 삽입한다.

### Step 4: 경영진 요약 (Executive Summary)
전체 분석 결과를 500자 이내로 요약한다:
- 벤치마킹 대상 개요 (Direct / Indirect / Inspire 각 몇 개)
- 핵심 인사이트 3가지
- 시장 포지셔닝 요약
- 디자인 트렌드 요약
- 권고 사항

### Step 5: 파일 저장
- output/reports/benchmark-report.md (전체 리포트)
- output/reports/executive-summary.md (경영진 요약)

## 출력
"리포트가 다음 경로에 저장되었습니다:" 와 함께 파일 경로를 반환한다.
```

### 3-2. MCP 서버

benchmark-report는 **MCP를 사용하지 않습니다.** 파일 시스템(Read, Write)만 사용합니다.

- **allowed-tools:** `Read`, `Write`
- **disable-model-invocation:** `true` — 스킬 실행 시 모델 재호출 없이 절차만 수행하도록 설정 가능한 경우 사용

### 3-3. 서브에이전트에 스킬 연결

benchmark-report를 사용하는 서브에이전트는 **orchestrator** 하나뿐입니다. MCP는 필요하지 않습니다.

| Subagent | skills 항목 | 비고 |
|----------|-------------|------|
| **orchestrator** | multi-search, **benchmark-report** | PHASE 4 Step 3에서만 호출 |

- **context-builder**, **market-researcher**, **ux-researcher**, **design-researcher**, **site-auditor**는 benchmark-report를 사용하지 않습니다.

### 3-4. Skill — 호출 주체 매핑 요약

| Skill | 사용 MCP | 호출 주체 (Subagent) | 호출 시점 |
|-------|----------|----------------------|-----------|
| benchmark-report | 없음 (파일 시스템만) | **orchestrator** | PHASE 4 Step 3 (최종 확정 후 1회) |

### 3-5. 입출력 상세

#### 입력 (인자)

| 항목 | 설명 |
|------|------|
| **$ARGUMENTS** | 최종 확정된 7~10개 후보를 담은 JSON. 각 항목은 `output-format.mdc`의 공통 포맷( type, name, url, status: "Confirmed", selection_reason, discovery_path, traffic 등 )을 따르며, Indirect는 benchmark_feature·implementation_detail, Inspire는 screenshots·branding·design_strength 등 선택 필드를 포함할 수 있음 |

#### 참조하는 기존 산출물 (Read)

| 경로 | 용도 |
|------|------|
| `output/data/candidates.json` | 확정 목록 검증·메타 보강 시 참조 가능 |
| `output/branding/{서비스명}.json` | Step 2 디자인 시스템 비교표 생성 (Inspire 유형) |
| `output/screenshots/{서비스명}/` | Step 3 스크린샷 경로 정리 (desktop_full, mobile_full 등) |

#### 출력 (Write)

| 경로 | 내용 |
|------|------|
| `output/reports/benchmark-report.md` | 벤치마킹 테이블, 디자인 시스템 비교표(Inspire), 스크린샷 참조, 상세 분석 |
| `output/reports/executive-summary.md` | 500자 이내 경영진 요약(대상 개요, 핵심 인사이트 3가지, 시장·디자인 트렌드, 권고 사항) |

---

## 4. 요약

- **역할:** 최종 확정된 7~10개 벤치마킹 사이트와 기존 산출물(브랜딩, 스크린샷)을 읽어, 구조화된 마크다운 리포트(benchmark-report.md)와 경영진 요약(executive-summary.md)을 생성하는 **리포트 전용 스킬**. MCP 없이 파일 시스템만 사용.
- **사용:** **orchestrator**가 PHASE 4 Step 3에서 **1회만** 호출. 인자로 확정된 후보 JSON을 넘기면, 스킬 내부에서 `output/reports/` 하위 두 파일을 생성하고 저장 경로를 반환.
- **구성:** `.cursor/skills/benchmark-report/SKILL.md`에 YAML 프론트매터와 5단계 실행 절차(테이블 → 디자인 비교표 → 스크린샷 참조 → 경영진 요약 → 저장)를 두고, orchestrator 에이전트의 `skills`에 `benchmark-report`를 포함시키면 됩니다. 별도 MCP 설정은 필요하지 않습니다.

상세 워크플로우·서브에이전트·다른 스킬 정의는 [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md), PHASE 4와의 관계는 [orchestrator-agent-guide.md](./orchestrator-agent-guide.md)를 참조하면 됩니다.
