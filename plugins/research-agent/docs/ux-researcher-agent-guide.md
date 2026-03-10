# UX-Researcher 서브에이전트 가이드

벤치마킹 에이전트 워크플로우에서 **PHASE 2: 병렬 탐색**의 한 축을 담당하는 **ux-researcher** 서브에이전트의 역할과 사용 스킬을 정의한 문서입니다.  
본 문서는 [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md)의 PHASE 2 및 ux-researcher 설계를 기준으로 합니다.

---

## 1. PHASE 2: 병렬 탐색 — UX-Researcher의 역할

### 1-1. 위치와 책임

UX-researcher는 PHASE 2에서 **orchestrator**가 병렬로 기동하는 **3개 탐색 에이전트 중 하나**입니다.  
**타 산업군에서 특정 기능/UX를 탁월하게 구현한 서비스**를 기능 단위로 발굴하며, **Indirect Competitor** 후보를 산출합니다. 산업을 한정하지 않고 “해당 기능을 가장 잘 구현한 서비스”를 찾는 것이 목표입니다.

| 구분 | 설명 |
|------|------|
| **입력** | orchestrator가 전달한 작업 지시서: **indirect_feature_points**(최대 3개), target_users, **features의 상세 설명** |
| **PHASE 2 산출** | **Indirect** 유형 후보 4~6개 (공통 출력 포맷 JSON) |
| **실행 시점** | PHASE 2 — market-researcher, design-researcher와 **동시에** 실행 |

### 1-2. Orchestrator로부터 받는 전달 내용

| 항목 | 용도 |
|------|------|
| **indirect_feature_points** | 기능명(feature), 타 산업 벤치마킹 필요 사유(reason), 검색 키워드(search_keywords). 최대 3개. 각 항목별로 “이 기능을 잘 구현한 서비스” 탐색의 쿼리·판단 기준 |
| **target_users** | B2B/B2C, 타깃 연령/성별 — 후보 선정 시 적용 가능성 판단에 참고 |
| **features의 상세 설명** | 프로젝트의 확정·추론·업종 표준 기능 등 — 기능 포인트와의 정합성 확인 및 검색 키워드 보강에 활용 |

### 1-3. indirect_feature_points 구조 (참조)

orchestrator는 context-builder가 만든 프로젝트 브리프의 `indirect_feature_points`를 검토·축소한 뒤 전달합니다.

```json
{
  "feature": "기능명",
  "reason": "타 산업 벤치마킹 필요 사유",
  "search_keywords": ["검색 키워드"]
}
```

각 기능 포인트마다 위 구조를 기준으로 **기능 중심 검색 → 레퍼런스 플랫폼 탐색 → 후보 사이트 직접 분석**을 수행합니다.

### 1-4. 수행 절차 (3단계)

각 **기능 포인트별로** 아래 3가지 절차를 실행합니다.

#### 절차 1: 기능 중심 키워드 검색

- **역할:** 산업을 한정하지 않고, 해당 **기능/UX**를 잘 구현한 사이트·사례를 수집.
- **스킬:** `/multi-search` — 한·영 검색 키워드로 병렬 검색 후 결과 통합.
- **쿼리 예:**
  - "[기능명] UX 잘 된 사이트"
  - "best [기능명] UX design"
  - "[기능명] UI best practice"
- **산출:** 후보 리스트에 URL·서비스명 추가.

#### 절차 2: 레퍼런스 플랫폼 탐색

- **역할:** UX/UI 레퍼런스 플랫폼에서 해당 기능의 사례·플로우를 검색해 후보 확보.
- **스킬:** `/multi-search`.
- **쿼리 예:**
  - "site:mobbin.com [기능명]" (화면 단위 검색)
  - "site:pageflows.com [기능명]" (사용자 플로우)
  - "[기능명] UX case study"
- **참고:** `site:` 연산자 포함 쿼리는 한·영 변환 없이 **동일 쿼리**로만 검색합니다.
- **산출:** 레퍼런스에서 발견한 서비스·URL을 후보에 반영.

