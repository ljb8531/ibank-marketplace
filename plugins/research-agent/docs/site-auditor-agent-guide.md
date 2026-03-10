# Site-Auditor 서브에이전트 가이드

벤치마킹 에이전트 워크플로우에서 **PHASE 3: 검증**을 담당하는 **site-auditor** 서브에이전트의 역할과 사용 스킬을 정의한 문서입니다.  
본 문서는 [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md)의 PHASE 3 및 site-auditor 설계를 기준으로 합니다.

---

## 1. PHASE 3: 검증 — Site-Auditor의 역할

### 1-1. 위치와 책임

Site-auditor는 PHASE 3에서 **orchestrator**가 통합한 **전체 후보 리스트(12~15개)**를 받아, 각 사이트를 **제외 조건**과 **보정 규칙**에 따라 검증합니다.  
제외 조건 5가지 중 하나라도 해당되면 해당 후보는 **FAIL(Excluded)** 처리하고, 보정 규칙 3가지는 전체 리스트 차원에서 플래그를 부여합니다.  
검증 결과는 orchestrator가 PHASE 4 최종 7~10개 선정 시 사용합니다.

| 구분 | 설명 |
|------|------|
| **입력** | orchestrator가 전달한 **통합 후보 리스트** (output/data/candidates.json — Direct·Indirect·Inspire 통합, 12~15개) |
| **PHASE 3 산출** | 각 후보별 **PASS/FAIL** + 검증 항목별 결과(checks), 플래그(flags), fail_reason |
| **실행 시점** | PHASE 3 — PHASE 2 병렬 탐색 완료 후 **순차** 실행 (약 5~10분) |

### 1-2. Orchestrator로부터 받는 전달 내용

| 항목 | 용도 |
|------|------|
| **통합 후보 리스트** | Direct·Indirect·Inspire 유형이 합쳐진 후보 배열. 각 항목은 공통 출력 포맷(type, name, url, status, selection_reason, traffic 등)을 따름. |
| **제외·보정 규칙** | `.cursor/rules/exclusion-criteria.mdc`에 정의된 제외 조건 5가지, 보정 규칙 3가지에 따라 검증 수행. |

### 1-3. 검증 절차

각 후보 사이트에 대해 **제외 조건**을 먼저 순차 검증하고, **보정 규칙**은 PASS된 전체 리스트 대상으로 적용합니다.

#### 제외 조건 검증 (5가지 — 하나라도 FAIL이면 즉시 Excluded)

| 번호 | 조건 | 검증 방법 | FAIL 기준 |
|------|------|-----------|-----------|
| 1 | **서비스 규모 미달** | `/traffic-verify` 스킬로 도메인 트래픽 확인 | `monthly_visits`가 null이거나 1,000 미만 |
| 2 | **기능 미작동** | `/site-scrape`로 메인 페이지 스크래핑 | 마크다운 500자 미만, 또는 "Coming Soon", "Under Construction", "준비 중" 등 포함 |
| 3 | **분석 불가** | `/site-scrape`로 사이트 구조(하위 페이지·기능) 확인 | 하위 페이지 3개 미만, 동적 기능(검색·필터·폼 등) 전무 |
| 4 | **App-only** | `/site-scrape` 결과 분석 | "앱 다운로드", "App Store", "Google Play" 안내만 있고 실질 웹 콘텐츠 없음 |
| 5 | **폐쇄형 서비스** | `/site-scrape` 결과 분석 | 로그인/회원가입 없이 접근 가능한 콘텐츠가 메인 페이지 외 없음 |

#### 보정 규칙 검증 (3가지 — 전체 리스트 대상)

| 번호 | 규칙 | 검증 방법 | 결과 처리 |
|------|------|-----------|-----------|
| 1 | **규모 밸런싱** | PASS 후보 중 빅테크(월간 1억+) 비율 확인 | 혁신적 중소형 서비스 1개 미만이면 `flag: needs_small_competitor` 추가 |
| 2 | **접근성 확인** | 해외 사이트에 `/site-scrape`로 실제 접속 시도 | 지역 제한(Geoblocking)·언어 장벽으로 접근 불가면 → FAIL |
| 3 | **최신성 검증** | `/site-scrape` 결과에서 Copyright 연도·최신 게시글 날짜 확인 | 최근 1년 내 업데이트 없으면 `flag: stale` 추가 |

