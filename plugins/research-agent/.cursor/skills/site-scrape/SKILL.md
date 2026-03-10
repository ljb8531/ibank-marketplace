---
name: site-scrape
description: >
  Extracts a single URL to markdown and analyzes site structure (links, page count) to infer features.
  Use when analyzing an existing site, validating candidate URLs, or checking exclusion criteria (broken, app-only, closed, insufficient content).
  Requires Firecrawl MCP (firecrawl_scrape, firecrawl_map). Firecrawl 실패 시 cursor-ide-browser(browser_navigate, browser_snapshot)로 폴백 가능.
argument-hint: [URL]
allowed-tools: Bash, Read, Write, call_mcp_tool
---

# Site-Scrape

단일 URL의 콘텐츠를 마크다운으로 추출하고, 사이트 구조를 분석해 기능 존재 여부를 판단하는 스킬.

## 언제 사용하는가

| 상황 | 사용처 |
|------|--------|
| **URL만 있을 때** 기존 사이트 분석·브리프 추론 | Context-Builder (필수) |
| **후보 사이트**의 기능·UX·동선 검증 | UX-Researcher |
| **제외 조건** 검증(기능 미작동, 분석 불가, App-only, 폐쇄형 등) | Site-Auditor (필수) |

**입력:** 스크래핑할 URL 1개 (메인 또는 하위 페이지).  
**호출 예:** `/site-scrape https://example.com`, `/site-scrape https://competitor.co.kr/about`

---

## MCP 서버 및 도구

- **MCP 설정:** `.cursor/mcp.json`에는 `firecrawl` 키로 등록, `FIRECRAWL_API_KEY` 필요.
- **call_mcp_tool 호출 시:** `server`에는 Cursor가 부여한 **서버 식별자**를 쓴다. mcp.json의 키(`firecrawl`)와 다를 수 있음.
  - **server:** `"project-0-Research-Agent-firecrawl"` (이 프로젝트에서 사용 중인 Firecrawl MCP 식별자)
  - **toolName:** `firecrawl_scrape` 또는 `firecrawl_map`
  - **arguments:** 아래 규칙대로.
- **사용 도구:** `firecrawl_scrape`, `firecrawl_map`.
- **폴백:** Firecrawl 실패 시 **cursor-ide-browser** — `browser_navigate`, `browser_snapshot`, `browser_scroll`.

### firecrawl_scrape — 언제·어떻게

- **언제:** 메인 URL과, map으로 얻은 **주요 하위 페이지 2~3개** 각각에 대해 호출.
- **어떻게:** `url`: 스크래핑할 URL, `formats`: `["markdown", "links"]`.
- **실패 시:** 최대 3회 재시도, 간격 5초.

### firecrawl_map — 언제·어떻게

- **언제:** 메인 URL 1회만. 사이트 구조·하위 페이지 목록·총 페이지 수 파악용.
- **어떻게:** `url`: 메인 URL. 결과에서 하위 URL 리스트와 페이지 수 추출 → 그중 메뉴/핵심 페이지 2~3개를 골라 각각 `firecrawl_scrape` 실행.

---

## 실행 순서

1. **메인 스크래핑** — `firecrawl_scrape`(url=대상 URL, formats=`["markdown", "links"]`). 실패 시 최대 3회 재시도(간격 5초). 계속 실패하면 **폴백(아래)** 으로 전환.
2. **사이트맵** — `firecrawl_map`(url=동일 URL) → 하위 URL·페이지 수 추출.
3. **하위 2~3페이지 스크래핑** — map 결과에서 핵심 페이지 선별 후 각 URL에 `firecrawl_scrape` 동일 옵션으로 실행.
4. **기능 판단** — 수집한 마크다운에서 검색/필터/로그인/결제·예약/동적 인터랙션 등 유무 판단.

### Firecrawl 실패 시 폴백 (cursor-ide-browser)

Firecrawl이 차단·에러·rate limit으로 재시도 후에도 실패할 때만 사용.

1. **메인 페이지:** `browser_navigate`(url=대상 URL) → `browser_snapshot`으로 접근성 트리(텍스트·링크·구조) 수집. 필요 시 `browser_scroll` 후 스냅샷을 한두 번 더 호출해 하단 콘텐츠까지 확보.
2. **마크다운 대체:** 스냅샷 결과를 바탕으로 텍스트·헤딩·링크를 정리해 `main_page_markdown`에 넣을 내용 생성(마크다운 형식에 가깝게).
3. **링크·하위 페이지:** 스냅샷에서 링크(`role="link"` 또는 href) 추출 → `sub_pages`에 2~3개 선별. 각 URL에 `browser_navigate` 후 `browser_snapshot`으로 해당 페이지 내용 수집.
4. **기능 판단:** 스냅샷 텍스트·구조에서 검색/필터/로그인/결제 등 유무 판단.
5. 출력 JSON의 `status` 옆에 `"source": "browser_fallback"` 등 출처를 넣어 구분. 폴백은 파일 저장이 아니라 응답 데이터만 사용하므로 **워크스페이스로 복사할 캡처 파일은 없음**.

---

## 출력 포맷

다음 구조의 JSON으로 정리:

```json
{
  "url": "대상 URL",
  "main_page_markdown": "메인 페이지 마크다운 (첫 2000자)",
  "page_count": 숫자,
  "sub_pages": ["url1", "url2", "url3"],
  "features_detected": ["search", "filter", "login", "payment", ...],
  "content_length": 마크다운 전체 글자수,
  "has_dynamic_content": true | false,
  "status": "insufficient" (선택, 품질 이슈 시만)
}
```

---

## 품질·제외 규칙

- **마크다운 500자 미만** 또는 "Coming Soon", "Under Construction", "준비 중" 등 → `status: "insufficient"` 태깅 (제외 조건: 기능 미작동).
- **하위 페이지 3개 미만** 또는 동적 기능 전무 → 분석 불가로 간주.
- **앱 다운로드 안내만 있고 실질 웹 콘텐츠 없음** → App-only.
- **로그인 없이 접근 가능한 콘텐츠가 메인 외 없음** → 폐쇄형.

상세 제외·보정 규칙은 `.cursor/rules/exclusion-criteria.mdc` 참고.

---

## 요약: 1차(Firecrawl) vs 폴백(Browser)

| 단계 | 1차 | 폴백 |
|------|-----|------|
| 메인 콘텐츠 | `firecrawl_scrape`(markdown, links) | `browser_navigate` → `browser_snapshot`(및 스크롤 후 추가 스냅샷) |
| 하위 URL·페이지 수 | `firecrawl_map` | 스냅샷에서 링크 추출 후 2~3개 선별 방문 |
| 하위 페이지 콘텐츠 | `firecrawl_scrape` 각 URL | 각 URL에 `browser_navigate` → `browser_snapshot` |
