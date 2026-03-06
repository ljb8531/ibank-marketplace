---
name: capture-naver
description: 브라우저에서 네이버(NAVER)에 접속해 실제 사용자처럼 검색어를 입력하고, 검색 결과·기사/블로그 링크 클릭 후 본문 수집, 필요 시 이미지 검색으로 참고 이미지를 스크린캡처·저장한다. Web Scout이 서비스별 역방향 웹 리서치(국내 공신력 기사·리뷰·후기 수집) 시 사용. cursor-ide-browser 필수.
---

# capture-naver

Web-Scout 소속. **도메인 목록 페이지를 크롤링하는 것이 아니라**, 해당 서비스/도메인에 대한 **역방향 웹 검색**을 네이버에서 수행한다. 네이버 사이트에 접속해 검색어를 입력하고, 검색 결과에서 기사·블로그·뉴스·카페·사용 후기 등의 링크를 따라 들어가 콘텐츠를 수집하며, 필요 시 이미지 검색 결과를 캡처해 워크스페이스에 저장한다. (capture-google과 동일한 역할·절차, 검색 엔진만 네이버.)

## 역할

- Service Scout은 **서비스 공식 페이지**를 수집하고, UXUI Scout은 **해당 페이지의 시각·구조**를 수집한다.
- **capture-naver**은 같은 서비스 목록을 기준으로 **네이버에서 "이 서비스에 대한" 기사·리뷰·후기·참고 이미지**를 찾아 수집한다. 국내 서비스·한국어 콘텐츠 수집에 적합하다.
- 수집한 데이터에 대한 분석은 하지 않는다. 데이터를 구조화하여 저장·반환하는 것이 목적이다.

## 입력

- **query** (필수): 네이버 검색창에 입력할 검색어 (예: `"서비스명 리뷰"`, `"서비스명 사용 후기"`, `"서비스명 비교"`).
- **service_slug** (필수): 서비스 슬러그. 저장 경로에 사용 (예: `research/web/{service_slug}/`).
- **collect_links** (선택, 기본 true): 검색 결과에서 링크를 클릭해 세부 페이지 콘텐츠를 수집할지 여부.
- **max_links** (선택, 기본 5): 수집할 링크(기사/블로그/후기 페이지) 개수 상한.
- **image_search** (선택, 기본 false): 네이버 이미지 검색을 수행할지 여부.
- **max_images** (선택, 기본 5): 이미지 검색 시 캡처할 참고 이미지 개수 상한 (스크린캡처 또는 저장).

## 가드레일

1. **반드시 cursor-ide-browser를 사용**한다. WebSearch·mcp_web_fetch만으로는 "네이버 사이트에서 직접 검색하는" 동작을 구현할 수 없으므로, 브라우저로 네이버에 접속해 입력·클릭·이동을 수행한다.
2. **navigate → lock → (검색·클릭·캡처) → unlock** 순서를 따른다. lock 전에 navigate가 선행되어야 한다.
3. 검색어는 **실제 사용자가 입력하는 것처럼** 검색창 요소를 찾아 `browser_type`(또는 `browser_fill`)로 입력한 뒤 제출(Enter 또는 검색 버튼 클릭)한다.
4. 검색 결과 페이지에서 **스냅샷으로 링크·제목·스니펫**을 추출한다. 클릭 시 새 탭이 열리면 해당 탭으로 전환해 콘텐츠 수집 후 원래 탭으로 복귀할 수 있다.
5. 세부 페이지 수집 시: 가능하면 **mcp_web_fetch**로 해당 URL 본문을 수집하고, 실패하거나 JS 렌더링이 필요하면 **browser_navigate → browser_snapshot**으로 수집한다. 수집한 텍스트는 `research/web/{service_slug}/articles/` 아래에 서비스·검색 구분 가능한 파일명으로 저장한다.
6. **이미지 검색** 시: 네이버 이미지 검색 페이지로 이동한 뒤, 결과 그리드 또는 개별 이미지를 **browser_take_screenshot**으로 캡처해 `research/web/{service_slug}/images/`(또는 `research/images/{service_slug}/`)에 저장한다.
7. 모든 수집 기록을 `research/temp/web-scout-log.md`(또는 `capture-naver-log.md`)에 추가하고, 필요 시 `research/web/_index.md`를 갱신한다.
8. 한 번에 과도한 요청을 하지 않는다. 검색 1회·링크 N개·이미지 M개 수준으로 제한하고, 필요 시 쿼리별로 스킬을 여러 번 호출한다.

## 실행 절차

