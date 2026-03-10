---
name: traffic-verify
description: >
  Verifies a site's monthly traffic via SimilarWeb (scrape or search) and returns
  monthly_visits, source, confidence. Use when validating benchmark candidate scale,
  checking exclusion criteria (e.g. under 1k visits), or when market-researcher or
  site-auditor needs traffic data for a domain. Requires Firecrawl MCP and Brave Search MCP.
---

# Traffic-Verify

도메인 단위로 **월간 트래픽**을 검증해 `monthly_visits`, `source`, `confidence`를 반환하는 스킬.  
벤치마킹 후보 규모 확인·제외 조건(규모 미달) 판단에 사용.

## 언제 사용하는가

| 상황 | 사용처 |
|------|--------|
| **Direct 후보** 발굴 시 대표 도메인·각 후보의 트래픽 확인 | Market-Researcher (경로 3 + 후보 정제) |
| **제외 조건 1** — 서비스 규모 미달 여부 (1,000 미만 또는 데이터 없음) | Site-Auditor (필수) |

**입력:** 검증할 **도메인만** (URL 아님). 예: `musinsa.com`, `oliveyoung.co.kr`  
**호출 예:** `/traffic-verify musinsa.com`

---

## MCP 서버 및 도구

두 MCP를 사용한다. **우선순위 순**으로 시도하고, 성공하면 다음 단계는 생략한다.

| 순서 | MCP 서버 | 도구 | 언제 | 어떻게 |
|------|----------|------|------|--------|
| 1 | **project-0-Research-Agent-firecrawl** | `firecrawl_scrape` | 항상 먼저 시도 | `url`: `https://www.similarweb.com/website/{도메인}/`, `formats`: `["markdown"]`. 마크다운에서 "Total Visits", "Monthly Visits" 등 수치 추출 |
| 2 | **project-0-Research-Agent-brave-search** | `brave_web_search` | 1 실패 시 | `query`: `"site:similarweb.com {도메인}"`, `count`: 10. 스니펫에서 트래픽 수치 추출 |
| 3 | **project-0-Research-Agent-brave-search** | `brave_web_search` | 2도 실패 시 | `query`: `"{도메인} monthly traffic visitors 2025"`, `count`: 10. 검색 결과에서 수치 추출 → 이때는 **confidence: "low"** 로 설정 |

- **call_mcp_tool:** `server`에 위 테이블의 MCP 서버 식별자, `toolName`에 도구명, `arguments`에 위 파라미터 전달.
- Firecrawl용 `FIRECRAWL_API_KEY`, Brave용 `BRAVE_API_KEY` 필요 (`.cursor/mcp.json`).

---

## 실행 순서

1. **방법 1** — `firecrawl_scrape`로 SimilarWeb 페이지 스크래핑 → 마크다운에서 월간 방문 수·순위 등 추출. 성공 시 `source: "similarweb_direct"`, `confidence: "high"`.
2. **방법 2** — 방법 1 실패 시 `brave_web_search`로 `site:similarweb.com {도메인}` 검색 → 스니펫에서 수치 추출. 성공 시 `source: "similarweb_search"`, `confidence: "medium"`.
3. **방법 3** — 방법 2도 실패 시 `brave_web_search`로 `"{도메인} monthly traffic visitors 2025"` 검색 → 결과에서 추정. **반드시** `confidence: "low"`.
4. 세 방법 모두 실패 → `monthly_visits: null`, `confidence: "low"` 반환.

---

## 출력 포맷

다음 구조의 JSON으로 정리:

```json
{
  "domain": "입력 도메인",
  "monthly_visits": 숫자 또는 null,
  "trend": "증가 | 감소 | 유지 | 불명",
  "rank": { "global": 숫자 또는 null, "country": 숫자 또는 null },
  "source": "similarweb_direct | similarweb_search | general_search",
  "confidence": "high | medium | low"
}
```

공통 출력 포맷(`output-format.mdc`)의 `traffic` 필드와 매핑: `traffic.monthly_visits`, `traffic.source`, `traffic.confidence`.

---

## 판단 기준

- `monthly_visits === null` → confidence는 `"low"`. 제외 조건 검증 시 규모 미달(FAIL) 가능성 높음.
- `monthly_visits < 1,000` → 제외 대상(Excluded) 플래그.
- 방법 3만 성공한 경우 → **반드시** `confidence: "low"`.

제외·보정 규칙은 `.cursor/rules/exclusion-criteria.mdc` 참고.
