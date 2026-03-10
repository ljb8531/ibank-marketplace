---
name: traffic-verify
description: >
  Verifies a site's scale via monthly traffic (SimilarWeb), and when traffic is unavailable,
  via revenue or market cap (search). Returns monthly_visits, optional revenue/market_cap,
  source, confidence, and scale_sufficient for exclusion criteria. Use when validating
  benchmark candidate scale (site-auditor, market-researcher). Requires Firecrawl MCP and Brave Search MCP.
---

# Traffic-Verify

도메인 단위로 **규모 지표**를 검증하는 스킬.  
1) **월간 트래픽**(SimilarWeb)을 우선 수집하고, 2) 트래픽 확보가 어려우면 **매출·시가총액** 검색으로 대체하여 `monthly_visits`, `revenue`, `market_cap`, `scale_sufficient` 등을 반환.  
벤치마킹 후보 규모 확인·제외 조건(규모 미달) 판단에 사용.

## 언제 사용하는가

| 상황 | 사용처 |
|------|--------|
| **Direct 후보** 발굴 시 대표 도메인·각 후보의 규모 확인 | Market-Researcher (경로 3 + 후보 정제) |
| **제외 조건 1** — 서비스 규모 미달 여부 (트래픽 또는 매출/시총 기준) | Site-Auditor (필수) |

**입력:** 검증할 **도메인만** (URL 아님). 예: `musinsa.com`, `oliveyoung.co.kr`  
**호출 예:** `/traffic-verify musinsa.com`

---

## MCP 서버 및 도구

**phase 1: 트래픽** — 우선순위 순으로 시도, 성공 시 phase 2 생략.

| 순서 | MCP 서버 | 도구 | 언제 | 어떻게 |
|------|----------|------|------|--------|
| 1 | **project-0-Research-Agent-firecrawl** | `firecrawl_scrape` | 항상 먼저 시도 | `url`: `https://www.similarweb.com/website/{도메인}/`, `formats`: `["markdown"]`. 마크다운에서 "Total Visits", "Monthly Visits" 등 수치 추출 |
| 2 | **project-0-Research-Agent-brave-search** | `brave_web_search` | 1 실패 시 | `query`: `"site:similarweb.com {도메인}"`, `count`: 10. 스니펫에서 트래픽 수치 추출 |
| 3 | **project-0-Research-Agent-brave-search** | `brave_web_search` | 2도 실패 시 | `query`: `"{도메인} monthly traffic visitors 2025"`, `count`: 10. 검색 결과에서 수치 추출 → **confidence: "low"** |

**phase 2: 규모 대체 지표** — `monthly_visits`가 null일 때만 실행. 매출·시가총액 검색으로 제외 조건 판단 보조.

| 순서 | MCP 서버 | 도구 | 쿼리 예시 |
|------|----------|------|-----------|
| 4a | **project-0-Research-Agent-brave-search** | `brave_web_search` | `"{도메인 또는 회사명} 매출 revenue 연매출 2024 2025"`, `count`: 10 |
| 4b | **project-0-Research-Agent-brave-search** | `brave_web_search` | `"{도메인 또는 회사명} 시가총액 market cap 상장 기업"`, `count`: 10 |

- 스니펫·제목에서 **매출**(억 원, 백만/십억 달러, EUR 등), **시가총액**(억 원, billion USD 등) 수치 추출.
- 단위 통일: 원화는 억 원, 달러는 USD 백만 단위로 기록. `revenue_unit`, `market_cap_unit`에 `"KRW_억"`, `"USD_백만"` 등 명시.
- **call_mcp_tool:** `server`에 MCP 서버 식별자, `toolName`에 도구명, `arguments`에 query·count 전달.
- Firecrawl용 `FIRECRAWL_API_KEY`, Brave용 `BRAVE_API_KEY` 필요 (`.cursor/mcp.json`).

---

## 실행 순서

1. **방법 1~3** — 트래픽 수집 (기존과 동일). 성공 시 `monthly_visits` 설정 후 **phase 2 생략**.
2. 세 방법 모두 실패 → `monthly_visits: null` 로 두고 **phase 2** 진행.
3. **방법 4a** — `brave_web_search`로 매출 검색 (한·영 각 1회 권장). 스니펫에서 연매출·매출 규모 추출.
4. **방법 4b** — `brave_web_search`로 시가총액 검색 (한·영 각 1회 권장). 상장사인 경우 시총 추출.
5. 추출한 매출·시총을 **규모 충족 기준**과 비교해 `scale_sufficient` 설정 (아래 판단 기준 참고).

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
  "confidence": "high | medium | low",
  "revenue": 숫자 또는 null,
  "revenue_unit": "KRW_억 | USD_백만 | EUR_백만 | 기타",
  "revenue_source": "검색 스니펫 요약 또는 null",
  "market_cap": 숫자 또는 null,
  "market_cap_unit": "KRW_억 | USD_백만 | 기타",
  "market_cap_source": "검색 스니펫 요약 또는 null",
  "scale_alternative": "revenue | market_cap | null",
  "scale_sufficient": true | false | null
}
```

- **scale_alternative**: 트래픽이 null일 때 규모 판단에 사용한 지표. `revenue` 또는 `market_cap`만 있으면 해당 값, 둘 다 있으면 더 확실한 쪽.
- **scale_sufficient**: 트래픽이 있으면 `monthly_visits >= 1000` 여부; 트래픽이 null이면 아래 규모 충족 기준에 따라 `true`/`false`, 둘 다 없으면 `null`.

공통 출력 포맷(`output-format.mdc`)의 `traffic` 필드와 매핑: `traffic.monthly_visits`, `traffic.source`, `traffic.confidence` 및 선택 필드 `revenue`, `market_cap`, `scale_sufficient`.

---

## 규모 충족 기준 (제외 조건 1 판단용)

| 지표 | 충족 기준 | 비고 |
|------|-----------|------|
| **monthly_visits** | ≥ 1,000 | 트래픽 확보 시 우선 적용 |
| **revenue** (연매출) | KRW 10억 이상 또는 USD 1M(백만달러) 이상 | 트래픽 null일 때 대체 |
| **market_cap** (시가총액) | KRW 100억 이상 또는 USD 10M 이상 | 상장사, 트래픽 null일 때 대체 |

- 위 기준 중 **하나라도 충족**하면 `scale_sufficient: true` (규모 미달 아님 → 제외 조건 1 PASS 가능).
- 트래픽·매출·시총 모두 없거나 모두 미달이면 `scale_sufficient: false` 또는 `null` → 제외 조건 1 FAIL.

---

## 판단 기준

- `monthly_visits !== null` 이면 해당 값으로만 규모 판단. `< 1,000` → Excluded.
- `monthly_visits === null` 이면 **revenue / market_cap** 검색 결과로 `scale_sufficient` 설정. `true`면 규모 충족으로 간주(PASS), `false`/`null`이면 규모 미달(FAIL).
- 방법 3만으로 트래픽 확보한 경우 → **반드시** `confidence: "low"`.
- 매출·시총은 검색 스니펫 기반이므로 해당 시점에만 `confidence: "low"` 또는 `"medium"`으로 두고, 근거를 `revenue_source`/`market_cap_source`에 요약 기록.

제외·보정 규칙은 `.cursor/rules/exclusion-criteria.mdc` 참고.
