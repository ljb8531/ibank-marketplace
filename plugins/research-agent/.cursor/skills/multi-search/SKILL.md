---
name: multi-search
description: >
  단일 쿼리를 Brave Search에서 한국어·영문 병렬 실행 후 통합·필터링·재검색하는 검색 스킬.
  벤치마킹 후보 탐색, 시장 조사, 디자인 레퍼런스 검색, 카테고리 검증, 회사/서비스 정보 수집 시 사용.
  사용자가 검색 키워드·쿼리를 요청하거나, 에이전트 워크플로우에서 검색이 필요할 때 적용.
---

# Multi-Search

## 언제 사용하는가

| 상황 | 사용처 |
|------|--------|
| **회사/서비스 정보·시장·트렌드 수집** | Context-Builder(필수), Level 1–2 인풋 시 다수 호출 |
| **카테고리 검증** | Orchestrator Step 1-2, Context-Builder 자가 검증 |
| **후보·키워드·뉴스·레퍼런스 검색** | Market/UX/Design-Researcher (키워드, site:연산자 포함 쿼리) |
| **결과 5개 미만** | 키워드 변형 후 최대 3회 재검색 |

**site:** 연산자 포함 쿼리는 한·영 변환 없이 **동일 쿼리**로만 검색.

---

## 사용 MCP 서버·도구

| 항목 | 값 |
|------|-----|
| **MCP 서버** | `brave-search` (Cursor에서는 `project-0-Research-Agent-brave-search` 등 프로젝트 접두사일 수 있음) |
| **도구** | `brave_web_search` |
| **호출 시점** | 검색 실행 시마다 한·영 각 1회 (총 2회) |

**brave_web_search 호출 규칙:**

- **한국어 검색:** `call_mcp_tool` → server `brave-search`, tool `brave_web_search`, arguments `{ "query": "<쿼리 한국어>", "count": 10 }`
- **영문 검색:** 동일 도구, `{ "query": "<쿼리 영문>", "count": 10 }`
- **site: 포함 쿼리:** 변환 없이 **동일 query**로 2회 호출(한·영 각각이 아닌 같은 문자열)

---

## 실행 절차

### 1. 검색 실행

- **brave-search** MCP의 **brave_web_search**를 사용.
- 한국어 쿼리로 `query`, `count: 10` 한 번 호출.
- 영문 쿼리로 `query`, `count: 10` 한 번 호출.
- `site:` 가 포함된 쿼리는 변환 없이 그대로 사용.

### 2. 결과 통합

- 두 결과를 합치고 **중복 URL 제거**.
- 두 검색 모두에 등장 → `confidence: "high"`.
- 한쪽에만 등장 → `confidence: "medium"`.
- `source`: `"brave_ko"` / `"brave_en"` 구분 유지.

### 3. 품질 필터

- sponsored·ad 표시 결과 제거.
- 명백한 스팸 도메인 제거.

### 4. 결과 부족 시 재검색

- 통합 결과가 **5개 미만**이면:
  - 동의어 추가 또는 구체화/일반화로 쿼리 변형.
  - Step 1–3 재실행.
  - **최대 3회**까지 반복.

---

## 출력 포맷

다음 구조의 JSON 배열로 반환:

```json
[
  {
    "url": "https://...",
    "title": "제목",
    "snippet": "요약",
    "source": "brave_ko | brave_en",
    "confidence": "high | medium",
    "rank": 1
  }
]
```

---

## 요약

- **언제:** 검색이 필요한 모든 PHASE(후보 탐색, 시장 조사, 레퍼런스, 카테고리 검증, 회사/서비스 보강).
- **무엇으로:** MCP 서버 **brave-search**, 도구 **brave_web_search** (query, count: 10).
- **어떻게:** 한·영 각 10건 호출 → 통합·중복 제거·confidence 태깅 → 필터 → 5개 미만이면 쿼리 변형 후 최대 3회 재검색.
