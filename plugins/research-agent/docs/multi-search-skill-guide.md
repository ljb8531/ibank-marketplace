# Multi-Search 스킬 가이드

벤치마킹 에이전트 워크플로우에서 **multi-search** 스킬의 역할, 사용 방법, 구성 방법을 정리한 문서입니다.  
상위 설계서: [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md), [context-builder-agent-guide.md](./context-builder-agent-guide.md)

---

## 1. 역할 (Role)

### 1-1. 목적

**multi-search**는 **단일 쿼리를 Brave Search에서 한국어/영문으로 병렬 실행하고, 결과를 통합·정제하여 반환하는 검색 스킬**입니다.

- **핵심 가치:** 한·영 양쪽 검색을 병행해 언어별 편향을 줄이고, 중복·품질 필터링으로 신뢰도(confidence)를 부여합니다.
- **워크플로우 내 위치:** 검색이 필요한 모든 PHASE에서 공통으로 사용되는 **기반 검색 스킬**입니다. 후보 탐색, 시장 조사, 디자인 레퍼런스 검색, 카테고리 검증 등에 활용됩니다.

### 1-2. 담당 기능

| 구분 | 내용 |
|------|------|
| **입력** | 검색할 키워드 또는 쿼리 (한국어/영어/혼합, `site:` 연산자 지원) |
| **실행 방식** | Brave Search MCP `brave_web_search`로 한국어·영문 각 10건 검색 후 통합 |
| **출력** | URL, 제목, 스니펫, 소스(한/영), confidence(high/medium), 순위가 포함된 JSON 배열 |
| **품질 보장** | 중복 URL 제거, 광고·스팸 필터링, 결과 5개 미만 시 키워드 변형 후 최대 3회 재검색 |

### 1-3. 검색 원칙과의 관계

`.cursor/rules/search-principles.mdc`에 정의된 검색 원칙과 정합됩니다.

- **복수 경로 교차 탐색:** 한·영 2소스 병렬 검색으로 편향 완화
- **결과 부족 시 키워드 재조정:** 5개 미만이면 동의어·영한 전환·구체화/일반화 후 재검색 (최대 3회)
- **결과 교차 검증:** 두 검색 모두에서 등장한 결과에 `confidence: "high"` 부여
- **선정 사유 명문화:** 반환된 결과를 활용할 때 검증 가능한 근거로 사용

---

## 2. 사용 방법 (Usage)

### 2-1. 호출 방식

- **스킬 이름:** `multi-search`
- **인자 힌트:** `[검색 키워드]`
- **사용 예:** `/multi-search [회사명] 회사 소개`, `/multi-search site:awwwards.com [카테고리]`

`site:` 연산자가 포함된 쿼리는 **그대로** 사용하며, 한국어/영문 변환 없이 동일 쿼리로 검색합니다.

### 2-2. 서브에이전트별 사용처

#### Context-Builder (PHASE 0)

| 단계 | 용도 | 예시 쿼리 |
|------|------|------------|
| Step 2-2 | 회사/서비스 정보 수집 | `"[회사명] 회사 소개"`, `"[서비스명] 뉴스"`, `"[서비스명] 리뷰"` |
| Step 2-3 | 산업/시장 구조 파악 | `"[업종] 시장 규모"`, `"[업종] 주요 플레이어"`, `"[업종] 트렌드 2025"` |
| Step 2-4 (리뉴얼) | 사용자 불만·개선 포인트 | `"[서비스명] 불편"`, `"[서비스명] 리뷰 단점"` |
| Step 2-5 (신규 구축) | 업종 표준 기능 | `"[업종] 필수 기능"`, `"[업종] 웹사이트 기능 체크리스트"` |
| Step 4 (자가 검증) | confidence 낮은 항목 보강 | 부족한 필드에 대한 추가 검색 1회 |

- **필수 여부:** **필수.** RFP가 없어도 회사명·URL·한 줄 설명만으로 쿼리를 만들어 정보를 보강해야 하므로 반드시 사용합니다.

#### Orchestrator (PHASE 1)