#### 절차 3: 후보 사이트 직접 분석

- **역할:** 각 후보 URL에 대해 스크래핑으로 해당 기능의 구현 방식을 확인하고, 프로젝트에 적용 가능한지 판단.
- **스킬:** `/site-scrape` — 단일 URL 마크다운 추출 및 사이트 구조 분석.
- **확인 항목:**
  - 해당 기능의 **동선 단계 수**
  - **정보 구조**
  - **마이크로 인터랙션** 유무·특성
  - "이 서비스의 접근 방식이 우리 프로젝트에 적용 가능한가?"에 대한 판단
- **산출:** 선정 근거가 명확한 후보만 유지, 중복·부적합 후보 제거.

### 1-5. 후보 정제

1. **기능 포인트별 선정:** 각 기능 포인트에서 가장 인상적이고 적용 가능성이 높은 서비스를 1~2개씩 선정.
2. **총량 조절:** Indirect 후보 **4~6개** 범위로 압축. 기능 포인트가 3개일 경우 포인트당 1~2개 수준으로 분배.
3. **선정 사유 명시:** `selection_reason`에 **어떤 구체적 기능/UX를 벤치마킹할 것인지**를 반드시 포함하고, `benchmark_feature`, `implementation_detail`을 채워 검증 가능하게 작성.

### 1-6. 출력

- 각 후보를 프로젝트 **공통 출력 포맷**(`output-format` 규칙)에 맞춰 JSON으로 반환.
- **type**은 반드시 **"Indirect"**로 지정.
- **Indirect 유형 필수 추가 필드:**
  - `benchmark_feature`: 벤치마킹 대상 기능명
  - `implementation_detail`: 해당 기능의 구체적 구현 방식(동선, 정보 구조, 인터랙션 등) 설명
- `selection_reason`에는 “어떤 기능을, 어떤 이유로 벤치마킹할지”를 구체적으로 기입.

### 1-7. PHASE 2 내 역할 요약

| 항목 | 내용 |
|------|------|
| **목적** | 타 산업 Indirect Competitor 4~6개 발굴 — 기능/UX 단위 벤치마킹 후보 확보 |
| **소요 시간** | PHASE 2 전체 15~25분 중 일부 (market/design-researcher와 병렬) |
| **성공 조건** | 기능 포인트별 3단계 절차 실행, site-scrape로 구현 방식 검증, 4~6개 Indirect 후보를 공통 포맷·Indirect 전용 필드와 함께 반환 |

---

## 2. PHASE 2에서 사용할 스킬

UX-researcher 에이전트에는 **multi-search**, **site-scrape** 두 스킬이 지정됩니다.  
둘 다 **PHASE 2 수행에 필수**입니다.

### 2-1. 필수 스킬: multi-search

| 항목 | 설명 |
|------|------|
| **스킬 이름** | `multi-search` |
| **사용 시점** | 절차 1(기능 중심 키워드 검색), 절차 2(레퍼런스 플랫폼 탐색) |
| **용도** | 단일 쿼리를 Brave Search 한·영 병렬 실행 후 통합·필터링·재검색. 기능별 “잘 구현된 UX/사이트” 검색, Mobbin/Pageflows 등 site: 쿼리, UX case study 검색에 사용. |
| **필수 여부** | **필수** — 키워드·레퍼런스 검색 없이는 Indirect 후보 수집이 불가능. |

**사용 방법 요약**

- `indirect_feature_points`의 기능명·search_keywords와 절차별 쿼리 템플릿을 조합해 `/multi-search` 호출.
- `site:mobbin.com`, `site:pageflows.com` 등 **site:** 연산자 포함 쿼리는 한·영 변환 없이 **동일 쿼리**로만 검색.
- 스킬 문서: [.cursor/skills/multi-search/SKILL.md](../.cursor/skills/multi-search/SKILL.md).

**공통 스킬 적용**

