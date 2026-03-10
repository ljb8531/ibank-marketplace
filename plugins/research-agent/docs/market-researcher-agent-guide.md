# Market-Researcher 서브에이전트 가이드

벤치마킹 에이전트 워크플로우에서 **PHASE 2: 병렬 탐색**의 한 축을 담당하는 **market-researcher** 서브에이전트의 역할과 사용 스킬을 정의한 문서입니다.  
본 문서는 [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md)의 PHASE 2 및 market-researcher 설계를 기준으로 합니다.

---

## 1. PHASE 2: 병렬 탐색 — Market-Researcher의 역할

### 1-1. 위치와 책임

Market-researcher는 PHASE 2에서 **orchestrator**가 병렬로 기동하는 **3개 탐색 에이전트 중 하나**입니다.  
동종업계 **Direct Competitor**를 발굴하는 데 전담하며, 5가지 탐색 경로를 순서대로 실행한 뒤 트래픽 데이터로 검증·정제하여 **Direct 후보 6~8개**를 산출합니다.

| 구분 | 설명 |
|------|------|
| **입력** | orchestrator가 전달한 작업 지시서: categories(카테고리명 + 검색 키워드), target_users, service_model, domestic_project 여부, **competitive_hints**(context-builder가 검색 중 발견한 경쟁사 힌트) |
| **PHASE 2 산출** | **Direct** 유형 후보 6~8개 (공통 출력 포맷 JSON) |
| **실행 시점** | PHASE 2 — ux-researcher, design-researcher와 **동시에** 실행 |

### 1-2. Orchestrator로부터 받는 전달 내용

| 항목 | 용도 |
|------|------|
| **categories** | 카테고리명 + search_keywords_ko / search_keywords_en — 키워드·뉴스·유사 사이트 검색의 쿼리 베이스 |
| **target_users** | B2B/B2C 등 세그먼트, 타깃 연령/성별 — 후보 선정 시 규모·성격 판단에 참고 |
| **service_model** | 구독/광고/중개/직접판매 등 — 동종 비즈니스 모델 서비스 우선 발굴 |
| **domestic_project** | 국내 프로젝트 여부 — true이면 국내 2~3개 + 해외 1개 비율로 후보 구성 |
| **competitive_hints** | context-builder가 Step 2-2에서 발견한 경쟁사 이름/URL — 탐색 시 반드시 후보 풀에 포함·검증 |

### 1-3. 수행 절차 (5가지 탐색 경로)

반드시 **5가지 탐색 경로를 순서대로** 실행합니다.

#### 경로 1: 키워드 검색

- **역할:** 블로그·미디어 기사에서 “[카테고리] 순위/비교”, “[category] top websites” 등으로 언급되는 서비스를 수집.
- **스킬:** `/multi-search` — 한·영 검색 키워드로 병렬 검색 후 결과 통합.
- **산출:** 후보 리스트에 URL·서비스명 추가.

#### 경로 2: 뉴스 검색

- **역할:** “[카테고리] 투자유치”, “[카테고리] 리뉴얼 런칭”, “[category] funding” 등으로 최근 뉴스에서 1위 경쟁사·신규 진입자 수집.
- **스킬:** `/multi-search`.
- **산출:** 후보 리스트에 추가.

#### 경로 3: SimilarWeb 유사 사이트

- **역할:** 경로 1~2에서 트래픽이 높을 것으로 추정되는 사이트의 도메인으로 트래픽 검증 후, SimilarWeb 기반 유사 사이트 확보.
- **스킬:** `/traffic-verify`(해당 도메인) + `/multi-search`로 `"site:similarweb.com [해당 도메인] competitors"` 검색.
- **산출:** 유사 사이트 목록을 후보에 반영.

#### 경로 4: 앱스토어 검색

- **역할:** “[카테고리] app 순위”, “[카테고리] 앱 추천” 검색 후, **웹사이트도 함께 운영하는** 서비스를 선별.
- **스킬:** `/multi-search`.
- **산출:** 웹+앱 동시 운영 서비스만 후보에 추가.

#### 경로 5: 분석 서비스 검색

- **역할:** “와이즈앱 [카테고리] 순위”, “[카테고리] 사용자 규모” 등으로 사용자 규모에 대한 객관적 근거 확보.
- **스킬:** `/multi-search`.
- **산출:** 규모·순위 근거와 함께 후보 정보 보강.

### 1-4. 후보 정제

1. **통합:** 5가지 경로 + **competitive_hints**에서 나온 전체 후보를 합산.
2. **트래픽 검증:** 각 후보 도메인에 대해 `/traffic-verify` 실행 → monthly_visits, confidence 등 확보.
3. **선별 기준으로 6~8개로 압축:**
   - 업계 1~2위는 **무조건 포함**.
   - RFP의 기능/규모와 유사한 **중소형 혁신 서비스 1개 이상** 포함.
   - **domestic_project === true**이면 국내 2~3개 + 해외 1개 비율.

### 1-5. 출력

- 각 후보를 프로젝트 **공통 출력 포맷**(`output-format` 규칙)에 맞춰 JSON으로 반환.
- **type**은 반드시 **"Direct"**로 지정.
- `selection_reason`에는 트래픽 수치, 순위, 뉴스/분석 출처 등 **검증 가능한 구체적 근거**를 포함.

### 1-6. PHASE 2 내 역할 요약

