---
name: branding-extract
description: >
  Extracts a website's design system (colors, fonts, typography, spacing, components, images)
  and optionally page layout structure (sections: GNB, hero, grid, carousel, footer) into
  standardized JSON. Use when design-researcher collects Inspire candidates in PHASE 2 (소스 5:
  비주얼 자산 수집), after screenshot-capture per candidate URL. Saves to output/branding/{서비스명}.json
  for benchmark-report comparison. 저장 경로는 .benchmark-output-root 기준 {OUTPUT_BASE}/output/branding/{서비스명}.json. Requires Firecrawl MCP (firecrawl_scrape; firecrawl_extract optional).
  Firecrawl 실패·데이터 부족 시 Playwright MCP(browser_snapshot)로 폴백·보조. Playwright는 SPA/JS 렌더링 검증·레이아웃 보완용 강력한 보조수단.
argument-hint: [URL]
allowed-tools: Bash, Read, Write, call_mcp_tool
---

# Branding-Extract

단일 URL에서 디자인 시스템과(선택) 페이지 레이아웃을 표준 JSON으로 추출해 **{OUTPUT_BASE}/output/branding/{서비스명}.json**에 저장한다. (OUTPUT_BASE는 프로젝트 루트 `.benchmark-output-root`에서 읽음, 없으면 `output`.)

## 언제 사용하는가

| 상황 | 사용처 |
|------|--------|
| **Inspire 후보 URL**에 대해 디자인 시스템·레이아웃 수집 | design-researcher, PHASE 2 소스 5 (비주얼 자산 수집) |
| **screenshot-capture** 실행 직후, 같은 후보 URL마다 1회 호출 | design-researcher |

**입력:** `$ARGUMENTS` = 추출 대상 URL (후보 사이트 전체 URL).  
**호출 예:** `/branding-extract https://example.com`

---

## MCP 서버 및 도구

- **MCP 서버:** `project-0-Research-Agent-firecrawl` (Firecrawl, 1차) / **project-0-Research-Agent-playwright** (보조·폴백)
- **필수 도구:** `firecrawl_scrape` — 디자인 시스템·이미지 추출
- **선택 도구:** `firecrawl_scrape`(formats: json) 또는 `firecrawl_extract` — 레이아웃 구조 추출
- **보조·폴백 도구 (Playwright):** `browser_navigate`, `browser_snapshot`, `browser_wait_for` — Firecrawl 실패 시 또는 레이아웃·구조 보완 시 페이지 구조·텍스트 수집 (강력한 보조수단)

### firecrawl_scrape — 언제·어떻게

| 용도 | 시점 | 인자 |
|------|------|------|
| **디자인 시스템·이미지** | 항상 1회 | `url`: $ARGUMENTS, `formats`: `["branding", "images"]` |
| **레이아웃** (선택) | 레이아웃 수집 시 | 동일 URL, `formats`: `["json"]`, `jsonOptions`: `prompt`(상단→하단 섹션 추출 지시), `schema`(layout.sections[] 스키마) |

반환된 branding 객체에서 colorScheme, colors, fonts, typography, spacing, components, images 정리.

### firecrawl_extract — 언제·어떻게 (레이아웃용 대안)

- **언제:** 레이아웃을 별도 호출로 뽑을 때 (firecrawl_scrape의 json 대신).
- **어떻게:** `urls`: [대상 URL], `prompt`: "Extract page layout sections from top to bottom (type, order, position, grid, aside, scroll, description)", `schema`: layout 스키마.

---

## 실행 순서

1. **스크래핑** — `firecrawl_scrape`(url=$ARGUMENTS, formats=`["branding", "images"]`).
2. **정리** — 반환 branding에서 colorScheme, colors, fonts, typography, spacing, components, images 매핑.
3. **(선택) 레이아웃** — 동일 URL에 `firecrawl_scrape`(formats: json + jsonOptions) 또는 `firecrawl_extract`로 sections[] 추출 후 `branding.layout`에 병합.
4. **저장** — `{OUTPUT_BASE}/output/branding/{서비스명}.json`에 기록. 서비스명: 공백→하이픈, 특수문자 제거, 소문자.

