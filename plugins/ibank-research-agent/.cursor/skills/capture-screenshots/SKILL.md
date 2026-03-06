---
name: capture-screenshots
description: Captures section-by-section screenshots for UX/UI·layout·design analysis. Uses cursor-ide-browser (browser_navigate, browser_take_screenshot, browser_scroll). Complements crawl-page (which yields markdown/snapshot text only); screenshots are the primary visual input for layout, typography, and design comparison. Use when UXUI Scout collects main/features/demo/use_cases; save to research/screen/{slug}/. Required for any UX/UI or design-focused benchmarking.
---

# capture-screenshots

UXUI-Scout 소속. 페이지를 스크롤하며 **섹션별 스크린샷**을 캡처하고 `research/screen/{service_slug}/`에 저장한다.

## 역할: UX/UI·레이아웃·디자인 분석용 시각 자료

- **crawl-page**는 텍스트(마크다운) 또는 브라우저 스냅샷(구조 텍스트)만 제공한다. **원본 HTML·실제 렌더링된 시각(색상, 타이포, 레이아웃, 여백, CTA 배치 등)** 은 수집하지 않는다.
- **이 스킬(capture-screenshots)** 이 그 공백을 채운다. 스크롤하며 섹션별로 캡처한 이미지는 **UXUI Analyzer**가 레이아웃 유형, 시각적 톤, 디자인 패턴, 브랜드 톤앤매너 비교에 사용한다.
- 따라서 **UX/UI·레이아웃·디자인 요소 분석이 목적인 벤치마킹**에서는 이 스킬을 **메인·기능 페이지에 필수**로 수행한다. 생략하면 시각 비교가 불가능하다.

## 입력

- **url**: 캡처할 페이지 URL
- **page_type**: `"main"` 또는 도메인별 핵심 페이지 식별자 (예: features, demo, use_cases, product, catalog, cart, brand, campaign 등)
- **service_slug**: 서비스 슬러그 (파일 저장용)

## 가드레일

1. **반드시 cursor-ide-browser를 사용**한다.
2. **페이지 전체를 한 장으로 캡처하지 않는다.** 스크롤하며 섹션별로 캡처한다. (한 장만 있으면 레이아웃·섹션 구성·디자인 요소 비교가 불가능하다.)
3. **메인 페이지**는 최소 4개 섹션(hero, features_summary, cta, footer)을 캡처한다. — 레이아웃·히어로 구성·CTA 배치·푸터 스타일 분석에 필요.
4. **기능 페이지**는 최소 2개 섹션(hero, detail)을 캡처한다. 카드 그리드·리스트·타이포 등 디자인 패턴 분석에 사용.
5. 각 스크린샷의 **description을 반드시 기록**한다. (UXUI Analyzer가 "어떤 영역"인지 참조할 때 사용.)
6. 파일 저장 경로: `research/screen/{service_slug}/{page_type}_{section}.png`
7. 동일 page_type에 같은 section이 여러 장이면 `_01`, `_02`로 순번을 붙인다.
8. `research/screen/_index.md`를 갱신한다.
9. **cursor-ide-browser의 `browser_take_screenshot`은 filename에 절대 경로를 줘도 실제로는 임시 폴더에 저장한다.** 캡처 후 반드시 아래 "Step 4.5"에 따라 저장된 파일을 워크스페이스 `research/screen/{service_slug}/`로 복사한다.
10. **UX/UI·디자인 분석이 목적인 수집**에서는 메인·기능 페이지에 대해 이 스킬을 **생략하지 않는다.** crawl-page만으로는 시각적 레이아웃/디자인 분석이 불가능하다.

## 실행 절차

### Step 1: 페이지 이동

- `[browser_navigate]` url
- `[browser_lock]`

### Step 2: 상단 영역 캡처 (Hero)

- `[browser_take_screenshot]` (cursor-ide-browser) — filename에 워크스페이스 절대 경로 또는 `research/screen/{service_slug}/{page_type}_hero.png` 사용
- 반환된 **"Saved to:"** 경로의 파일을 워크스페이스 `research/screen/{service_slug}/{page_type}_hero.png`로 **복사** (Step 4.5 참고)
- description: "{page_type} 페이지 Hero/상단 영역"

### Step 3: 스크롤하며 중간·하단 영역 캡처