| 항목 | 내용 |
|------|------|
| **목적** | 동종업계 Direct Competitor 6~8개 발굴 및 트래픽 검증 |
| **소요 시간** | PHASE 2 전체 15~25분 중 일부 (ux/design-researcher와 병렬) |
| **성공 조건** | 5가지 경로 실행 완료, traffic-verify로 규모 검증, 6~8개 Direct 후보를 공통 포맷으로 반환 |

---

## 2. PHASE 2에서 사용할 스킬

Market-researcher 에이전트에는 **multi-search**, **traffic-verify** 두 스킬이 지정됩니다.  
둘 다 **PHASE 2 수행에 필수**입니다.

### 2-1. 필수 스킬: multi-search

| 항목 | 설명 |
|------|------|
| **스킬 이름** | `multi-search` |
| **사용 시점** | 경로 1, 2, 3(유사 사이트 쿼리), 4, 5 — 모든 키워드·뉴스·사이트 검색 |
| **용도** | 단일 쿼리를 Brave Search 한·영 병렬 실행 후 통합·필터링·재검색. 시장 조사·후보 탐색·카테고리별 순위/비교/뉴스/앱/분석 서비스 검색에 사용. |
| **필수 여부** | **필수** — 5가지 경로 대부분이 검색 기반이므로 미사용 시 후보 수집이 불가능. |

**사용 방법 요약**

- 브리프의 `categories`(한·영 검색 키워드)와 각 경로별 쿼리 템플릿을 조합해 `/multi-search` 호출.
- 스킬 문서: [.cursor/skills/multi-search/SKILL.md](../.cursor/skills/multi-search/SKILL.md).
- `site:similarweb.com` 등 **site:** 연산자 포함 쿼리는 한·영 변환 없이 동일 쿼리로만 검색.

**공통 스킬 적용**

- multi-search는 context-builder, orchestrator, ux-researcher, design-researcher 등에서도 공통 사용됩니다.
- Market-researcher에서는 **시장·경쟁사·순위·뉴스·앱·분석 서비스** 검색이라는 **탐색용** 목적으로 집중 사용합니다.

### 2-2. 필수 스킬: traffic-verify

| 항목 | 설명 |
|------|------|
| **스킬 이름** | `traffic-verify` |
| **사용 시점** | 경로 3(대표 도메인 트래픽 확인), 후보 정제 단계(각 후보 도메인 검증) |
| **용도** | SimilarWeb 등으로 사이트의 월간 트래픽을 검증. 후보 규모 확인 및 제외 조건(예: 1,000 미만) 판단. |
| **필수 여부** | **필수** — Direct 후보의 규모 검증 없이 선정하면 site-auditor 단계에서 대량 FAIL 가능. |

**사용 방법 요약**

- **입력:** 검증할 도메인(예: `musinsa.com`).
- **실행:** 워크플로우 가이드에 정의된 traffic-verify 절차에 따라, SimilarWeb 직접 크롤링 → 검색 우회 → 일반 검색 추정 순으로 시도.
- **출력:** `domain`, `monthly_visits`, `trend`, `rank`, `source`, `confidence` 등.  
- **참고:** traffic-verify 스킬은 [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md) 내 “Skill ④: traffic-verify” 절에 상세 정의되어 있습니다.  
  (프로젝트에 `.cursor/skills/traffic-verify/SKILL.md`가 있으면 해당 문서를 우선 참조.)

**공통 스킬 적용**

- traffic-verify는 **site-auditor**에서도 후보 검증 시 사용됩니다.
- Market-researcher에서는 **경로 3**과 **후보 정제 시 각 후보 규모 확인**에 사용합니다.

### 2-3. 스킬 요약 표

| 스킬 | PHASE 2 사용 여부 | 용도 |
|------|-------------------|------|
| **multi-search** | ✅ 사용 (경로 1, 2, 3, 4, 5) | 키워드·뉴스·SimilarWeb·앱·분석 서비스 검색 |
| **traffic-verify** | ✅ 사용 (경로 3 + 후보 정제) | 도메인별 월간 트래픽 검증, 6~8개 선별 근거 |

---

## 3. Market-Researcher 에이전트 설정 (참조)

PHASE 2를 수행하는 market-researcher 서브에이전트는 아래와 같이 스킬·MCP를 갖는 것을 전제로 합니다.  
(실제 에이전트 파일은 [.cursor/agents/market-researcher.md](../.cursor/agents/market-researcher.md) 참조.)

| 항목 | 값 |
|------|-----|
| **MCP 서버** | brave-search, firecrawl |
| **스킬** | multi-search, traffic-verify |
| **도구** | Read, Write, Bash, Grep, Glob |

- **brave-search:** multi-search의 Brave 검색 및 traffic-verify의 SimilarWeb 검색 우회/일반 검색에 사용.
- **firecrawl:** traffic-verify에서 SimilarWeb 페이지 스크래핑 시 사용(워크플로우 가이드 정의 기준).

---

## 4. 관련 문서

- [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md) — 전체 워크플로우, PHASE 2 병렬 탐색, 서브에이전트·스킬 목록
- [.cursor/agents/market-researcher.md](../.cursor/agents/market-researcher.md) — Market-researcher 에이전트 YAML 및 5가지 경로 상세
- [.cursor/skills/multi-search/SKILL.md](../.cursor/skills/multi-search/SKILL.md) — multi-search 스킬 상세
- [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md) 내 “Skill ④: traffic-verify” — traffic-verify 실행 절차 및 출력 포맷