**레이아웃 sections[] 스키마:** 각 섹션 — `order`, `type`(gnb|hero|grid|carousel|footer 등), `position`, `grid`(예: 4x4), `aside`(position, component), `scroll`(horizontal|vertical), `description`.

---

## 출력 포맷

```json
{
  "url": "$ARGUMENTS",
  "branding": {
    "colorScheme": "light | dark",
    "colors": { "primary": "#...", "secondary": "#...", "accent": "#...", "background": "#...", "textPrimary": "#..." },
    "fonts": [{ "family": "..." }],
    "typography": { "fontFamilies": {}, "fontSizes": {}, "fontWeights": {} },
    "spacing": { "baseUnit": 8, "borderRadius": "8px" },
    "components": { "buttonPrimary": {}, "buttonSecondary": {} },
    "images": { "logo": "url", "favicon": "url", "ogImage": "url" },
    "layout": { "viewport": "desktop", "sections": [{ "order": 1, "type": "gnb", "position": "sticky_top", "description": "..." }, ...] }
  },
  "saved_to": "{OUTPUT_BASE}/output/branding/{서비스명}.json"
}
```

`layout`은 레이아웃 추출을 수행한 경우에만 포함.

---

## 품질 체크

- `branding.colors.primary`가 null이면 재시도 (최대 2회). 계속 부족하면 **Playwright 보조**로 스냅샷 기반 구조·레이아웃 보완.
- `fonts`가 비어 있으면 `/site-scrape`로 HTML 가져와 font-family 파싱 보완. 또는 Playwright 스냅샷에서 노드 구조로 폰트 사용 추론.

---

## Playwright 보조·폴백 (강력한 보조수단)

Playwright는 **단순 폴백이 아니라** 다음에 적극 활용한다.

- **폴백:** Firecrawl이 차단·에러·rate limit으로 재시도 후에도 실패할 때 → 디자인 시스템·레이아웃 수집을 Playwright 스냅샷으로 대체.
- **품질 보완:** Firecrawl branding이 불완전(colors/fonts 비어 있음)할 때 → Playwright `browser_snapshot`으로 렌더된 DOM·접근성 트리 수집 후 레이아웃 섹션·구조 보완.
- **SPA/JS 렌더링:** 클라이언트 렌더링 사이트에서 Firecrawl이 빈 HTML만 가져올 때 → Playwright로 `browser_navigate` → `browser_wait_for`(time=2~3) → `browser_snapshot` 수행해 최종 DOM 기준 구조 추출.

**Playwright 폴백 실행 절차**

1. Playwright MCP: `browser_navigate`(url=`$ARGUMENTS`) → `browser_wait_for`(time=2~3) → `browser_snapshot`.
2. 스냅샷 결과를 바탕으로:
   - **layout.sections**: 스냅샷의 노드 계층·이름·역할에서 상단→하단 섹션(gnb, hero, grid, carousel, footer 등)을 추론해 `branding.layout.sections[]` 작성.
   - **colors/fonts/typography**: 스냅샷만으로는 스타일 값 추출이 제한적이므로, 가능한 범위에서만 채우고 나머지는 null 또는 빈 객체. (스크린샷은 `/screenshot-capture`로 별도 확보.)
3. `{OUTPUT_BASE}/output/branding/{서비스명}.json`에 저장 시 `"source": "playwright_fallback"` 또는 `"playwright_supplement"` 등 출처 필드로 구분.
4. 저장 경로는 동일: `{OUTPUT_BASE}/output/branding/{서비스명}.json`.

---

## 참고

- 상세: 프로젝트 루트 `docs/branding-extract-skill-guide.md`
- 저장 경로 사전 생성: `mkdir -p {OUTPUT_BASE}/output/branding` (OUTPUT_BASE는 .benchmark-output-root에서 읽음)
