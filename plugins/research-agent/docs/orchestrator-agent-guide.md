# Orchestrator 서브에이전트 가이드

벤치마킹 에이전트 워크플로우에서 **PHASE 1: 작업 분배**를 담당하는 **orchestrator** 서브에이전트의 역할과 사용 스킬을 정의한 문서입니다.  
본 문서는 [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md)의 PHASE 1 및 orchestrator 설계를 기준으로 합니다.

---

## 1. PHASE 1: 작업 분배 — Orchestrator의 역할

### 1-1. 위치와 책임

Orchestrator는 **context-builder**가 생성한 표준화된 **프로젝트 브리프**를 입력받아, 이후 PHASE 2~4를 조율하는 **총괄 에이전트**입니다.  
PHASE 1에서는 “브리프 검증”과 “작업 분배 준비”만 수행하며, 실제 병렬 탐색(PHASE 2)은 그 다음 단계에서 진행합니다.

| 구분 | 설명 |
|------|------|
| **입력** | `output/data/project-brief.json` (context-builder 산출물) 또는 상위에서 전달된 프로젝트 브리프 JSON |
| **PHASE 1 산출** | 검증·보완된 브리프, 확정된 Indirect 기능 포인트, 3개 탐색 에이전트용 **작업 지시서** |
| **이후 단계** | PHASE 2 병렬 탐색 → PHASE 3 site-auditor 검증 → PHASE 4 최종 확정 및 리포트 |

### 1-2. PHASE 1 세부 단계 (역할 정의)

#### Step 1-1: 프로젝트 브리프 수신

- context-builder가 전달한 `project_brief` JSON을 수신한다.
- 필요 시 `output/data/project-brief.json`에서 직접 읽는다.
- **역할:** 브리프 존재 여부·구조 유효성 확인, 이후 단계용 단일 소스 확보.

#### Step 1-2: 카테고리 검증

- 브리프 내 **categories** 배열의 각 항목에 대해 **search_keywords_en**(영문 검색 키워드)으로 검색을 실행한다.
- 검색 결과가 **예상 산업·서비스 영역과 일치하는지** 검증한다.
- 불일치 시 키워드를 조정하고, 필요하면 브리프의 `categories`를 업데이트한 뒤 `project-brief.json`을 다시 저장한다.
- **역할:** 잘못된 카테고리/키워드로 인한 후보 탐색 오염을 PHASE 2 이전에 방지.

#### Step 1-3: Indirect 기능 포인트 최종 확정

- 브리프의 **indirect_feature_points**를 검토한다.
  - **3개 초과** → 우선순위 기준으로 **3개로 축소**.
  - **0개** → **features**(confirmed/inferred 등) 중 차별화 가능성이 큰 기능 1~2개를 선정해 indirect 포인트로 추가.
- **역할:** UX-researcher 등 하위 에이전트에 전달할 “Indirect 벤치마킹 기능”을 명확히 고정.

#### Step 1-4: 작업 지시서 생성

- 다음 3개 서브에이전트에 넘길 **작업 지시서**를 구성한다.
  - **market-researcher:** categories(카테고리명 + 검색 키워드), target_users, service_model, domestic_project, competitive_hints.
  - **ux-researcher:** indirect_feature_points(최대 3개), target_users, features 상세 설명.
  - **design-researcher:** categories, design_direction, project.core_purpose.
- **역할:** PHASE 2 병렬 실행 시 각 에이전트가 동일한 브리프 해석과 목표를 공유하도록 함.

### 1-3. PHASE 1 요약

| 항목 | 내용 |
|------|------|
| **목적** | 브리프 검증 + 카테고리 검증 + Indirect 포인트 확정 + 작업 지시서 작성 |
| **소요 시간** | 약 3~5분 (인풋 레벨 무관) |
| **성공 조건** | categories 검증 완료, indirect_feature_points 0~3개 확정, 3개 에이전트용 지시서 완성 |