### 1-4. 출력

각 후보별로 다음 형식으로 반환합니다.

```json
{
  "url": "https://...",
  "checks": [
    { "rule": "규모미달", "result": "PASS", "evidence": "월간 52만" },
    { "rule": "기능미작동", "result": "PASS", "evidence": "마크다운 3200자, 실서비스 확인" },
    ...
  ],
  "flags": ["needs_small_competitor", "stale"],
  "final_status": "PASS",
  "fail_reason": null
}
```

- **final_status**: `"PASS"` 또는 `"FAIL"`.
- **fail_reason**: FAIL인 경우 해당 사유(제외 조건 번호·요약).
- **flags**: 보정 규칙에서 부여한 플래그. orchestrator는 PHASE 4에서 `stale` 사이트는 대체 가능하면 교체, `needs_small_competitor`면 중소형 후보 비율을 고려합니다.

### 1-5. PHASE 3 내 역할 요약

| 항목 | 내용 |
|------|------|
| **목적** | 통합 후보 리스트의 각 사이트를 제외 조건·보정 규칙으로 검증하여 PASS/FAIL 및 플래그 산출 |
| **소요 시간** | PHASE 3 전체 약 5~10분 (후보 12~15개 순차 검증) |
| **성공 조건** | 모든 후보에 대해 5가지 제외 조건 검증 완료, 3가지 보정 규칙 적용, 각 후보별 final_status·checks·flags 반환 |

---

## 2. PHASE 3에서 사용할 스킬

Site-auditor 에이전트에는 **site-scrape**, **traffic-verify** 두 스킬이 지정됩니다.  
둘 다 PHASE 3 검증에 **필수**이며, 제외 조건 판단의 근거를 수집하는 데 사용됩니다.  
(공통 스킬인 multi-search는 site-auditor에는 지정되지 않으며, 검증 업무는 URL/도메인 단위 스크래핑·트래픽 확인에 집중합니다.)

### 2-1. 필수 스킬: site-scrape

| 항목 | 설명 |
|------|------|
| **스킬 이름** | `site-scrape` |
| **사용 시점** | 제외 조건 2·3·4·5, 보정 규칙 2·3 — 메인 페이지·사이트 구조·접근성·최신성 확인 시 |
| **용도** | 단일 URL의 콘텐츠를 마크다운으로 추출하고, 사이트 구조(링크·페이지 수)를 분석해 기능 존재 여부·콘텐츠 충분성·App-only·폐쇄형·최신성을 판단. |
| **필수 여부** | **필수** — 기능 미작동·분석 불가·App-only·폐쇄형·접근성·최신성 검증이 모두 site-scrape 결과에 의존함. |

**사용 방법 요약**

- **입력:** 검증 대상 후보의 URL (메인 페이지 및 필요 시 map으로 얻은 하위 URL).
- **실행:** Firecrawl MCP의 `firecrawl_scrape`(formats: `["markdown", "links"]`), `firecrawl_map`(사이트 구조·하위 페이지 수). 메인 1회 + map 후 핵심 하위 2~3개 스크래핑.
- **판단:** 마크다운 글자 수, "Coming Soon" 등 문구, 하위 페이지 수, 동적 기능 유무, 앱 다운로드 안내 비중, 로그인 없이 접근 가능한 콘텐츠 범위, Copyright·최신 게시일 추출.
- **참고:** [.cursor/skills/site-scrape/SKILL.md](../.cursor/skills/site-scrape/SKILL.md), [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md) 내 exclusion-criteria 규칙.

**공통 스킬 적용**

- site-scrape는 context-builder, ux-researcher에서도 사용됩니다. Site-auditor에서는 **제외 조건·보정 규칙 검증**이라는 목적으로 집중 사용합니다.

### 2-2. 필수 스킬: traffic-verify

| 항목 | 설명 |
|------|------|
| **스킬 이름** | `traffic-verify` |
| **사용 시점** | 제외 조건 1 — 서비스 규모 미달 여부 확인 시 |
| **용도** | 도메인 단위로 SimilarWeb(직접 스크래핑 또는 검색)을 통해 월간 트래픽을 검증하여 `monthly_visits`, `source`, `confidence` 반환. 1,000 미만 또는 null이면 제외 대상. |
| **필수 여부** | **필수** — 제외 조건 1(서비스 규모 미달) 판단에 사용되지 않으면 규모 기준 검증이 불가능함. |

