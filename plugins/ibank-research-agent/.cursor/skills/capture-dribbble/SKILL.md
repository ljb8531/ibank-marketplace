---
name: capture-dribbble
description: 브라우저에서 Dribbble(https://dribbble.com/)에 접속해 태그·카테고리(Web Design, E-commerce, Landing page 등)로 디자인 시안을 검색하고, 샷(Shot) 정보 수집·스크린캡처를 저장한다. UXUI Scout이 디자인 Inspiration 수집(collect_inspiration) 시 사용. cursor-ide-browser 필수.
---

# capture-dribbble

UXUI-Scout 소속. **Dribbble** 사이트에 브라우저로 접속해, 프로젝트 도메인/키워드에 맞는 **디자인 시안(Shots)**을 검색·캡처한다. 분석은 하지 않고, 시각 자료와 URL·제목·작가 정보를 수집해 Inspiration용으로 반환한다.

## 역할

- **capture-dribbble**은 **Dribbble 사이트 내부**에서 검색·Explore(Web Design, E-commerce, Landing page 등)를 통해 디자인 샷을 찾고, 썸네일 또는 상세 뷰를 캡처해 레퍼런스로 저장한다.
- 수집한 데이터에 대한 분석은 하지 않는다. UXUI Analyzer가 이후 비교·시사점 도출을 담당한다.

## 입력

- **query** (선택): Dribbble 검색창에 넣을 키워드. 예: `"e-commerce"`, `"landing page"`, `"web design"`, `"dashboard"`, `"SaaS"`.
- **category** (선택): Explore 카테고리. 예: `"Web Design"`, `"Product Design"`, `"UI"`. Dribbble 상단 Explore → Web Design 등.
- **industry_categories** (선택): 프로젝트의 산업 카테고리. query·category 결정 시 참고 (eCommerce → "e-commerce", "web design").
- **service_slug** 또는 **output_slug** (선택): 저장 경로용. 미지정 시 `research/screen/inspiration/dribbble/` 사용.
- **max_results** (선택, 기본 8): 수집할 샷(레퍼런스) 개수 상한.
- **screenshot_per_item** (선택, 기본 true): 각 샷마다 스크린샷을 캡처해 저장할지 여부.

## 가드레일

1. **반드시 cursor-ide-browser를 사용**한다. Dribbble은 동적 리스트·무한 스크롤이 있으므로 브라우저로 접속해 검색·스크롤·클릭·캡처를 수행한다.
2. **navigate → lock → (검색/탐색·클릭·캡처) → unlock** 순서를 따른다.
3. **Dribbble URL**: `https://dribbble.com/`. 검색창 또는 Explore → Web Design 등으로 목록 진입.
4. 검색 시: 상단 검색창을 찾아 query를 입력하고 결과 페이지에서 Shot 카드(이미지·제목·작가·링크)를 추출한다.
5. 각 Shot에서 **제목, Shot URL, 작가명, 썸네일/이미지**를 확보하고, **browser_take_screenshot**으로 카드 또는 상세 뷰를 캡처해 저장한다.
6. 수집 기록을 `research/temp/dribbble-capture-log.md`에 남기고, 필요 시 `research/web/inspiration/_index.md`를 갱신한다.

## 실행 절차

### Step 1: Dribbble 접속 및 초기 스냅샷

- `[browser_navigate]` url=`https://dribbble.com/`
- `[browser_lock]`
- `[browser_snapshot]` → 검색창·Explore 메뉴(Web Design, Product Design 등) 확인

### Step 2: 검색 또는 카테고리 탐색

- **query**가 있으면: 검색창에 query 입력 후 제출 → 검색 결과 리스트로 이동.
- **query**가 없고 **category**가 있으면: Explore → 해당 카테고리(예: Web Design) 클릭.
- 둘 다 없으면: Explore → Popular 또는 Web Design 등 기본 리스트로 이동.
- `[browser_snapshot]`으로 Shot 카드 리스트 구조 파악 (이미지, 제목, 링크, 작가).

### Step 3: Shot 항목 추출 및 캡처

- 리스트에서 **max_results**개까지 항목을 순회:
  - 각 Shot 카드에서 **제목, Shot 상세 URL**(예: `https://dribbble.com/shots/...`), **작가명** 추출.
  - **screenshot_per_item**이 true이면: 해당 카드 영역 또는 클릭 후 큰 이미지 뷰를 **browser_take_screenshot**으로 캡처해 `research/screen/inspiration/dribbble/drib_{순번}.png`에 저장.
  - 필요 시 Shot 클릭 → 상세 페이지에서 더 큰 이미지 캡처 후 뒤로 가기.
- 추가 로드가 필요하면 **browser_scroll**로 스크롤 후 스냅샷 재확인.

### Step 4: 종료 및 로그

- `[browser_unlock]`
- 수집한 각 레퍼런스의 **name, url, author, screenshot_path, brief**를 정리해 반환.
- `research/temp/dribbble-capture-log.md`에 query/category, 수집 개수, 저장 경로 요약 추가.

## 출력

다음 JSON 구조로 반환한다.

```json
{
  "source": "dribbble",
  "source_url": "https://dribbble.com/",
  "query_or_category": "web design",
  "references": [
    {
      "name": "Shot 제목",
      "url": "https://dribbble.com/shots/...",
      "author": "작가명",
      "brief": "한 줄 설명 또는 태그",
      "screenshot_path": "research/screen/inspiration/dribbble/drib_01.png"
    }
  ],
  "count": 8,
  "log_path": "research/temp/dribbble-capture-log.md"
}
```

## 사용 도구

- **cursor-ide-browser**: browser_navigate, browser_lock, browser_snapshot, browser_type, browser_fill, browser_click, browser_scroll, browser_take_screenshot, browser_unlock

## 부산물

- `research/screen/inspiration/dribbble/*.png`: 캡처한 디자인 시안 스크린샷
- `research/web/inspiration/dribbble/`: (선택) 메타 정보·링크 목록 저장
- `research/temp/dribbble-capture-log.md`: 호출별 수집 요약
