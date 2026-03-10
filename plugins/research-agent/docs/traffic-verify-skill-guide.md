# Traffic-Verify 스킬 가이드

벤치마킹 에이전트 워크플로우에서 **traffic-verify** 스킬의 역할, 사용 방법, 구성 방법을 정리한 문서입니다.  
상위 설계서: [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md), [market-researcher-agent-guide.md](./market-researcher-agent-guide.md)

---

## 1. 역할 (Role)

### 1-1. 목적

**traffic-verify**는 **SimilarWeb 등을 통해 사이트의 월간 트래픽을 검증하는 스킬**입니다.

- **핵심 가치:** 벤치마킹 후보의 **규모 확인**과 **제외 조건 판단**(예: 월간 방문 1,000 미만)에 객관적 근거를 제공합니다.
- **워크플로우 내 위치:** PHASE 2의 **market-researcher**에서 Direct 후보 발굴·정제 시 트래픽 데이터 확보에 사용되고, PHASE 3의 **site-auditor**에서 후보 검증 시 "서비스 규모 미달" 여부를 판단하는 데 사용됩니다.

### 1-2. 담당 기능

| 구분 | 내용 |
|------|------|
| **입력** | 검증할 도메인 (예: `musinsa.com`) — URL이 아닌 도메인명 |
| **실행 방식** | SimilarWeb 직접 크롤링 → SimilarWeb 검색 우회 → 일반 검색 추정 순으로 **우선순위 3단계** 시도 |
| **출력** | `domain`, `monthly_visits`, `trend`, `rank`, `source`, `confidence` 등이 포함된 JSON |
| **판단 기준** | `monthly_visits`가 null이면 confidence: "low", 1,000 미만이면 제외 대상 플래그 추가 |

### 1-3. 제외 조건·보정 규칙과의 관계

`.cursor/rules/exclusion-criteria.mdc`에 정의된 제외 조건·보정 규칙에서 **traffic-verify 결과**가 직접 사용됩니다.

- **제외 조건 1 — 서비스 규모 미달:** SimilarWeb 월간 방문수 **1,000 미만** 또는 **데이터 없음** → FAIL (site-auditor가 traffic-verify 실행 후 판단)
- **보정 규칙 1 — 규모 밸런싱:** traffic-verify로 확보한 `monthly_visits`를 바탕으로 빅테크(월간 1억+) 편중 여부를 확인하고, 혁신적 중소형 서비스 1개 이상 포함 여부를 검증합니다.

---

## 2. 사용 방법 (Usage)

### 2-1. 호출 방식

- **스킬 이름:** `traffic-verify`
- **인자 힌트:** `[도메인명]`
- **사용 예:** `/traffic-verify musinsa.com`, `/traffic-verify oliveyoung.co.kr`

**주의:** URL 전체가 아닌 **도메인만** 넘깁니다. `https://www.musinsa.com/` 대신 `musinsa.com` 형태로 전달합니다.

### 2-2. 서브에이전트별 사용처

#### Market-Researcher (PHASE 2)

| 단계 | 용도 | 설명 |
|------|------|------|
| **경로 3** | SimilarWeb 유사 사이트 탐색 | 경로 1~2에서 트래픽이 높을 것으로 추정되는 **대표 도메인**에 대해 트래픽 검증 후, SimilarWeb 기반 유사 사이트 검색으로 확장 |
| **후보 정제** | 각 후보 규모 검증 | 5가지 경로에서 수집된 **전체 후보**에 대해 도메인별로 `/traffic-verify` 실행 → `monthly_visits`, `confidence` 확보 후 6~8개 선별 근거로 활용 |

- **필수 여부:** **필수.** Direct 후보의 규모 검증 없이 선정하면 site-auditor 단계에서 대량 FAIL이 발생할 수 있습니다.

#### Site-Auditor (PHASE 3)

| 검증 항목 | 용도 | 설명 |
|-----------|------|------|
| **제외 조건 1** | 서비스 규모 미달 | 각 후보 도메인에 대해 `/traffic-verify` 실행 → `monthly_visits`가 **null**이거나 **1,000 미만**이면 즉시 FAIL(Excluded) 처리 |

- **필수 여부:** **필수.** 제외 조건 5가지 중 첫 번째로, 트래픽 데이터 없이는 "규모 미달" 판단이 불가능합니다.

### 2-3. 공통 출력 포맷과의 연동

traffic-verify의 출력은 프로젝트 **공통 출력 포맷**(`output-format.mdc`)의 `traffic` 필드에 매핑됩니다.

- `traffic.monthly_visits`: traffic-verify의 `monthly_visits`
- `traffic.source`: "SimilarWeb" 또는 "검색추정", "와이즈앱" 등 (traffic-verify의 `source`와 대응)
- `traffic.confidence`: traffic-verify의 `confidence` (high | medium | low)

---

## 3. 구성 방법 (Configuration)

### 3-1. 스킬 정의 파일 구조

스킬은 `.cursor/skills/traffic-verify/SKILL.md`에 정의합니다.