### Step 1: 네이버 접속 및 검색

- `[browser_navigate]` url=`https://www.naver.com` (또는 `https://search.naver.com/search.naver?query={encodeURIComponent(query)}` 로 직접 검색 URL 이동)
- `[browser_lock]`
- `[browser_snapshot]` → 검색 입력창 요소 식별 (ref, 역할)
- `[browser_type]` 또는 `[browser_fill]`: element=검색창, ref=해당 ref, text=query, submit=true (또는 Enter로 제출)
- 검색 결과 로딩 대기: 짧은 대기 후 `[browser_snapshot]`으로 결과 페이지 구조 확인

### Step 2: 검색 결과에서 링크·스니펫 추출

- `[browser_snapshot]` → 검색 결과 영역에서 링크(URL)·제목·스니펫 추출 (네이버는 통합검색·뉴스·블로그·카페 등 탭/영역 구분 가능)
- 추출한 목록을 정리해 반환용 `search_results` 배열에 담고, 필요 시 `research/web/{service_slug}/search_results_naver_{query_slug}.md`에 저장

### Step 3: 링크 클릭 및 세부 페이지 수집 (collect_links가 true일 때)

- 상위 **max_links**개 링크에 대해 (광고·동일 사이트 중복은 제외):
  - 해당 결과 링크를 `[browser_click]` 하거나, URL을 사용해 `[mcp_web_fetch]` 시도
  - `mcp_web_fetch` 성공 시: 본문 마크다운을 `research/web/{service_slug}/articles/{slug}_{순번}.md`에 저장
  - `mcp_web_fetch` 실패 또는 페이지가 JS 의존적이면: `[browser_navigate]` 해당 URL → `[browser_snapshot]` → 텍스트를 동일 경로에 `.md`로 저장
  - 다음 결과를 수집하려면 네이버 검색 결과 페이지로 복귀
- 수집한 각 페이지의 **url, title, content_path**를 로그 및 반환 구조에 기록

### Step 4: 이미지 검색 (image_search가 true일 때)

- 네이버 이미지 검색 URL로 이동 (예: `https://search.naver.com/search.naver?where=image&query={encodeURIComponent(query)}`)
- `[browser_snapshot]` → 이미지 결과 그리드 또는 썸네일 영역 확인
- **max_images**개까지: 이미지 영역을 **browser_take_screenshot**으로 캡처해 `research/web/{service_slug}/images/img_naver_{순번}.png`에 저장하거나, 썸네일 클릭 후 큰 이미지 뷰를 스크린캡처해 저장
- 저장한 이미지 경로 목록을 반환용 `image_paths` 배열에 담음

### Step 5: 종료 및 로그

- `[browser_unlock]`
- `research/temp/web-scout-log.md`에 이번 호출 요약 추가 (query, service_slug, 수집 링크 수, 저장 경로, 이미지 수, engine=naver)
- `research/web/_index.md` 갱신 (서비스별 articles·images 목록 반영)

## 출력

다음 JSON 구조로 반환한다.

```json
{
  "engine": "naver",
  "query": "입력 검색어",
  "service_slug": "서비스 슬러그",
  "search_results": [
    {
      "title": "검색 결과 제목",
      "url": "https://...",
      "snippet": "스니펫 텍스트"
    }
  ],
  "collected_articles": [
    {
      "url": "https://...",
      "title": "페이지 제목",
      "content_path": "research/web/{service_slug}/articles/{filename}.md",
      "status": "success" | "partial" | "failed"
    }
  ],
  "image_paths": [
    "research/web/{service_slug}/images/img_naver_01.png"
  ],
  "log_path": "research/temp/web-scout-log.md"
}
```

(`image_search`가 false이면 `image_paths`는 빈 배열 또는 생략.)

## 사용 도구

- **cursor-ide-browser**: browser_navigate, browser_lock, browser_snapshot, browser_type, browser_fill, browser_click, browser_take_screenshot, browser_navigate_back, browser_unlock
- **mcp_web_fetch**: 세부 페이지 본문 수집 시 1차 시도

## 부산물

- `research/web/{service_slug}/articles/*.md`: 수집한 기사·블로그·후기 본문
- `research/web/{service_slug}/images/*.png`: 이미지 검색으로 캡처한 참고 이미지
- `research/web/{service_slug}/search_results_naver_{query_slug}.md`: (선택) 검색 결과 요약
- `research/temp/web-scout-log.md`: 호출별 수집 기록
- `research/web/_index.md`: 서비스별 수집 목록 인덱스
