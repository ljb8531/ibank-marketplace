---
name: capture-dom
description: Saves the raw HTML source and linked CSS for code-based design analysis. Fetches the page URL to get HTML, collects stylesheets, and saves a single .html file (HTML + embedded CSS) to research/dom/{slug}/. Use when UXUI Scout collects design-relevant pages (main, features).
---

# capture-dom

UXUI-Scout 소속. **코드만으로 디자인 분석**이 가능하도록 페이지의 **원본 HTML**과 **연관 CSS**를 그대로 저장한다.

## 역할

- **스크린샷(capture-screenshots)** 은 시각적 렌더링만 제공한다. **마크업·클래스명·스타일 규칙**은 원본 HTML/CSS에서만 정확히 분석할 수 있다.
- **이 스킬(capture-dom)** 은 대상 URL을 fetch하여 **원본 HTML 소스**를 얻고, HTML 내 스타일시트 링크를 추출해 **CSS 내용까지 함께** 한 파일에 담아 저장한다. UXUI Analyzer가 레이아웃, 컴포넌트 구조, 시맨틱, 스타일 비교에 활용할 수 있다.

## 입력

- **url**: 저장할 페이지 URL
- **page_type**: `"main"` 또는 도메인별 핵심 페이지 식별자 (예: features, product, catalog, brand, campaign 등)
- **service_slug**: 서비스 슬러그 (파일 저장용)

## 가드레일

1. **산출물은 반드시 .html 한 파일**로 저장한다. `research/dom/{service_slug}/{page_type}.html` — 접근성 스냅샷용 `_dom.txt`가 아니다.
2. 저장되는 .html 파일 내용: **원본 HTML 그대로** + **수집한 CSS를 `<style>` 블록으로 포함**하여, 코드만으로 디자인 분석이 가능하도록 한다.
3. `research/dom/_index.md`가 있으면 해당 서비스·페이지 항목을 갱신한다.
4. 디자인 분석이 목적인 경우 **메인·기능 페이지**에 대해 수행한다. 데모/사용사례는 선택.

## 실행 절차

### Step 1: HTML 소스 획득

- **url**을 fetch하여 원본 HTML 응답을 받는다. (예: `mcp_web_fetch` 또는 `curl` 등으로 GET 요청.)
- 응답 본문을 UTF-8 등 적절한 인코딩으로 문자열로 둔다.

### Step 2: CSS 수집

- HTML에서 다음을 추출한다.
  - `<link rel="stylesheet" href="...">` 의 **href** (외부 스타일시트)
  - `<style>...</style>` 내부 내용 (인라인 스타일은 그대로 HTML에 있으므로 별도 추출 불필요)
- **href**는 페이지 base URL 기준으로 절대 URL로 변환한다. (예: `new URL(href, pageUrl).href`)
- 각 절대 URL로 스타일시트를 fetch하여 내용을 합친다. (실패한 URL은 건너뛰고 계속 진행.)
- 합친 CSS 문자열을 하나로 이어 둔다.

### Step 3: HTML + CSS를 한 파일로 저장

- 원본 HTML 문자열에서 **`</head>` 직전**에 다음 블록을 삽입한다:
  - `<style data-captured="true">` + (합쳐 둔 CSS) + `</style>`
- 삽입된 최종 문자열을 **`research/dom/{service_slug}/{page_type}.html`** 에 저장한다. (파일 인코딩: UTF-8.)
- `</head>`가 없으면 HTML 끝에 `<style data-captured="true">...</style>` 블록을 붙여 저장해도 된다.

### Step 4: 인덱스 갱신

- `research/dom/_index.md`에 이번 저장 항목을 추가한다 (서비스, page_type, 경로, 캡처일).

## 출력

다음 JSON 구조로 반환한다.

```json
{
  "url": "https://...",
  "page_type": "main",
  "service_slug": "example-service",
  "status": "success" | "failed",
  "dom_path": "research/dom/example-service/main.html",
  "fail_reason": null | "fetch 실패" | "저장 실패"
}
```

## 참고

- JS로 동적 렌더링되는 SPA는 서버가 주는 초기 HTML만 저장된다. 필요한 경우 브라우저로 해당 URL을 연 뒤, 별도 수단(예: CDP 등)으로 `document.documentElement.outerHTML`을 얻어 저장하는 방식은 도구 지원 시 확장할 수 있다.
- **build-uxui-comparison**·UXUI Analyzer는 이 .html 경로를 참조하여 마크업 구조·클래스명·스타일 규칙 기반으로 레이아웃·디자인 유형을 분석할 수 있다.