**사용 방법 요약**

- **입력:** 검증 대상 후보의 **도메인**(URL 아님). 예: `musinsa.com`, `oliveyoung.co.kr`.
- **실행:** 1) Firecrawl로 SimilarWeb 페이지 스크래핑 → 마크다운에서 수치 추출. 2) 실패 시 Brave Search로 `site:similarweb.com {도메인}` 검색. 3) 그래도 실패 시 일반 검색으로 추정 → 이때 `confidence: "low"`.
- **판단:** `monthly_visits === null` 또는 `monthly_visits < 1,000` → FAIL(규모 미달).
- **참고:** [.cursor/skills/traffic-verify/SKILL.md](../.cursor/skills/traffic-verify/SKILL.md).

**공통 스킬 적용**

- traffic-verify는 market-researcher에서도 Direct 후보 발굴·정제 시 사용됩니다. Site-auditor에서는 **제외 조건 1(규모 미달)** 검증용으로만 사용합니다.

### 2-3. 스킬 요약 표

| 스킬 | PHASE 3 사용 여부 | 용도 |
|------|-------------------|------|
| **site-scrape** | ✅ 사용 (제외 2·3·4·5, 보정 2·3) | 메인·하위 페이지 스크래핑으로 기능 미작동·분석 불가·App-only·폐쇄형·접근성·최신성 검증 |
| **traffic-verify** | ✅ 사용 (제외 1) | 도메인 월간 트래픽 확인으로 서비스 규모 미달 검증 |

---

## 3. Site-Auditor 에이전트 설정 (참조)

PHASE 3을 수행하는 site-auditor 서브에이전트는 아래와 같이 스킬·MCP를 갖는 것을 전제로 합니다.  
(실제 에이전트 파일은 [.cursor/agents/site-auditor.md](../.cursor/agents/site-auditor.md) 참조. 해당 파일이 없으면 Agentic-Workflow-Guide.md 내 site-auditor YAML 정의를 기준으로 합니다.)

| 항목 | 값 |
|------|-----|
| **MCP 서버** | firecrawl |
| **스킬** | site-scrape, traffic-verify |
| **도구** | Read, Write, Bash, Grep, Glob |

- **firecrawl:** site-scrape의 `firecrawl_scrape`, `firecrawl_map` 호출 및 traffic-verify의 SimilarWeb 스크래핑에 사용.  
- **brave-search:** site-auditor에는 지정되지 않음. traffic-verify 스킬 내부에서 SimilarWeb 우회 검색 시 Brave Search MCP를 사용할 수 있으나, 에이전트 수준에서는 firecrawl만 명시해 두고, traffic-verify 실행 시 필요한 경우 orchestrator·호스트 환경에서 brave-search를 사용하도록 구성할 수 있음. (현재 Agentic-Workflow-Guide.md 표에는 site-auditor MCP가 firecrawl만 기재됨.)

---

## 4. 관련 문서

- [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md) — 전체 워크플로우, PHASE 3 검증, site-auditor YAML, 제외·보정 규칙, 스킬 목록
- [.cursor/agents/site-auditor.md](../.cursor/agents/site-auditor.md) — Site-auditor 에이전트 정의 (있는 경우)
- [.cursor/skills/site-scrape/SKILL.md](../.cursor/skills/site-scrape/SKILL.md) — site-scrape 스킬 상세
- [.cursor/skills/traffic-verify/SKILL.md](../.cursor/skills/traffic-verify/SKILL.md) — traffic-verify 스킬 상세
- [.cursor/rules/exclusion-criteria.mdc](../.cursor/rules/exclusion-criteria.mdc) (또는 워크플로우 가이드 내 해당 규칙) — 제외 조건 5가지, 보정 규칙 3가지
- [.cursor/rules/output-format.mdc](../.cursor/rules/output-format.mdc) — 후보 공통 포맷 (site-auditor는 검증 결과를 이 포맷의 status·플래그와 연계해 반환)
