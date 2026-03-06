---
name: scan-navigation
description: Extracts GNB (global navigation) structure from a service main page and captures navigation screenshots using cursor-ide-browser. Use when UXUI Scout collects each service's main page (once per service), when the user asks to scan navigation or capture GNB, or when GNB structure and nav screenshots are needed for research.
---

# scan-navigation

UXUI-Scout 소속. 서비스 메인 페이지에서 GNB 네비게이션 구조를 추출하고, 네비게이션 스크린샷을 캡처한다.

## 입력

- **url**: 서비스 메인 페이지 URL
- **service_name**: 서비스명 (태깅용)
- **service_slug**: 서비스 슬러그 (파일 저장용)

## 가드레일

1. **반드시 cursor-ide-browser를 사용**한다 (mcp_web_fetch 불가).
2. **navigate → lock → (작업) → unlock** 순서를 따른다. lock 전에 navigate가 선행되어야 한다.
3. 먼저 snapshot으로 기본 GNB를 파악한 뒤, 기본 GNB 상태를 screenshot으로 저장한다.
4. 드롭다운/서브메뉴가 있으면 click하여 펼치고, 재 snapshot + screenshot 한다.
5. 메뉴 깊이는 **최대 3단계**까지만 탐색한다. 3단계 초과는 "depth 3+"로 표기.
6. 각 메뉴 항목의 **연결 URL**을 함께 수집한다.
7. 스크린샷을 `research/screen/{service_slug}/nav_*.png`에 저장한다.
8. `research/screen/_index.md`를 갱신한다 (서비스별 섹션에 nav_*.png 행 추가).

## 실행 절차

### Step 1: 메인 페이지 이동 및 기본 스냅샷

- `[browser_navigate]` url
- `[browser_lock]`
- `[browser_snapshot]` → GNB 기본 구조 파악
- `[browser_screenshot]` → `research/screen/{service_slug}/nav_gnb_default.png` 저장

### Step 2: GNB 1차 분석

스냅샷에서 header/nav 영역의 메뉴 항목 식별. 각 항목의 **label**(텍스트)과 **url**(연결 URL) 추출.

### Step 3: 서브메뉴 탐색 + 스크린샷

드롭다운이 있는 항목마다:

- `[browser_click]` 해당 메뉴 항목 (필요 시 `browser_scroll`로 스크롤 후 클릭)
- `[browser_screenshot]` → `research/screen/{service_slug}/nav_gnb_{menu_slug}_expanded.png` 저장
- `[browser_snapshot]` → 서브메뉴 구조 수집 (label, url, depth)

여러 항목이 있으면 각각 반복. 메뉴 슬러그는 label 기반으로 짧게 (예: products, solutions).

### Step 4: depth 3 이상 확인

서브메뉴 내 추가 하위 메뉴가 있으면 동일하게 click → screenshot + snapshot. **최대 depth 3**까지. depth 3 초과 구간은 "depth 3+"로만 표기.

### Step 5: 종료 및 인덱스 갱신

- `[browser_unlock]`
- `research/screen/_index.md`에 이 서비스의 네비게이션 스크린샷 항목 추가 (파일명, 페이지=nav, 섹션, 설명, 캡처일).

## 출력

아래 JSON 구조로 반환한다. `gnb_items`는 트리 형태(children)로, `screenshots`는 실제 저장한 파일 목록이다.

```json
{
  "service_name": "서비스명",
  "url": "https://...",
  "gnb_items": [
    {
      "label": "Products",
      "url": "/products",
      "depth": 1,
      "children": [
        {
          "label": "Email Marketing",
          "url": "/products/email",
          "depth": 2,
          "children": []
        }
      ]
    }
  ],
  "max_depth": 2,
  "total_menu_items": 15,
  "notes": "",
  "screenshots": [
    {
      "id": "nav_gnb_default",
      "path": "research/screen/{service_slug}/nav_gnb_default.png",
      "description": "GNB 기본 상태"
    },
    {
      "id": "nav_gnb_products_expanded",
      "path": "research/screen/{service_slug}/nav_gnb_products_expanded.png",
      "description": "Products 메뉴 펼친 상태"
    }
  ]
}
```

## 참고

- GNB를 찾기 어렵거나 헤더가 다른 구조면 `notes`에 상황을 기록한다.
- 후속 단계에서 crawl-page의 `internal_links`와 이 스킬의 `gnb_items`를 함께 사용해 기능 소개 페이지 URL을 결정한다.