---

## 2. PHASE 1에서 사용할 스킬

Orchestrator 에이전트에는 **multi-search**, **benchmark-report** 두 스킬이 지정됩니다.  
이 중 **PHASE 1**에서 실제로 사용하는 스킬은 아래와 같습니다.

### 2-1. PHASE 1 필수 스킬: multi-search

| 항목 | 설명 |
|------|------|
| **스킬 이름** | `multi-search` |
| **사용 시점** | Step 1-2 카테고리 검증 |
| **용도** | 각 카테고리의 **search_keywords_en**으로 검색을 실행해, 결과가 예상 산업·도메인과 일치하는지 검증 |
| **필수 여부** | **필수** — 카테고리/키워드 검증 없이 PHASE 2로 넘기면 잘못된 후보가 대량 유입될 수 있음 |

**사용 방법 요약**

- 브리프의 `categories[].search_keywords_en`를 쿼리로 사용.
- `/multi-search` 스킬 또는 스킬 문서([.cursor/skills/multi-search/SKILL.md](../.cursor/skills/multi-search/SKILL.md))에 따라 Brave Search 한·영 병렬 검색 후 결과 통합.
- 검증 결과에 따라 키워드 수정 또는 categories 보완 후 `project-brief.json` 갱신.

**공통 스킬 적용**

- multi-search는 context-builder, market/ux/design-researcher 등 여러 서브에이전트에서 공통 사용됩니다.
- Orchestrator의 PHASE 1에서는 “카테고리 검증”이라는 **검증용** 목적으로만 사용하면 됩니다.

### 2-2. PHASE 1에서 사용하지 않는 스킬: benchmark-report

| 항목 | 설명 |
|------|------|
| **스킬 이름** | `benchmark-report` |
| **사용 시점** | **PHASE 4** (최종 확정 및 리포트) |
| **PHASE 1 관계** | PHASE 1에서는 호출하지 않음. 동일 orchestrator가 PHASE 4에서 최종 7~10개 확정 후 리포트 생성 시 사용 |

Orchestrator 에이전트 정의에 benchmark-report가 포함되는 이유는 **PHASE 1~4를 한 에이전트가 연속 수행**하기 때문이며, PHASE 1 역할만 보면 “작업 분배 + 검증”에만 집중하면 됩니다.

### 2-3. 스킬 요약 표

| 스킬 | PHASE 1 사용 여부 | 용도 |
|------|-------------------|------|
| **multi-search** | ✅ 사용 (Step 1-2) | 카테고리 검증 검색 |
| **benchmark-report** | ❌ 미사용 (PHASE 4에서 사용) | 최종 벤치마킹 리포트 생성 |

---

## 3. Orchestrator 에이전트 설정 (참조)

PHASE 1을 수행하는 orchestrator 서브에이전트는 아래와 같이 스킬·MCP를 갖는 것을 전제로 합니다.  
(실제 에이전트 파일은 [.cursor/agents/orchestrator.md](../.cursor/agents/orchestrator.md) 참조.)

| 항목 | 값 |
|------|-----|
| **MCP 서버** | brave-search |
| **스킬** | multi-search, benchmark-report |
| **도구** | Read, Write, Bash, Grep, Glob |

- **PHASE 1**에서는 **brave-search** + **multi-search**만 사용하면 되며, benchmark-report는 PHASE 4에서만 사용합니다.

---

## 4. 관련 문서

- [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md) — 전체 워크플로우, PHASE 0~4, 서브에이전트·스킬 목록
- [.cursor/agents/orchestrator.md](../.cursor/agents/orchestrator.md) — Orchestrator 에이전트 YAML 및 PHASE 2~4 절차
- [.cursor/skills/multi-search/SKILL.md](../.cursor/skills/multi-search/SKILL.md) — multi-search 스킬 상세 (카테고리 검증 포함 사용처)
