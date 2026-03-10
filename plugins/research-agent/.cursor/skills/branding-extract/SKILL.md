---
name: branding-extract
description: >
  Extracts a website's design system (colors, fonts, typography, spacing, components, images)
  and optionally page layout structure (sections: GNB, hero, grid, carousel, footer) into
  standardized JSON. Use when design-researcher collects Inspire candidates in PHASE 2 (소스 5:
  비주얼 자산 수집), after screenshot-capture per candidate URL. Saves to output/branding/{서비스명}.json
  for benchmark-report comparison. Requires Firecrawl MCP (firecrawl_scrape; firecrawl_extract optional).
argument-hint: [URL]
allowed-tools: Bash, Read, Write
---

# Branding-Extract

단일 URL에서 디자인 시스템과(선택) 페이지 레이아웃을 표준 JSON으로 추출해 `output/branding/{서비스명}.json`에 저장한다.

## 언제 사용하는가

| 상황 | 사용처 |
|------|--------|
| **Inspire 후보 URL**에 대해 디자인 시스템·레이아웃 수집 | design-researcher, PHASE 2 소스 5 (비주얼 자산 수집) |
| **screenshot-capture** 실행 직후, 같은 후보 URL마다 1회 호출 | design-researcher |

**입력:** `$ARGUMENTS` = 추출 대상 URL (후보 사이트 전체 URL).  
**호출 예:** `/branding-extract https://example.com`

---

## MCP 서버 및 도구

- **MCP 서버:** `project-0-Research-Agent-firecrawl` (Firecrawl)
- **필수 도구:** `firecrawl_scrape` — 디자인 시스템·이미지 추출
- **선택 도구:** `firecrawl_scrape`(formats: json) 또는 `firecrawl_extract` — 레이아웃 구조 추출

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
4. **저장** — `output/branding/{서비스명}.json`에 기록. 서비스명: 공백→하이픈, 특수문자 제거, 소문자.

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
  "saved_to": "output/branding/{서비스명}.json"
}
```

`layout`은 레이아웃 추출을 수행한 경우에만 포함.

---

## 품질 체크

- `branding.colors.primary`가 null이면 재시도 (최대 2회).
- `fonts`가 비어 있으면 `/site-scrape`로 HTML 가져와 font-family 파싱 보완.

---

## 참고

- 상세: 프로젝트 루트 `docs/branding-extract-skill-guide.md`
- 저장 경로 사전 생성: `mkdir -p output/branding`
