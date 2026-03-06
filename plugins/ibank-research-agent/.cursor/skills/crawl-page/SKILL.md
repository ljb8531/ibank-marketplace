---
name: crawl-page
description: Crawls a single page URL to collect content and save for analysis. mcp_web_fetch returns markdown (not full HTML); use cursor-ide-browser when structure/layout is needed. Saves content as .md, structure as _snapshot when using browser. Use when Service Scout collects service pages. page_type 예: main, features, demo, use_cases(SaaS) / product, catalog, cart, brand, campaign 등 도메인별 식별자. UX/UI·스크린샷 수집은 UXUI Scout의 capture-screenshots·capture-dom 담당. Full HTML source is not captured by current tools.
---

# crawl-page

Service-Scout 소속(범용 재사용 가능). 단일 URL의 페이지 콘텐츠를 수집하여 저장한다.

## 중요: 수집 결과의 성격

- **mcp_web_fetch**: URL을 요청하면 **전체 HTML이 아닌, 읽기용으로 변환된 마크다운 텍스트**를 반환한다. 메인 콘텐츠 위주로 추출되며 네비·광고 등이 제거된 형태라, **원본 DOM/레이아웃/구조 분석에는 사용할 수 없다.** 텍스트·카피·기능 문구 추출용으로만 유효하다.
- **cursor-ide-browser (browser_snapshot)**: 렌더링된 페이지의 **접근성 트리(스냅샷)**를 반환한다. 태그 구조·역할·계층 정보가 포함되어 **UX/UI·레이아웃·구성 분석**에 활용 가능하다. 실제 HTML 마크업 원본은 아니지만, 구조 분석용으로는 이 경로가 필요하다.
- **전체 HTML 원본**(DOM, 클래스, 시맨틱 마크업)은 현재 제공 도구로는 확보하지 않는다. 레이아웃·디자인 요소 분석은 **스크린샷(capture-screenshots) + 브라우저 스냅샷** 조합으로 수행한다.

## 입력

- **url**: 수집할 페이지 URL
- **page_type**: `"main"` 또는 도메인별 핵심 페이지 식별자. 예: `"features"` `"demo"` `"use_cases"` (SaaS) / `"product"` `"catalog"` `"cart"` `"brand"` `"campaign"` 등 (이커머스·브랜드 등). 저장 파일명에 사용되므로 영문·소문자·밑줄 권장.
- **service_slug**: 서비스 슬러그 (파일 저장용)

## 가드레일

1. **mcp_web_fetch를 먼저 시도**한다. browser부터 시작하지 않는다.
2. mcp_web_fetch 결과가 **500자 미만이면** browser로 재수집한다.
3. mcp_web_fetch가 **에러를 반환하면** browser로 재수집한다.
4. **UX/UI·레이아웃·디자인 분석이 목적이면** 마크다운만으로는 부족하므로, 메인·기능 페이지 등은 **500자 이상이어도 브라우저 경로로 한 번 더 수집하는 것을 권장**한다(스냅샷 저장).
5. browser 사용 시 반드시 **lock → snapshot → unlock** 순서를 따른다.
6. browser로도 실패하면 **실패 사유를 명시**하고 빈 콘텐츠로 반환한다.
7. **50,000자 초과 시** 앞에서부터 50,000자까지만 포함한다.
8. **저장 형식**: mcp_web_fetch 결과는 **마크다운 그대로** `research/html/{service_slug}/{page_type}.md`에 저장한다. **가짜 HTML로 감싸서 .html로 저장하지 않는다.** 브라우저 사용 시에는 스냅샷 텍스트를 `.md`에, 구조용 스냅샷을 `_snapshot.txt`(또는 JSON)에 저장한다.
9. **모든 수집 기록**을 `research/temp/crawl-log.md`에 추가한다.
10. `research/html/_index.md`를 갱신한다.

## 실행 절차

### Step 1: mcp_web_fetch 시도

- `[mcp_web_fetch]` url
- **성공 + 500자 이상** → Step 4
- **성공 + 500자 미만** → Step 2
- **에러** → Step 2

### Step 2: cursor-ide-browser 시도

- `[browser_navigate]` url
- `[browser_lock]`
- `[browser_snapshot]`
- `[browser_unlock]`
- 스냅샷 텍스트 있음? → Step 4
- 실패? → Step 3

### Step 3: 수집 실패 처리

- 실패 사유 기록. 빈 콘텐츠 반환.
- `research/temp/crawl-log.md`에 실패 기록

### Step 4: 결과 정리 및 저장

- 50,000자 초과 시 자르기
- 수집 방법 기록
- internal_links 추출 (콘텐츠/스냅샷에서 링크 추출)
- **mcp_web_fetch 사용 시**: 수집된 **마크다운 문자열 그대로** `research/html/{service_slug}/{page_type}.md`에 저장. HTML 래퍼로 감싸거나 .html 확장자로 저장하지 않음.
- **cursor-ide-browser 사용 시**: 스냅샷 텍스트를 `research/html/{service_slug}/{page_type}.md`에 저장하고, 구조 분석용으로 스냅샷 전체를 `research/html/{service_slug}/{page_type}_snapshot.txt`(또는 동일 내용을 JSON으로 저장 가능한 경우 해당 형식)에 저장.
- `research/temp/crawl-log.md`에 성공 기록 (저장 경로는 실제 파일 확장자에 맞게 기록)
- `research/html/_index.md` 갱신

## 출력

다음 JSON 구조로 반환한다.

```json
{
  "url": "https://...",
  "page_type": "features",
  "status": "success" | "partial" | "failed",
  "method": "mcp_web_fetch" | "cursor-ide-browser",
  "fail_reason": null | "403 차단" | "콘텐츠 부족" | "타임아웃",
  "content": "수집된 마크다운 또는 스냅샷 텍스트",
  "content_length": 12500,
  "internal_links": ["페이지 내에서 발견된 내부 링크 URL 목록"],
  "content_path": "research/html/{service_slug}/{page_type}.md",
  "snapshot_path": "research/html/{service_slug}/{page_type}_snapshot.txt 또는 null (브라우저 사용 시에만)"
}
```

(하위 호환을 위해 `html_path`를 사용하는 경우, 실제 저장 파일이 .md이면 `content_path`와 동일한 경로를 `html_path`에도 넣을 수 있으나, **저장 파일은 반드시 .md**로 한다.)

## 사용 도구

- **mcp_web_fetch**: 1차 수집 (Step 1). 반환값은 마크다운이므로 .md로 저장.
- **cursor-ide-browser** (browser_navigate, browser_lock, browser_snapshot, browser_unlock): 2차 수집 (Step 2). 스냅샷으로 구조 확보, .md + _snapshot 저장.

## 부산물

- `research/html/{service_slug}/{page_type}.md`: 수집 성공 시 페이지 콘텐츠 (마크다운 또는 스냅샷 텍스트)
- `research/html/{service_slug}/{page_type}_snapshot.txt`: 브라우저 사용 시 구조용 스냅샷 (UX/UI·레이아웃 분석용)
- `research/temp/crawl-log.md`: 매 호출마다 수집 수행 기록 추가
- `research/html/_index.md`: 수집 파일 목록 갱신