```yaml
---
name: traffic-verify
description: >
  SimilarWeb 등을 통해 사이트의 월간 트래픽을 검증하는 스킬.
  벤치마킹 후보의 규모 확인 및 제외 조건 판단 시 사용.
argument-hint: [도메인명]
allowed-tools: Bash, Read, Write
---

# 트래픽 검증

## 입력
$ARGUMENTS = 검증할 도메인 (예: musinsa.com)

## 실행 절차 (우선순위 순서)

### 방법 1: SimilarWeb 직접 크롤링
Firecrawl MCP의 firecrawl_scrape 도구를 사용한다.
- url: https://www.similarweb.com/website/$ARGUMENTS/
- formats: ["markdown"]

결과 마크다운에서 "Total Visits", "Monthly Visits" 등의 수치를 추출한다.

### 방법 2: SimilarWeb 검색 우회 (방법 1 실패 시)
Brave Search MCP의 brave_web_search로 검색한다.
- query: "site:similarweb.com $ARGUMENTS"

결과 스니펫에서 트래픽 수치를 추출한다.

### 방법 3: 일반 검색 추정 (방법 2도 실패 시)
Brave Search MCP의 brave_web_search로 검색한다.
- query: "$ARGUMENTS monthly traffic visitors 2025"

검색 결과에서 트래픽 관련 수치를 추출한다.
이 경우 confidence는 "low"로 설정한다.

## 출력 포맷
{
  "domain": "$ARGUMENTS",
  "monthly_visits": 숫자 또는 null,
  "trend": "증가 | 감소 | 유지 | 불명",
  "rank": { "global": 숫자 또는 null, "country": 숫자 또는 null },
  "source": "similarweb_direct | similarweb_search | general_search",
  "confidence": "high | medium | low"
}

## 판단 기준
- monthly_visits가 null이면 confidence: "low" (데이터 확보 실패)
- monthly_visits < 1,000이면 제외 대상 플래그 추가
- 3가지 방법 모두 실패하면 confidence: "low", monthly_visits: null로 반환
```

### 3-2. MCP 서버 설정

traffic-verify는 **Firecrawl MCP**와 **Brave Search MCP** 두 개를 사용합니다.

| MCP 서버 | 사용 도구 | 용도 |
|----------|-----------|------|
| **firecrawl** | `firecrawl_scrape` | 방법 1: SimilarWeb 페이지를 마크다운으로 스크래핑하여 트래픽 수치 추출 |
| **brave-search** | `brave_web_search` | 방법 2: site:similarweb.com 검색, 방법 3: 일반 트래픽 검색 |

**필요 환경 변수**

- `FIRECRAWL_API_KEY` — Firecrawl API 키 (https://www.firecrawl.dev/signup)
- `BRAVE_API_KEY` — Brave Search API 키 (https://brave.com/search/api/)

`.cursor/mcp.json` 예시 (다른 스킬과 공유):

```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "YOUR_BRAVE_SEARCH_API_KEY"
      }
    },
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "YOUR_FIRECRAWL_API_KEY"
      }
    }
  }
}
```

### 3-3. 서브에이전트에 스킬·MCP 연결

traffic-verify를 사용하는 서브에이전트는 **skills**에 `traffic-verify`를, **mcpServers**에 `firecrawl` 및 `brave-search`(market-researcher만 해당)를 명시해야 합니다.

| Subagent | skills 항목 | mcpServers 항목 |
|----------|-------------|-----------------|
| **market-researcher** | multi-search, **traffic-verify** | brave-search, firecrawl |
| **site-auditor** | site-scrape, **traffic-verify** | firecrawl |

- **site-auditor**는 Brave Search를 사용하지 않으므로 `mcpServers`에 `firecrawl`만 있으면 됩니다. (방법 2·3이 필요할 경우 프로젝트에 따라 brave-search 추가 가능)
- **context-builder**, **orchestrator**, **ux-researcher**, **design-researcher**는 traffic-verify를 사용하지 않습니다.

### 3-4. Skill — MCP 매핑 요약

| Skill | 사용 MCP 도구 | 호출 주체 (Subagent) |
|-------|----------------|------------------------|
| traffic-verify | firecrawl: `firecrawl_scrape`, brave-search: `brave_web_search` | market-researcher, site-auditor |

### 3-5. 출력 포맷 상세

| 필드 | 타입 | 설명 |
|------|------|------|
| `domain` | string | 검증한 도메인 (입력값과 동일) |
| `monthly_visits` | number \| null | 월간 방문 수. 데이터 없으면 null |
| `trend` | string | "증가" \| "감소" \| "유지" \| "불명" |
| `rank` | object | `global`, `country` — 각각 숫자 또는 null |
| `source` | string | "similarweb_direct" \| "similarweb_search" \| "general_search" — 데이터 출처 |
| `confidence` | string | "high" \| "medium" \| "low" — 수치 신뢰도 |

**판단 기준 요약**

- `monthly_visits === null` → confidence는 "low", 제외 조건 검증 시 규모 미달로 FAIL 가능성 높음
- `monthly_visits < 1,000` → 제외 대상(Excluded) 플래그
- 방법 1 성공 → source: "similarweb_direct", confidence: "high" 권장
- 방법 3만 성공 → confidence: "low" 필수

---

## 4. 요약

- **역할:** SimilarWeb·검색을 통해 사이트의 월간 트래픽을 검증하는 스킬. 벤치마킹 후보의 규모 확인과 제외 조건(서비스 규모 미달), 보정 규칙(규모 밸런싱) 판단의 근거로 사용됩니다.
- **사용:** **market-researcher**(경로 3 + 후보 정제 시 각 도메인 검증), **site-auditor**(제외 조건 1: 서비스 규모 미달 검증)에서 호출. 도메인명만 넘기면 됩니다.
- **구성:** `.cursor/skills/traffic-verify/SKILL.md`에 YAML 프론트매터와 실행 절차(3단계)·출력 포맷·판단 기준을 두고, 사용하는 서브에이전트의 `skills`에 `traffic-verify`, `mcpServers`에 `firecrawl`(및 market-researcher는 `brave-search`)를 넣고, 해당 MCP의 API 키를 설정하면 됩니다.

상세 워크플로우·제외 조건·다른 스킬 정의는 [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md)를, market-researcher의 5가지 경로와 traffic-verify 사용 시점은 [market-researcher-agent-guide.md](./market-researcher-agent-guide.md)를 참조하면 됩니다.
