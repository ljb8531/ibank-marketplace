---
name: capture-awwwards
description: 브라우저에서 Awwwards(https://www.awwwards.com/)에 접속해 카테고리·Sites of the Day·트렌드별로 디자인 레퍼런스를 검색하고, 수상 사이트 정보 수집·스크린캡처를 저장한다. UXUI Scout이 디자인 Inspiration 수집(collect_inspiration) 시 사용. cursor-ide-browser 필수.
---

# capture-awwwards

UXUI-Scout 소속. **Awwwards** 사이트에 브라우저로 접속해, 프로젝트 도메인/카테고리에 맞는 **디자인 레퍼런스**(수상 사이트, 트렌드)를 탐색·캡처한다. 분석은 하지 않고, 시각 자료와 URL·제목을 수집해 Inspiration용으로 반환한다.

## 역할

- Domain Scout·select-benchmark-candidates가 **Inspiration** 유형 서비스를 검색할 수 있고, **capture-awwwards**는 **Awwwards 사이트 내부**에서 직접 카테고리·Sites of the Day·트렌드를 탐색해 디자인 시안·레퍼런스를 수집한다.
- 수집한 데이터에 대한 분석은 하지 않는다. UXUI Analyzer가 이후 비교·시사점 도출을 담당한다.

## 입력

- **query** 또는 **category** (선택): 검색/필터에 사용할 키워드 또는 카테고리. 예: `"E-commerce"`, `"Fashion"`, `"Portfolio"`, `"Site of the Day"`. 없으면 Sites of the Day·Winners 위주로 수집.
- **industry_categories** (선택): 프로젝트의 산업 카테고리 배열 (예: `["eCommerce", "Beauty"]`). Awwwards "By Category" 매핑 시 참고 (E-commerce, Fashion, Business & Corporate 등).
- **service_slug** 또는 **output_slug** (선택): 저장 경로용. 미지정 시 `research/screen/inspiration/awwwards/` 또는 `research/web/inspiration/awwwards/` 사용.
- **max_results** (선택, 기본 8): 수집할 레퍼런스(사이트/캡처) 개수 상한.
- **screenshot_per_item** (선택, 기본 true): 각 레퍼런스마다 스크린샷을 캡처해 저장할지 여부.

## 가드레일

1. **반드시 cursor-ide-browser를 사용**한다. Awwwards는 동적 페이지이므로 브라우저로 접속해 탐색·클릭·스크롤·캡처를 수행한다.
2. **navigate → lock → (탐색·클릭·캡처) → unlock** 순서를 따른다.
3. **Awwwards URL**: `https://www.awwwards.com/`. Sites of the Day·Winners·By Category·Trending 등 메뉴/링크를 스냅샷으로 확인한 뒤 이동한다.
4. 카테고리 매핑 예: eCommerce → E-commerce, Beauty/Fashion → Fashion, SaaS/Corporate → Business & Corporate. "By Category" 또는 검색을 활용한다.
5. 각 수상/추천 사이트 항목에서 **사이트명, URL(해당 수상 작품 링크 또는 외부 사이트 URL), 한 줄 설명**을 추출하고, 가능하면 **browser_take_screenshot**으로 캡처해 저장한다.
6. 수집 기록을 `research/temp/awwwards-capture-log.md`(또는 web-scout-log에 섹션 추가)에 남기고, 필요 시 `research/web/inspiration/_index.md`를 갱신한다.

## 실행 절차

### Step 1: Awwwards 접속 및 초기 스냅샷

- `[browser_navigate]` url=`https://www.awwwards.com/`
- `[browser_lock]`
- `[browser_snapshot]` → GNB·메뉴 구조 확인 (Awards, Trending, By Category, Sites of the Day, Winners 등)

### Step 2: 목표 영역으로 이동

- **Sites of the Day / Winners** 수집 시: 해당 메뉴 또는 링크 클릭 후 리스트 페이지로 이동.
- **카테고리별** 수집 시: "By Category" 또는 검색에서 query/category·industry_categories에 맞는 항목 선택 (예: E-commerce, Fashion).
- `[browser_snapshot]`으로 결과 리스트(카드·썸네일·제목·링크) 구조 파악.

### Step 3: 레퍼런스 항목 추출 및 캡처

- 리스트에서 **max_results**개까지 항목을 순회:
  - 각 항목에서 **사이트명(또는 프로젝트명), 상세 페이지 URL, 외부 사이트 URL**을 추출.
  - 상세 페이지로 들어가 외부 사이트 링크가 있으면 확보.
  - **screenshot_per_item**이 true이면: 해당 카드/썸네일 또는 상세 뷰를 **browser_take_screenshot**으로 캡처해 `research/screen/inspiration/awwwards/{slug}_{순번}.png`(또는 `research/web/inspiration/awwwards/`)에 저장.
- 스크롤이 필요하면 **browser_scroll**로 추가 항목 로드 후 반복.

### Step 4: 종료 및 로그

- `[browser_unlock]`
- 수집한 각 레퍼런스의 **name, url, detail_url, screenshot_path, brief**를 정리해 반환.
- `research/temp/awwwards-capture-log.md`에 query/category, 수집 개수, 저장 경로 요약 추가.

## 출력

다음 JSON 구조로 반환한다.

```json
{
  "source": "awwwards",
  "source_url": "https://www.awwwards.com/",
  "query_or_category": "E-commerce",
  "references": [
    {
      "name": "사이트/프로젝트명",
      "url": "https://...",
      "detail_url": "https://www.awwwards.com/...",
      "brief": "한 줄 설명 또는 수상 구분",
      "screenshot_path": "research/screen/inspiration/awwwards/aww_01.png"
    }
  ],
  "count": 8,
  "log_path": "research/temp/awwwards-capture-log.md"
}
```

## 사용 도구

- **cursor-ide-browser**: browser_navigate, browser_lock, browser_snapshot, browser_click, browser_scroll, browser_take_screenshot, browser_unlock

## 부산물

- `research/screen/inspiration/awwwards/*.png`: 캡처한 디자인 레퍼런스 스크린샷
- `research/web/inspiration/awwwards/`: (선택) 메타 정보·링크 목록 저장
- `research/temp/awwwards-capture-log.md`: 호출별 수집 요약