- multi-search는 context-builder, orchestrator, market-researcher, design-researcher 등에서도 공통 사용됩니다.
- UX-researcher에서는 **기능 단위 UX/레퍼런스 검색**이라는 **Indirect 후보 탐색용** 목적으로 집중 사용합니다.

### 2-2. 필수 스킬: site-scrape

| 항목 | 설명 |
|------|------|
| **스킬 이름** | `site-scrape` |
| **사용 시점** | 절차 3(후보 사이트 직접 분석) — 각 후보 URL에 대해 실행 |
| **용도** | 단일 URL의 콘텐츠를 마크다운으로 추출하고, 사이트 구조(링크, 페이지 수)를 분석해 기능·동선·구현 방식을 판단. 후보의 “해당 기능 구현 방식” 검증 및 적용 가능성 판단. |
| **필수 여부** | **필수** — 스크래핑 없이는 “어떤 기능을 어떻게 구현했는지”에 대한 구체적 근거와 implementation_detail 작성이 어렵고, site-auditor 단계에서 검증 품질이 떨어짐. |

**사용 방법 요약**

- **입력:** 분석할 후보 URL 1개(메인 또는 해당 기능이 드러나는 하위 페이지).
- **실행:** Firecrawl MCP의 `firecrawl_scrape`, `firecrawl_map` 사용 — 메인 스크래핑 후 맵으로 하위 페이지 파악, 핵심 2~3페이지만 추가 스크래핑.
- **출력 활용:** 수집한 마크다운에서 해당 기능의 동선 단계, 정보 구조, 인터랙션을 추출해 `implementation_detail`과 `selection_reason`에 반영.
- 스킬 문서: [.cursor/skills/site-scrape/SKILL.md](../.cursor/skills/site-scrape/SKILL.md).

**공통 스킬 적용**

- site-scrape는 context-builder(기존 사이트 분석), site-auditor(후보 검증·제외 조건 확인)에서도 사용됩니다.
- UX-researcher에서는 **Indirect 후보의 기능/UX 구현 검증**에 사용합니다.

### 2-3. 스킬 요약 표

| 스킬 | PHASE 2 사용 여부 | 용도 |
|------|-------------------|------|
| **multi-search** | ✅ 사용 (절차 1, 2) | 기능 중심 키워드 검색, 레퍼런스 플랫폼(Mobbin, Pageflows 등) 및 UX case study 검색 |
| **site-scrape** | ✅ 사용 (절차 3) | 후보 사이트의 기능·동선·구현 방식 분석, implementation_detail·선정 근거 작성 |

---

## 3. UX-Researcher 에이전트 설정 (참조)

PHASE 2를 수행하는 ux-researcher 서브에이전트는 아래와 같이 스킬·MCP를 갖는 것을 전제로 합니다.  
(실제 에이전트 파일은 [.cursor/agents/ux-researcher.md](../.cursor/agents/ux-researcher.md) 참조.)

| 항목 | 값 |
|------|-----|
| **MCP 서버** | brave-search, firecrawl |
| **스킬** | multi-search, site-scrape |
| **도구** | Read, Write, Bash, Grep, Glob |

- **brave-search:** multi-search의 Brave 검색 호출에 사용.
- **firecrawl:** site-scrape에서 URL 스크래핑·사이트맵 조회에 사용.

---

## 4. 관련 문서

- [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md) — 전체 워크플로우, PHASE 2 병렬 탐색, 서브에이전트·스킬 목록
- [.cursor/agents/ux-researcher.md](../.cursor/agents/ux-researcher.md) — UX-researcher 에이전트 YAML 및 3단계 절차 상세
- [.cursor/skills/multi-search/SKILL.md](../.cursor/skills/multi-search/SKILL.md) — multi-search 스킬 상세
- [.cursor/skills/site-scrape/SKILL.md](../.cursor/skills/site-scrape/SKILL.md) — site-scrape 스킬 상세
- [.cursor/rules/output-format.mdc](../.cursor/rules/output-format.mdc) (또는 워크플로우 가이드 내 output-format 규칙) — 공통 출력 포맷 및 Indirect 유형 필드