| 단계 | 용도 | 예시 쿼리 |
|------|------|------------|
| Step 1-2 | 카테고리 검증 | 각 카테고리의 `search_keywords_en`으로 검색 → 결과가 예상 산업과 일치하는지 검증 |

- **필수 여부:** 카테고리 검증 시 사용. 불일치 시 키워드 조정 후 브리프 업데이트.

#### Market-Researcher (PHASE 2)

| 경로 | 용도 | 예시 쿼리 |
|------|------|------------|
| 경로 1 | 키워드 검색 | `"[카테고리] 순위"`, `"[카테고리] 비교"`, `"[category] top websites"` |
| 경로 2 | 뉴스 검색 | `"[카테고리] 투자유치"`, `"[카테고리] 리뉴얼 런칭"`, `"[category] funding"` |
| 경로 3 | SimilarWeb 유사 사이트 | `"site:similarweb.com [도메인] competitors"` |
| 경로 4 | 앱스토어 검색 | `"[카테고리] app 순위"`, `"[카테고리] 앱 추천"` |
| 경로 5 | 분석 서비스 검색 | `"와이즈앱 [카테고리] 순위"`, `"[카테고리] 사용자 규모"` |

#### UX-Researcher (PHASE 2)

| 절차 | 용도 | 예시 쿼리 |
|------|------|------------|
| 절차 1 | 기능 중심 키워드 검색 | `"[기능명] UX 잘 된 사이트"`, `"best [기능명] UX design"`, `"[기능명] UI best practice"` |
| 절차 2 | 레퍼런스 플랫폼 탐색 | `"site:mobbin.com [기능명]"`, `"site:pageflows.com [기능명]"`, `"[기능명] UX case study"` |

#### Design-Researcher (PHASE 2)

| 소스 | 용도 | 예시 쿼리 |
|------|------|------------|
| 소스 1 | Awwwards | `"site:awwwards.com [카테고리]"` |
| 소스 2 | GDWEB / 디비컷 | `"site:gdweb.co.kr [카테고리]"`, `"site:dbcut.com [카테고리] 웹사이트"` |
| 소스 3 | Behance / Dribbble | `"site:behance.net [카테고리] website redesign live"` |
| 소스 4 | CSS Design Awards | `"site:cssdesignawards.com [카테고리]"` (FWA 필요 시 추가) |

### 2-3. 인풋 레벨별 사용 강도 (Context-Builder 기준)

| 인풋 레벨 | multi-search 사용 강도 |
|-----------|------------------------|
| **Level 1** (URL만) | 회사/시장/리뉴얼 또는 신규 보강용으로 다수 호출 |
| **Level 2** (단편 정보) | 업종·기능·트렌드 보강용 호출 |
| **Level 3** (요약 브리프) | 카테고리·시장 검증 수준으로 최소 사용 |
| **Level 4** (완전 RFP) | 카테고리·시장 검증만 최소 사용 |

---

## 3. 구성 방법 (Configuration)

### 3-1. 스킬 정의 파일 구조

스킬은 `.cursor/skills/multi-search/SKILL.md`에 정의합니다.

```yaml
---
name: multi-search
description: >
  단일 쿼리를 Brave Search에서 한국어/영문 병렬 실행하고 결과를 통합하는 검색 스킬.
  벤치마킹 후보 탐색, 시장 조사, 디자인 레퍼런스 검색 시 사용.
argument-hint: [검색 키워드]
allowed-tools: Bash, Read, Write
---

# 다중 소스 검색

## 입력
$ARGUMENTS = 검색할 키워드 또는 쿼리

## 실행 절차

### Step 1: 검색 실행
Brave Search MCP의 brave_web_search 도구를 사용하여 다음 2가지 검색을 실행한다:

1. 한국어 검색: $ARGUMENTS를 한국어로 변환하여 검색 (count: 10)
2. 영문 검색: $ARGUMENTS를 영문으로 변환하여 검색 (count: 10)

site: 연산자가 포함된 쿼리는 해당 쿼리를 그대로 사용한다.

### Step 2: 결과 통합
두 검색 결과를 합산하고:
- 중복 URL을 제거한다
- 2개 검색 모두에서 등장한 결과에 confidence: "high"를 태깅한다
- 1개 검색에서만 등장한 결과에 confidence: "medium"을 태깅한다

### Step 3: 품질 필터링
- 광고성 콘텐츠 (sponsored, ad 표시)는 제거한다
- 도메인이 명백한 스팸 사이트인 경우 제거한다

### Step 4: 결과 부족 시 재검색
통합 결과가 5개 미만이면:
- 키워드에 동의어를 추가하거나 구체화/일반화하여 변형한다
- 변형된 키워드로 Step 1~3을 재실행한다
- 최대 3회까지 반복한다

## 출력 포맷
다음 JSON 배열을 반환한다:
[
  {
    "url": "https://...",
    "title": "검색 결과 제목",
    "snippet": "검색 결과 요약",
    "source": "brave_ko | brave_en",
    "confidence": "high | medium",
    "rank": 순위 번호
  }
]
```