- `[browser_scroll]` direction=down
- `[browser_snapshot]` → 현재 영역 콘텐츠 유형 파악 후 섹션명 결정
- `[browser_take_screenshot]` → filename: `research/screen/{service_slug}/{page_type}_{section}.png`
- 각 캡처 후 반환된 **"Saved to:"** 경로의 파일을 워크스페이스 동일 경로로 **복사** (Step 4.5 참고)

콘텐츠가 계속되면 반복. page_type별 섹션 가이드:

**main**
- hero, features_summary, social_proof, cta, footer

**features**
- hero, detail_01 … detail_05 (최대 5장), summary(있을 경우)

**demo**
- overview, step_01 … step_03 (최대 3장)

**use_cases**
- hero, case_01, case_02 (최대 2장)

### Step 4: 하단까지 캡처 후 종료

- 더 이상 스크롤 불가 시 캡처 종료.
- main인 경우 footer가 캡처되었는지 확인.
- `[browser_unlock]`

### Step 4.5: 워크스페이스로 복사 (필수)

`browser_take_screenshot`은 실제로 **임시 폴더**(예: `$TMP/cursor/screenshots/` 또는 응답의 "Saved to:" 경로)에 저장한다. 워크스페이스에는 자동으로 저장되지 않으므로 **반드시 수동 복사**한다.

- **캡처한 각 파일에 대해:** 도구 응답에 포함된 **"Saved to: \<경로\>"** 의 파일을 워크스페이스 `research/screen/{service_slug}/` 로 같은 파일명으로 복사한다.
- **명령 예시 (터미널):**
  - 단일: `cp "{Saved to 경로}" "{workspace}/research/screen/{service_slug}/{파일명}.png"`
  - 일괄(해당 페이지 캡처가 끝난 뒤): 임시 폴더 내 `.../research/screen/{service_slug}/*.png` 를 워크스페이스 `research/screen/{service_slug}/` 로 복사.
- **확인:** `research/screen/{service_slug}/` 아래에 `*.png` 파일이 존재하는지 확인한 뒤 Step 5로 진행한다.

### Step 5: 인덱스 갱신

- `research/screen/_index.md`에 이번에 캡처한 스크린샷 항목 추가 (파일명, page_type, section, description, 캡처일).

## 출력

아래 JSON 구조로 반환한다. `screenshots`는 실제 저장한 파일 목록이다.

```json
{
  "page_type": "main",
  "url": "https://...",
  "service_slug": "example-service",
  "screenshots": [
    {
      "id": "main_hero",
      "section": "hero",
      "path": "research/screen/example-service/main_hero.png",
      "description": "메인 페이지 Hero 영역 — 헤드라인 + CTA"
    },
    {
      "id": "main_features_summary",
      "section": "features_summary",
      "path": "research/screen/example-service/main_features_summary.png",
      "description": "메인 페이지 기능 요약 — 4개 기능 카드"
    }
  ],
  "total_screenshots": 5
}
```

## crawl-page 스킬과의 역할 분담

| 목적 | crawl-page | capture-screenshots (본 스킬) |
|------|------------|-------------------------------|
| 텍스트·카피·기능 문구 | 마크다운(.md) 또는 스냅샷 텍스트 | — |
| 정보 구조·DOM 계층 | 브라우저 사용 시 _snapshot.txt | — |
| **레이아웃·시각 구성** | 수집 불가 | **섹션별 스크린샷** |
| **색상·타이포·디자인 톤** | 수집 불가 | **섹션별 스크린샷** |
| CTA/버튼 배치·비주얼 히어로 | 수집 불가 | **섹션별 스크린샷** |

→ UX/UI·디자인 벤치마킹에서는 **두 스킬 모두** 수행해야 한다. crawl-page만 하면 "텍스트+구조"만 있고, 시각 비교는 불가능하다.

## 참고

- 스크롤 후 짧게 대기(1~2초)한 뒤 snapshot/screenshot 하면 로딩된 영역을 안정적으로 캡처할 수 있다.
- **build-uxui-comparison**·UXUI Analyzer가 이 스킬의 `screenshots[].id`·`path`를 참조하여 레이아웃 유형, 시각적 톤, 디자인 패턴을 분석한다.
- **저장 위치:** cursor-ide-browser는 스크린샷을 워크스페이스가 아닌 임시 디렉터리에 저장하므로, Step 4.5 복사 없이면 `research/screen/` 아래에 파일이 생기지 않는다. 복사 단계를 생략하지 않는다.