### 3-2. MCP 서버 설정

multi-search는 **Brave Search MCP**만 사용합니다.

- **MCP 서버명:** `brave-search`
- **사용 도구:** `brave_web_search`
- **필요 환경 변수:** `BRAVE_API_KEY` (Brave Search API 키)

`.cursor/mcp.json` 예시:

```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "YOUR_BRAVE_SEARCH_API_KEY"
      }
    }
  }
}
```

- **API 키 발급:** https://brave.com/search/api/
- **용량:** 무료 2,000쿼리/월, 이후 유료 구간 존재

### 3-3. 서브에이전트에 스킬·MCP 연결

multi-search를 사용하는 서브에이전트는 **skills**에 `multi-search`를, **mcpServers**에 `brave-search`를 명시해야 합니다.

| Subagent | skills 항목 | mcpServers 항목 |
|----------|-------------|-----------------|
| **context-builder** | multi-search, site-scrape | brave-search, firecrawl |
| **orchestrator** | multi-search, benchmark-report | brave-search |
| **market-researcher** | multi-search, traffic-verify | brave-search, firecrawl |
| **ux-researcher** | multi-search, site-scrape | brave-search, firecrawl |
| **design-researcher** | multi-search, screenshot-capture, branding-extract | brave-search, firecrawl |

- **site-auditor**는 multi-search를 사용하지 않습니다 (site-scrape, traffic-verify만 사용).

### 3-4. Skill — MCP 매핑 요약

| Skill | 사용 MCP 도구 | 호출 주체 (Subagent) |
|-------|----------------|------------------------|
| multi-search | brave-search: `brave_web_search` | context-builder, orchestrator, market-researcher, ux-researcher, design-researcher |

### 3-5. 출력 포맷 상세

| 필드 | 타입 | 설명 |
|------|------|------|
| `url` | string | 검색 결과 URL |
| `title` | string | 검색 결과 제목 |
| `snippet` | string | 검색 결과 요약 텍스트 |
| `source` | `"brave_ko"` \| `"brave_en"` | 한국어 검색 결과인지 영문 검색 결과인지 |
| `confidence` | `"high"` \| `"medium"` | high: 한·영 양쪽에서 등장, medium: 한쪽에서만 등장 |
| `rank` | number | 통합 결과 내 순위 번호 |

---

## 4. 요약

- **역할:** 단일 쿼리에 대해 Brave Search 한·영 병렬 검색 후 통합·품질 필터링·재검색을 수행하는 공통 검색 스킬.
- **사용:** context-builder(필수), orchestrator(카테고리 검증), market/ux/design-researcher(후보 탐색)에서 호출. 쿼리만 넘기면 됨.
- **구성:** `.cursor/skills/multi-search/SKILL.md`에 YAML 프론트매터와 실행 절차·출력 포맷을 두고, 사용하는 각 서브에이전트의 `skills`에 `multi-search`, `mcpServers`에 `brave-search`를 넣고, `BRAVE_API_KEY`를 설정하면 됨.

상세 워크플로우·브리프 스키마·다른 스킬 정의는 [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md)를 참조하면 됩니다.
