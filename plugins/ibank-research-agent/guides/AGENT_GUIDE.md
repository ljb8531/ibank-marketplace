# 벤치마킹 리서치 에이전틱 플로우 상세 설계 v4.0

**작성일**: 2026-03-04
**변경 사항**: v3.0 대비 중간 산출물 관리 체계 추가, 스크린샷 기반 시각 분석 강화. browser_snapshot을 활용한 시각 정보 수집을 스킬·에이전트 전반에 반영, 중간 산출물(스크린샷, HTML, 검토 문서) 저장 경로 및 네이밍 규칙 정의, UXUI Analyzer의 시각 분석 역할 확대.
**실행 환경**: Cursor IDE
**전제**: 사람이 프로젝트 브리프를 제공하면, 에이전트들이 벤치마킹 리서치를 수행하고, 사람에게 판단을 요청하는 것으로 끝난다.

---

## 1. 실행 환경과 사용 가능한 도구

### 1.1 Cursor IDE 제공 도구

| 도구 | 용도 | 특징 |
|---|---|---|
| **WebSearch** | 키워드 기반 웹 검색 | 실시간 검색, 검색 결과 URL + 스니펫 반환 |
| **mcp_web_fetch** | URL → 마크다운 텍스트 수집 | 정적 HTML 페이지 수집, 빠르고 단순, JS 렌더링 미지원. **반환값은 마크다운이라 원본 DOM/레이아웃 분석에는 사용 불가.** |
| **cursor-ide-browser** | 브라우저 자동화 | JS 렌더링 지원, DOM 스냅샷, 클릭/입력 등 상호작용 가능, **스크린샷 캡처** 가능 |

### 1.2 도구 선택 기준

```
페이지 수집이 필요할 때:

  정적 HTML 페이지인가? (블로그, 문서, 비교 글 등)
    → mcp_web_fetch (빠름)

  SPA/JS 렌더링이 필요한가? (대부분의 SaaS 서비스 홈페이지)
    → cursor-ide-browser (browser_navigate → browser_snapshot)

  시각적 레이아웃·디자인 정보가 필요한가?
    → cursor-ide-browser (browser_navigate → browser_screenshot)

  판단이 안 되면?
    → mcp_web_fetch 먼저 시도 → 콘텐츠가 빈약하면 cursor-ide-browser로 재시도
```

### 1.3 cursor-ide-browser 사용 패턴

```
[기본 페이지 수집]
  browser_navigate(url)
  → browser_lock()
  → browser_snapshot()    ← 페이지 구조·텍스트 수집
  → browser_unlock()

[시각 정보 수집 — 스크린샷 캡처]
  browser_navigate(url)
  → browser_lock()
  → browser_screenshot()  ← 현재 뷰포트의 시각적 캡처 → 파일 저장
  → browser_snapshot()    ← 텍스트/DOM 구조 병행 수집
  → browser_unlock()

[전체 페이지 시각 수집 — 스크롤 순회]
  browser_navigate(url)
  → browser_lock()
  → browser_screenshot()  ← 상단 영역 캡처
  → browser_scroll_down()
  → browser_screenshot()  ← 중단 영역 캡처
  → browser_scroll_down()
  → browser_screenshot()  ← 하단 영역 캡처
  → browser_snapshot()    ← 텍스트 병행 수집
  → browser_unlock()

[네비게이션 구조 탐색]
  browser_navigate(url)
  → browser_lock()
  → browser_snapshot()    ← GNB, 메뉴 구조 파악
  → browser_screenshot()  ← GNB 시각 구조 캡처
  → browser_click(메뉴)   ← 서브메뉴 펼치기
  → browser_screenshot()  ← 펼쳐진 메뉴 시각 구조 캡처
  → browser_snapshot()    ← 펼쳐진 메뉴 텍스트 구조 수집
  → browser_unlock()

[페이지 내 특정 정보 찾기]
  browser_navigate(url)
  → browser_lock()
  → browser_search("Features")  ← 기능 섹션 위치 탐색
  → browser_screenshot()  ← 해당 섹션 시각 캡처
  → browser_snapshot()
  → browser_unlock()
```

---

## 2. 에이전트-스킬 아키텍처

### 2.1 설계 원칙

에이전트와 스킬의 역할을 명확히 구분한다.

```
에이전트 = 판단 + 오케스트레이션
  "무엇을 해야 하는가", "결과가 충분한가", "다음에 무엇을 할 것인가"

스킬 = 절차 실행 + 가드레일
  "정해진 절차를 일관되게 수행한다", "빠뜨리지 않는다", "기준을 흔들지 않는다"
```

에이전트는 스킬을 호출하고, 스킬의 결과를 판단하여 다음 행동을 결정한다. 스킬은 판단하지 않는다. 절차를 수행하고 결과를 반환할 뿐이다.

### 2.2 스킬을 만든 기준

| 기준 | 해당 스킬 |
|---|---|
| 반복되는 도구 사용 패턴에 가드레일이 필요 | search-services, crawl-page, scan-navigation, capture-screenshots, **capture-dom**, **capture-google** |
| 대량 데이터의 일관된 비교 기준 유지 필요 | build-feature-matrix, build-uxui-comparison |

### 2.3 아키텍처 전체 구조

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        Orchestrator (메인 에이전트)                                     │
│                판단 + 서브 에이전트 호출 + 결과 검증 + 머지                              │
└──┬────────────┬────────────┬────────────┬──────────────┬──────────────┬───────────────┘
   │            │            │            │              │              │
   ▼            ▼            ▼            ▼              ▼              ▼
┌──────────┐ ┌────────────┐ ┌──────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐
│Service   │ │UXUI Scout  │ │Web Scout │ │Feature      │ │UXUI         │ │Report    │
│Scout     │ │            │ │          │ │Analyzer     │ │Analyzer     │ │Writer    │
│[기능수집] │ │[UX/UI수집] │ │[역방향   │ │[기능 분석]  │ │[UXUI 분석]  │ │[종합]    │
│·검색·크롤 │ │·GNB·캡처  │ │ 웹수집]  │ │·기능 추출   │ │·시각·IA분석 │ │·리포트   │
│·프로필   │ │·DOM 저장   │ │·기사·리뷰│ │·매트릭스    │ │·비교표      │ │          │
│[스킬]    │ │[스킬]      │ │·참고이미지│ │[스킬]       │ │[스킬]       │ │[스킬]    │
│▸search-  │ │▸scan-      │ │[스킬]    │ │▸build-      │ │▸build-uxui- │ │ 없음     │
│ services │ │ navigation │ │▸capture- │ │ feature-    │ │ comparison  │ │          │
│▸crawl-   │ │▸capture-   │ │ google   │ │ matrix      │ │             │ │          │
│ page     │ │ screenshots │ │          │ │             │ │             │ │          │
│          │ │▸capture-dom│ │          │ │             │ │             │ │          │
└──────────┘ └────────────┘ └──────────┘ └─────────────┘ └─────────────┘ └──────────┘
```

---

## 3. 에이전트 간 역할 경계

### 3.1 핵심 원칙

```
Service Scout     = 탐색 + 기능 분석용 콘텐츠 수집 (검색, 페이지 크롤)
UXUI Scout        = UX/UI·디자인 분석용 수집 (GNB, 스크린샷, DOM 구조)
Web Scout         = 역방향 웹 수집 (서비스에 대한 기사·리뷰·후기·참고 이미지 검색·수집, capture-google)
Feature Analyzer  = 기능 분석 (수집된 콘텐츠만으로 분석)
UXUI Analyzer     = UXUI 분석 (수집된 스크린샷·DOM·GNB만으로 분석)
Report Writer     = 종합 정리 (분석 결과 + 웹 수집 자료 인용을 리포트로 만든다)
```

### 3.2 역할 경계 매트릭스

| 작업 | Service Scout | UXUI Scout | Web Scout | Feature Analyzer | UXUI Analyzer | Report Writer |
|---|---|---|---|---|---|---|
| 웹 검색으로 서비스 찾기 | **●** (search-services) | ✕ | ✕ | ✕ | ✕ | ✕ |
| 서비스 페이지 크롤링 | **●** (crawl-page) | ✕ | ✕ | ✕ | ✕ | ✕ |
| 네비게이션 구조 수집 | ✕ | **●** (scan-navigation) | ✕ | ✕ | ✕ | ✕ |
| 페이지 스크린샷 캡처 | ✕ | **●** (capture-screenshots) | ✕ | ✕ | ✕ | ✕ |
| 페이지 DOM/구조 저장 | ✕ | **●** (capture-dom) | ✕ | ✕ | ✕ | ✕ |
| 역방향 웹 검색(기사·리뷰·후기) | ✕ | ✕ | **●** (capture-google) | ✕ | ✕ | ✕ |
| 참고 이미지 검색·캡처 | ✕ | ✕ | **●** (capture-google) | ✕ | ✕ | ✕ |
| 콘텐츠(.md) 저장 | **●** (crawl-page) | ✕ | **●** (기사/리뷰 본문) | ✕ | ✕ | ✕ |
| 추가 페이지 크롤링 | **●** (collect_additional) | ✕ | ✕ | ✕ | ✕ | ✕ |
| 추가 스크린샷·DOM 수집 | ✕ | **●** (collect_additional_uxui) | ✕ | ✕ | ✕ | ✕ |
| 추가 웹 역방향 수집 | ✕ | ✕ | **●** (collect_additional_web) | ✕ | ✕ | ✕ |
| 서비스 기본 프로필 정리 | **●** (에이전트 판단) | ✕ | ✕ | ✕ | ✕ | ✕ |
| 기능 목록 추출·분류 | ✕ | ✕ | ✕ | **●** (에이전트 판단) | ✕ | ✕ |
| 기능 비교 매트릭스 생성 | ✕ | ✕ | ✕ | **●** (build-feature-matrix) | ✕ | ✕ |
| 네비게이션·IA·시각 분석 | ✕ | ✕ | ✕ | ✕ | **●** (에이전트 판단) | ✕ |
| UXUI 비교표 생성 | ✕ | ✕ | ✕ | ✕ | **●** (build-uxui-comparison) | ✕ |
| 기능+UXUI+참고자료 종합 리포트 | ✕ | ✕ | ✕ | ✕ | ✕ | **●** (에이전트 판단) |
| 사람에게 판단 요청 사항 정리 | ✕ | ✕ | ✕ | ✕ | ✕ | **●** (에이전트 판단) |

**핵심 규칙**: Feature Analyzer와 UXUI Analyzer는 직접 크롤링·캡처하지 않는다. Service Scout이 수집한 콘텐츠, UXUI Scout이 수집한 GNB·스크린샷·DOM, Web Scout이 수집한 기사·리뷰·참고 이미지만으로 분석·리포트한다. 데이터가 부족하면 Orchestrator가 Service Scout(collect_additional), UXUI Scout(collect_additional_uxui), Web Scout(collect_additional_web)를 재호출한 뒤 다시 분석을 요청한다.

---

## 4. 에이전트 간 데이터 인터페이스

스킬 기반 구조에서는 에이전트 간 전달되는 데이터의 형식이 명확해야 합니다. 각 에이전트의 출력이 다음 에이전트의 입력과 정확히 맞물리도록 인터페이스를 정의합니다.

### 4.1 Orchestrator → Service Scout

```
{
  "command": "search_and_collect" | "collect_additional",
  "brief_summary": {
    "domain": "서비스 도메인",
    "keywords": ["키워드1", "키워드2", ...],
    "scope": "국내" | "해외" | "전체",
    "must_include": ["서비스A", "서비스B"],
    "focus_areas": ["AI 자동화", "캠페인 관리"],
    "exclude": ["제외할 범위"]
  },
  // collect_additional일 경우에만 포함
  "additional_targets": [
    {
      "service_name": "Klaviyo",
      "url": "https://www.klaviyo.com",
      "needed_pages": ["features"],
      "needed_screenshots": ["features_hero", "features_detail"],
      "reason": "Feature Analyzer가 기능 페이지 데이터 부족 보고"
    }
  ]
}
```

### 4.1b Orchestrator → UXUI Scout

Service Scout 수집 완료 후, 동일한 services 목록(이름, url, service_slug, 수집된 페이지 URL 등)을 전달한다.

```
{
  "command": "collect_uxui" | "collect_additional_uxui",
  "services": [ /* Service Scout이 반환한 서비스 배열 */ ],
  // collect_additional_uxui일 경우
  "additional_targets": [ { "service_slug", "needed_screenshots", "needed_dom_pages" } ]
}
```

### 4.1c Orchestrator → Web Scout

Service Scout 수집 완료 후, **동일한 services 목록**을 전달한다. 서비스 공식 페이지가 아닌, 해당 서비스에 대한 기사·리뷰·후기·참고 이미지를 역방향 웹 검색으로 수집한다.

```
{
  "command": "collect_web" | "collect_additional_web",
  "services": [ /* Service Scout이 반환한 서비스 배열 */ ],
  // collect_additional_web일 경우
  "additional_targets": [ { "service_slug", "queries": ["쿼리1", "쿼리2"], "image_search": true } ]
}
```

### 4.2 Service Scout + UXUI Scout + Web Scout → Orchestrator (머지 후 Feature Analyzer, UXUI Analyzer, Report Writer에 전달)

```
{
  "status": "complete" | "partial",
  "service_count": 12,
  "services": [
    {
      "name": "서비스명",
      "url": "https://...",
      "category": "마케팅 자동화",
      "target_users": "중소기업 마케터",
      "brief": "한 줄 소개",
      "source": "직접 검색 | 비교 글 추출 | must_include 지정",
      "navigation": {
        // scan-navigation 스킬 출력
        "gnb_items": [...],
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
      },
      "pages": [
        {
          // crawl-page 스킬 출력
          "url": "https://...",
          "page_type": "main",
          "status": "success",
          "method": "mcp_web_fetch",
          "content": "수집된 텍스트...",
          "content_length": 12500,
          "internal_links": [...],
          "html_path": "research/html/{service_slug}/main.html"
        },
        {
          "url": "https://.../features",
          "page_type": "features",
          "status": "success",
          "method": "cursor-ide-browser",
          "content": "수집된 텍스트...",
          "content_length": 8300,
          "internal_links": [...],
          "html_path": "research/html/{service_slug}/features.html"
        }
        // ... 페이지별
      ],
      "screenshots": [
        {
          // capture-screenshots 스킬 출력
          "id": "main_hero",
          "page_type": "main",
          "section": "hero",
          "path": "research/screen/{service_slug}/main_hero.png",
          "description": "메인 페이지 Hero 영역"
        },
        {
          "id": "main_features_summary",
          "page_type": "main",
          "section": "features_summary",
          "path": "research/screen/{service_slug}/main_features_summary.png",
          "description": "메인 페이지 기능 요약 영역"
        },
        {
          "id": "main_cta",
          "page_type": "main",
          "section": "cta",
          "path": "research/screen/{service_slug}/main_cta.png",
          "description": "메인 페이지 CTA 영역"
        },
        {
          "id": "main_footer",
          "page_type": "main",
          "section": "footer",
          "path": "research/screen/{service_slug}/main_footer.png",
          "description": "메인 페이지 Footer 영역"
        },
        {
          "id": "features_hero",
          "page_type": "features",
          "section": "hero",
          "path": "research/screen/{service_slug}/features_hero.png",
          "description": "기능 페이지 상단 영역"
        }
        // ... 섹션별
      ],
      "dom_paths": [
        // capture-dom 스킬 출력 (UXUI Scout). 디자인 분석용 페이지 구조
        { "page_type": "main", "path": "research/dom/{service_slug}/main_dom.txt" },
        { "page_type": "features", "path": "research/dom/{service_slug}/features_dom.txt" }
      ],
      "web_sources": [
        // capture-google 스킬 출력 (Web Scout). 기사·리뷰·후기·참고 이미지
        { "url": "https://...", "title": "기사 제목", "content_path": "research/web/{service_slug}/articles/...", "type": "article" },
        { "path": "research/web/{service_slug}/images/img_01.png", "type": "image" }
      ]
    }
    // ... 서비스별. navigation·screenshots·dom_paths는 UXUI Scout, pages는 Service Scout, web_sources는 Web Scout 결과.
  ],
  "search_log": ["검색 수행 기록"],
  "collection_failures": [
    {
      "service_name": "서비스명",
      "page_type": "demo",
      "url": "https://...",
      "fail_reason": "403 차단"
    }
  ],
  "artifacts": {
    "screen_dir": "research/screen/",
    "html_dir": "research/html/",
    "total_screenshots": 48,
    "total_html_files": 28
  }
}
```

### 4.3 Feature Analyzer → Orchestrator (→ Report Writer에 전달)

```
{
  "status": "complete" | "data_insufficient",
  "feature_analysis": {
    "by_service": {
      "서비스명": {
        "핵심 기능": [
          {"name": "기능명", "description": "설명", "user_value": "가치", "level": "고급"}
        ],
        "AI/지능형 기능": [...],
        // 카테고리별
      }
    },
    "feature_matrix": {
      // build-feature-matrix 스킬 출력
      "matrix": {...},
      "evidence": {...},
      "statistics": {
        "total_features": 35,
        "must_have": ["기능 목록"],
        "differentiators": ["기능 목록"],
        "unknown": ["서비스×기능 목록"]
      }
    },
    "insights": {
      "must_have_features": [...],
      "differentiation_features": [...],
      "gap_areas": [...]
    }
  },
  // data_insufficient일 경우에만 포함
  "data_needs": [
    {
      "service_name": "Klaviyo",
      "needed_info": "기능 상세 목록",
      "suggested_page": "https://www.klaviyo.com/features",
      "reason": "기능 페이지 수집 실패로 핵심 기능 파악 불가"
    }
  ],
  "temp_artifacts": [
    {
      "path": "research/temp/feature-extraction-notes.md",
      "description": "기능 추출 과정 중 판단 근거 메모"
    }
  ]
}
```

### 4.4 UXUI Analyzer → Orchestrator (→ Report Writer에 전달)

```
{
  "status": "complete" | "data_insufficient",
  "uxui_analysis": {
    "by_service": {
      "서비스명": {
        "information_architecture": {...},
        "user_flow": {...},
        "content_strategy": {...},
        "interaction_patterns": {...},
        "tone_and_manner": {...},
        "visual_design": {
          "layout_pattern": "설명",
          "color_impression": "설명",
          "visual_hierarchy": "설명",
          "screenshot_references": ["main_hero", "main_features_summary"]
        }
      }
    },
    "comparison": {
      // build-uxui-comparison 스킬 출력
      "quantitative": {...},
      "qualitative": {...},
      "visual": {
        "layout_comparison": {...},
        "visual_style_comparison": {...}
      },
      "patterns": {
        "common": [...],
        "differentiating": [...]
      }
    },
    "trends": [...],
    "insights": [...]
  },
  "data_needs": [...],
  "visual_verification_needed": [
    {
      "service_name": "HubSpot",
      "items": ["대시보드 레이아웃", "이메일 에디터 UI"],
      "reason": "로그인 후 화면으로 공개 페이지에서 확인 불가"
    }
  ],
  "temp_artifacts": [
    {
      "path": "research/temp/uxui-visual-notes.md",
      "description": "시각 분석 과정 중 스크린샷 해석 메모"
    }
  ]
}
```

### 4.5 Report Writer → Orchestrator (→ 사람에게 전달)

```
{
  "report": "마크다운 형식의 종합 리포트 전문",
  "meta": {
    "services_analyzed": 12,
    "features_compared": 35,
    "screenshots_referenced": 24,
    "key_findings_count": 5,
    "decision_points": ["판단이 필요한 사항 목록"],
    "visual_checks": ["시각적 확인 필요 항목"],
    "limitations": ["분석 한계 목록"],
    "suggested_next_steps": ["추가 리서치 제안"]
  }
}
```

---

## 5. 중간 산출물 관리 체계

### 5.1 디렉토리 구조

```
root/
├── research/
│   ├── screen/                        ← 스크린샷 이미지
│   │   ├── {service_slug}/            ← 서비스별 폴더
│   │   │   ├── main_hero.png
│   │   │   ├── main_features_summary.png
│   │   │   ├── main_cta.png
│   │   │   ├── main_footer.png
│   │   │   ├── features_hero.png
│   │   │   ├── features_detail_01.png
│   │   │   ├── features_detail_02.png
│   │   │   ├── demo_overview.png
│   │   │   ├── nav_gnb_default.png
│   │   │   └── nav_gnb_{menu}_expanded.png
│   │   └── _index.md                 ← 전체 스크린샷 인덱스
│   │
│   ├── html/                          ← 페이지 HTML 원본
│   │   ├── {service_slug}/
│   │   │   ├── main.md
│   │   │   ├── main_snapshot.txt   (브라우저 사용 시)
│   │   │   ├── features.md
│   │   │   ├── features_snapshot.txt
│   │   │   ├── demo.md
│   │   │   └── use_cases.md
│   │   └── _index.md                 ← 전체 HTML 파일 인덱스
│   │
│   └── temp/                          ← 과정 중 검토 문서
│       ├── search-log.md              ← 검색 수행 기록 (search-services)
│       ├── crawl-log.md               ← 수집 수행 기록 (crawl-page)
│       ├── feature-extraction-notes.md ← 기능 추출 판단 근거 메모
│       ├── uxui-visual-notes.md       ← 시각 분석 해석 메모
│       └── orchestrator-decisions.md  ← Orchestrator 판단 기록
│
├── report/
│   └── research/
│       ├── brief.md
│       ├── service-list.md
│       ├── feature-analysis.md
│       ├── uxui-analysis.md
│       ├── benchmark-report.md
│       └── feedback/
│           ├── feedback-01.md
│           └── approved.md
```

### 5.2 네이밍 규칙

**service_slug**: 서비스명을 소문자 영문, 하이픈 구분으로 변환한다. 예: "HubSpot" → `hubspot`, "Salesforce Marketing Cloud" → `salesforce-marketing-cloud`, "스티비" → `stibee`

**스크린샷 파일명**: `{page_type}_{section}_{순번(선택)}.png`

| page_type | section 예시 | 파일명 예시 |
|---|---|---|
| main | hero, features_summary, cta, social_proof, footer | `main_hero.png` |
| features | hero, detail_01, detail_02, ... | `features_detail_01.png` |
| demo | overview, step_01, step_02, ... | `demo_overview.png` |
| use_cases | hero, case_01, case_02, ... | `use_cases_case_01.png` |
| nav | gnb_default, gnb_{menu}_expanded | `nav_gnb_products_expanded.png` |

**콘텐츠 파일명**: `{page_type}.md`, 구조용 `{page_type}_snapshot.txt`(브라우저 사용 시)

### 5.3 인덱스 파일

각 중간 산출물 디렉토리에 `_index.md`를 유지한다. 이 파일은 스킬이 파일을 저장할 때마다 자동으로 갱신한다.

**research/screen/_index.md 형식**:
```markdown
# 스크린샷 인덱스

## hubspot (HubSpot)
| 파일명 | 페이지 | 섹션 | 설명 | 캡처일 |
|--------|--------|------|------|--------|
| main_hero.png | main | hero | 메인 페이지 Hero 영역 | 2026-03-04 |
| main_features_summary.png | main | features_summary | 기능 요약 영역 | 2026-03-04 |
...

## mailchimp (Mailchimp)
...
```

**research/html/_index.md 형식**:
```markdown
# HTML 파일 인덱스

## hubspot (HubSpot)
| 파일명 | 페이지 | URL | 수집 방법 | 수집일 |
|--------|--------|-----|----------|--------|
| main.md | main | https://www.hubspot.com | mcp_web_fetch | 2026-03-04 |
...
```

### 5.4 산출물 생성 시점

| 산출물 | 생성 주체 | 생성 시점 |
|---|---|---|
| `research/html/{slug}/*.md`, `*_snapshot.txt` | Service Scout → crawl-page 스킬 | 각 페이지 수집 시 |
| `research/temp/search-log.md` | Service Scout → search-services 스킬 | 검색 수행 시 |
| `research/temp/crawl-log.md` | Service Scout → crawl-page 스킬 | 수집 수행 시 |
| `research/screen/{slug}/*.png` | UXUI Scout → capture-screenshots 스킬 | 각 서비스 페이지 UX 수집 시 |
| `research/screen/{slug}/nav_*.png` | UXUI Scout → scan-navigation 스킬 | 네비게이션 수집 시 |
| `research/dom/{slug}/*_dom.txt` | UXUI Scout → capture-dom 스킬 | 디자인 분석용 구조 저장 시 |
| `research/screen/_index.md` | UXUI Scout (파일 저장 시 갱신) | 스크린샷 저장 시마다 |
| `research/dom/_index.md` | UXUI Scout (파일 저장 시 갱신) | DOM 저장 시마다 |
| `research/html/_index.md` | Service Scout (파일 저장 시 갱신) | HTML 저장 시마다 |
| `research/web/{slug}/articles/*.md` | Web Scout → capture-google 스킬 | 기사·리뷰·후기 본문 수집 시 |
| `research/web/{slug}/images/*.png` | Web Scout → capture-google 스킬 | 이미지 검색 캡처 시 |
| `research/web/_index.md` | Web Scout (파일 저장 시 갱신) | 웹 수집 저장 시마다 |
| `research/temp/web-scout-log.md` | Web Scout → capture-google 스킬 | 역방향 검색·수집 시 |
| `research/temp/feature-extraction-notes.md` | Feature Analyzer | 기능 추출 판단 시 |
| `research/temp/uxui-visual-notes.md` | UXUI Analyzer | 시각 분석 수행 시 |
| `research/temp/orchestrator-decisions.md` | Orchestrator | 재호출 판단 시 |

---

## 6. 서브 에이전트 상세 정의

### 6.1 Orchestrator (메인 에이전트)

```
역할: Flow 전체를 제어한다.
      브리프를 분석하여 검색 키워드와 탐색 범위를 결정하고,
      서브 에이전트를 순서대로 호출하며,
      최종 산출물을 취합하여 사람에게 전달한다.
      모든 판단 과정을 research/temp/orchestrator-decisions.md에 기록한다.

사용 도구: 없음 (서브 에이전트 호출만)
스킬: 없음

실행 순서:
  1. 브리프 분석 — 프로젝트 도메인, 핵심 키워드, 타겟 사용자, 
     경쟁 범위를 추출한다.
  2. 디렉토리 초기화 — research/screen/, research/html/, research/dom/, research/web/, research/temp/ 
     디렉토리가 없으면 생성한다.
  3. Service Scout 호출 (command: search_and_collect)
     — 유사 서비스 목록과 페이지 콘텐츠(기능 분석용)를 확보한다.
  4. Service Scout 결과를 검토한다:
     a. service_count가 7 미만 → 키워드를 변경하여 Service Scout 재호출
     b. must_include 서비스가 결과에 없음 → 해당 서비스 지정하여 재호출
     c. collection_failures가 있음 → 심각도 판단 후 재수집 여부 결정
  5. UXUI Scout 호출 (command: collect_uxui)
     — 동일 services 목록으로 GNB·스크린샷·DOM 수집.
  6. Web Scout 호출 (command: collect_web)
     — 동일 services 목록으로 역방향 웹 검색(기사·리뷰·후기·참고 이미지) 수집.
  7. Service Scout + UXUI Scout + Web Scout 결과를 서비스별로 머지하여 통합 services 배열을 만든다.
  8. Feature Analyzer 결과를 검토한다:
     a. status가 "data_insufficient" → data_needs를 확인하여
        Service Scout (collect_additional) 또는 UXUI Scout (collect_additional_uxui) 재호출 후
        Feature Analyzer 재호출
     b. status가 "complete" → 다음 단계 진행
  9. UXUI Analyzer 호출 — 통합 services(스크린샷·DOM 경로 포함)를 전달한다.
  10. UXUI Analyzer 결과를 검토한다:
     a. status가 "data_insufficient" → needed_screenshots 등으로
        UXUI Scout (collect_additional_uxui) 재호출 후 UXUI Analyzer 재호출
     b. status가 "complete" → 다음 단계 진행
  11. Report Writer 호출 — 기능 분석 + UXUI 분석 결과 + Web Scout 수집 자료(web_sources) + 브리프를 전달
  12. 산출물 정합성 확인 후 사람에게 전달
```

**시스템 프롬프트**:

```markdown
## 역할
너는 벤치마킹 리서치를 총괄하는 프로젝트 리서처다.
사람이 제공한 프로젝트 브리프를 분석하고, 서브 에이전트를 호출하여
벤치마킹 리서치를 수행한 뒤, 최종 리포트를 취합하여 전달한다.

## 입력
사람이 제공하는 프로젝트 브리프. 형식은 자유 텍스트이며,
다음 정보가 포함될 수 있다:
- 만들고자 하는 서비스의 설명
- 타겟 사용자
- 참고하고 싶은 서비스 (있을 경우)
- 특별히 중점적으로 분석하고 싶은 관점
- 배제할 범위

## 브리프 분석 시 추출할 항목
1. 서비스 도메인 (예: 이커머스, SaaS, 마케팅 플랫폼 등)
2. 핵심 키워드 (검색에 사용할 키워드 5~10개)
3. 타겟 사용자 유형
4. 경쟁 범위 (국내/해외/특정 시장)
5. 사람이 명시적으로 언급한 참고 서비스
6. 벤치마킹 관점 우선순위 (기능 중심 / UXUI 중심 / 균형)

## 초기화
작업 시작 시 다음 디렉토리를 확인하고 없으면 생성한다:
- research/screen/
- research/html/
- research/dom/
- research/temp/
- report/research/
- report/research/feedback/

## 판단 기록
모든 판단 과정을 research/temp/orchestrator-decisions.md에 기록한다.
기록 형식:
```
### [타임스탬프] 판단: {판단 제목}
- 상황: {현재 상황}
- 선택지: {가능한 선택지들}
- 결정: {선택한 결정}
- 근거: {결정 근거}
```

## 서브 에이전트 호출 규칙

### Service Scout
- brief_summary를 구성하여 전달한다.
- Service Scout은 내부적으로 search-services, crawl-page, 
  scan-navigation, capture-screenshots 스킬을 사용하여 
  탐색, 수집, 시각 캡처를 수행한다.
- 결과의 service_count를 확인한다:
  · 7개 미만 → keywords를 변경하거나 scope를 확장하여 재호출
  · must_include 서비스 누락 → 해당 서비스명을 keywords에 추가하여 재호출
- 결과의 collection_failures를 확인한다:
  · 기능 페이지 수집 실패가 3개 이상 → 
    additional_targets로 재수집 요청 (command: collect_additional)
  · 메인 페이지 수집 실패 → 해당 서비스를 목록에서 제외할지 재수집할지 판단
- 결과의 artifacts를 확인한다:
  · total_screenshots / service_count = 서비스당 평균 스크린샷 수
  · 평균 4장 미만이면 capture-screenshots 추가 수행 고려

### Feature Analyzer
- Service Scout의 전체 출력(services 배열)을 그대로 전달한다.
- Feature Analyzer는 크롤링을 하지 않는다. 
  내부적으로 build-feature-matrix 스킬을 사용하여 비교 매트릭스를 생성한다.
- 결과 status를 확인한다:
  · "data_insufficient" → data_needs를 확인하여 
    Service Scout에 collect_additional 명령으로 추가 수집 요청.
    추가 수집 완료 후 Feature Analyzer를 재호출한다.
  · "complete" → feature_analysis를 Report Writer 전달용으로 보관

### UXUI Analyzer
- Service Scout의 전체 출력(services 배열, screenshots 포함)을 그대로 전달한다.
- UXUI Analyzer는 크롤링을 하지 않는다.
  내부적으로 build-uxui-comparison 스킬을 사용하여 비교표를 생성한다.
- UXUI Analyzer는 스크린샷 이미지를 참조하여 시각 디자인을 분석한다.
  스크린샷이 부족하면 data_needs에 needed_screenshots를 포함하여 반환한다.
- Feature Analyzer와 동일한 방식으로 data_insufficient를 처리한다.
  이 때 needed_screenshots 항목이 있으면 Service Scout에 
  해당 스크린샷 추가 캡처를 함께 요청한다.

### Report Writer
- Feature Analyzer의 feature_analysis + UXUI Analyzer의 uxui_analysis
  + 원본 브리프를 모두 전달한다.
- Report Writer는 새로운 분석을 하지 않는다. 
  전달받은 분석을 종합 정리만 한다.
- 리포트 내에서 스크린샷을 참조할 때, 
  상대 경로(../../research/screen/{slug}/...)로 이미지를 링크한다.
- 스킬을 사용하지 않는다.

## 재호출 판단 기준

### Service Scout 재호출이 필요한 경우
1. 서비스 수 부족 (7개 미만)
2. must_include 서비스 누락
3. Feature Analyzer 또는 UXUI Analyzer가 data_needs를 반환
4. UXUI Analyzer가 needed_screenshots를 반환 (추가 스크린샷 필요)
5. 사람이 서비스 추가를 요청

### Feature Analyzer 재호출이 필요한 경우
1. Service Scout 추가 수집 후 보강된 데이터로 재분석 필요
2. 사람이 특정 관점의 심층 분석을 요청

### UXUI Analyzer 재호출이 필요한 경우
1. Service Scout 추가 수집 후 보강된 데이터로 재분석 필요
2. 추가 스크린샷 수집 완료 후 시각 분석 보강 필요
3. 사람이 UXUI 관점의 심층 분석을 요청

## 최종 산출물 체크리스트
리포트 전달 전에 다음을 확인한다:
- [ ] 분석 대상 서비스가 7개 이상인가
- [ ] 각 서비스의 기능 분석이 완료되었는가 (Feature Analyzer status: complete)
- [ ] 각 서비스의 UXUI 분석이 완료되었는가 (UXUI Analyzer status: complete)
- [ ] 기능 비교 매트릭스가 있는가 (build-feature-matrix 스킬 출력 포함)
- [ ] UXUI 비교표가 있는가 (build-uxui-comparison 스킬 출력 포함)
- [ ] 종합 시사점이 도출되었는가
- [ ] 사람이 언급한 참고 서비스가 빠지지 않았는가
- [ ] 스크린샷 인덱스(research/screen/_index.md)가 최신 상태인가
- [ ] HTML 인덱스(research/html/_index.md)가 최신 상태인가
- [ ] 중간 산출물 디렉토리(research/temp/)에 과정 기록이 있는가

## 사람에게 전달할 때
산출물과 함께 다음을 안내한다:
- 분석한 서비스 목록 요약
- 추가로 분석이 필요하다고 판단되는 영역
- 사람의 판단이 필요한 사항
- 시각적 확인이 필요한 항목 (UXUI Analyzer의 visual_verification_needed)
- 중간 산출물 안내
  · research/screen/ — 서비스별 스크린샷 {N}장
  · research/html/ — 수집 페이지 콘텐츠(.md)·스냅샷 {N}개
  · research/temp/ — 과정 기록 문서 {N}개
```

---

### 6.2 Service Scout (기능·콘텐츠 수집 전담)

```
역할: 유사 서비스를 탐색하고, 각 서비스의 기능 분석에 필요한 페이지 콘텐츠만 수집한다.
      GNB·스크린샷·DOM 수집은 하지 않는다 (UXUI Scout 담당). 분석은 하지 않는다.

사용 도구:
  - WebSearch — search-services 스킬 내에서 사용
  - mcp_web_fetch — search-services, crawl-page 스킬 내에서 사용
  - cursor-ide-browser — crawl-page 스킬에서 필요 시 사용

스킬:
  - search-services: 서비스 탐색 및 목록 확보
  - crawl-page: 단일 페이지 콘텐츠 수집 (.md + 브라우저 사용 시 스냅샷)

에이전트가 직접 하는 것 (스킬이 아닌 판단):
  - 수집 순서 결정, 기능/데모/사용사례 페이지 URL 선별 (internal_links 기반)
  - 서비스 프로필 정리 (수집된 사실만 구조화)
  - 수집 결과의 충분성 1차 판단
```

### 6.3 UXUI Scout (UX/UI·디자인 수집 전담)

```
역할: 이미 확보된 서비스 목록에 대해 UX/UI·디자인 분석에 필요한 시각·구조 자료만 수집한다.
      페이지 크롤링·서비스 검색은 하지 않는다 (Service Scout 담당). 분석은 하지 않는다.

사용 도구: cursor-ide-browser (scan-navigation, capture-screenshots, capture-dom 내에서 사용)

스킬:
  - scan-navigation: GNB 네비게이션 구조 수집 + 네비게이션 스크린샷
  - capture-screenshots: 페이지 섹션별 스크린샷 — UX/UI·레이아웃·디자인 분석용
  - capture-dom: 페이지 구조(DOM/접근성 스냅샷) 저장 — 디자인 분석용

에이전트가 직접 하는 것:
  - 수집 대상 페이지 판단 (메인·기능 필수, 데모/사용사례 선택)
  - collect_additional_uxui 시 additional_targets·needed_screenshots 처리
```

### 6.4 Web Scout (역방향 웹 수집 전담)

```
역할: Service Scout이 생성한 서비스 목록을 기준으로, 해당 서비스에 대한 역방향 웹 검색을 수행한다.
      공신력 있는 기사·블로그·사용 후기·참고 이미지를 Google 검색(브라우저)으로 수집한다.
      서비스 공식 페이지 크롤링은 하지 않는다 (Service Scout 담당). UX/UI 스크린샷은 하지 않는다 (UXUI Scout 담당). 분석은 하지 않는다.

사용 도구: cursor-ide-browser (필수), mcp_web_fetch (세부 페이지 본문 수집 시 보조)

스킬:
  - capture-google: Google 접속 → 검색어 입력 → 검색 결과에서 링크 클릭·본문 수집, 필요 시 이미지 검색·캡처

에이전트가 직접 하는 것:
  - 서비스별 역방향 검색 쿼리 결정 (예: "{서비스명} 리뷰", "사용 후기", "비교", 이미지 검색 여부)
  - collect_additional_web 시 additional_targets(service_slug, queries, image_search) 처리
```

**시스템 프롬프트**: `.cursor/agents/web-scout.md` 참조. (보유 스킬: capture-google만.)

**스킬 상세**: `.cursor/skills/capture-google/SKILL.md` 참조.

---

### 6.5 Feature Analyzer (서브 에이전트)

```
역할: Service Scout·UXUI Scout·Web Scout이 수집한 데이터(통합 services)를 바탕으로 각 서비스의 기능을 분석하고,
      서비스 간 기능 비교를 수행한다.
      직접 크롤링하지 않는다. 전달받은 수집 데이터만 분석한다.

사용 도구: 없음
스킬: build-feature-matrix (기능 비교 매트릭스 생성)

에이전트가 직접 하는 것 (스킬이 아닌 판단):
  - 수집 데이터에서 기능 추출
  - 기능 카테고리 분류
  - 기능별 상세 정리 (설명, 사용자 가치, 구현 수준)
  - 시사점 도출 (필수/차별화/공백)
  - 데이터 부족 판단
  - 분석 과정 메모를 research/temp/feature-extraction-notes.md에 기록
```

**시스템 프롬프트**:

```markdown
## 역할
너는 서비스의 기능을 분석하는 전문 분석가다.
Service Scout이 수집한 데이터를 바탕으로 각 서비스의 기능을 분석하고,
서비스 간 기능 비교를 수행한다.

## 중요한 제약
- 너는 웹 검색이나 크롤링을 하지 않는다.
- 전달받은 수집 데이터에 있는 내용만으로 분석한다.
- 수집 데이터에 없는 기능을 추측하지 않는다.
- 특정 서비스의 기능 정보가 부족하면, 분석 결과 마지막에 
  "데이터 부족 항목"(data_needs)으로 명시한다.

## 과정 기록
분석 과정에서 판단이 필요했던 사항, 애매했던 분류, 
데이터 해석의 근거 등을 research/temp/feature-extraction-notes.md에 기록한다.
기록 형식:
```
### {서비스명} — 기능 추출 메모
- {판단 사항}: {근거}
```

## 보유 스킬
너는 1개의 스킬을 사용한다.

### 스킬: build-feature-matrix
- 용도: 서비스별 기능 분석 결과를 일관된 기준의 비교 매트릭스로 변환
- 사용 시점: 분석 단계 4에서 1회 호출
- 입력: 너의 1~3단계 분석 결과 (서비스별 카테고리별 기능 목록)
- 출력: 비교 매트릭스 + 평가 근거 + 통계 요약

## 분석 단계

### 1단계: 서비스별 기능 추출 (에이전트 판단)
각 서비스의 수집 데이터(메인 페이지, 기능 페이지, 데모 페이지, 사용 사례 페이지)를
읽고, 언급된 기능들을 추출한다.

수집 데이터의 page_type별 활용:
- "main": 핵심 가치 제안에서 주요 기능 키워드 추출
- "features": 기능 목록과 상세 설명 추출 (가장 중요한 소스)
- "demo": 실제 동작하는 기능 확인, 기능 구현 수준 판단 근거
- "use_cases": 기능의 사용 맥락과 사용자 가치 추출

수집 상태가 "failed"인 페이지의 내용은 사용하지 않는다.
해당 서비스의 분석 범위가 제한됨을 기록한다.

### 2단계: 기능 분류 (에이전트 판단)
추출된 기능을 다음 카테고리로 분류한다.
카테고리는 프로젝트 도메인에 따라 유연하게 조정한다.
- 핵심 기능: 서비스의 존재 이유가 되는 주요 기능
- 사용자 관리: 회원가입, 로그인, 프로필, 권한, 팀/조직 관리
- 콘텐츠 관리: 생성, 편집, 삭제, 검색, 필터, 템플릿
- 워크플로우/자동화: 작업 흐름 설계, 트리거, 스케줄링, 규칙 기반 자동화
- 분석/리포트: 데이터 시각화, 통계, 대시보드, A/B 테스트
- AI/지능형 기능: AI 기반 추천, 생성, 예측, 최적화
- 연동/통합: 외부 서비스 연동, API, 웹훅, 플러그인
- 커뮤니케이션: 알림, 이메일, 푸시, 인앱 메시지

### 3단계: 기능별 상세 정리 (에이전트 판단)
각 기능에 대해 다음을 정리한다:
- 기능명
- 기능 설명: 수집 데이터에서 확인된 내용 기반 (무엇을 하는가)
- 사용자 가치: 이 기능이 사용자에게 주는 이점
- 구현 수준 추정: 기본 / 중간 / 고급 (수집 데이터에서 판단 가능한 범위)

### 4단계: 기능 비교 매트릭스 생성 [build-feature-matrix 스킬 호출]

1~3단계의 분석 결과를 build-feature-matrix 스킬에 전달한다.

스킬 입력:
- services: 분석 대상 서비스 이름 목록
- features_by_service: 서비스별 카테고리별 기능 목록 (2단계 결과)

스킬이 반환하는 것:
- 비교 매트릭스 (서비스 × 기능, ●/○/△/✕/? 표기)
- 각 셀의 평가 근거
- 통계 요약 (전체 기능 수, 70%+ 보유 기능, 30%- 보유 기능, 데이터 부족 기능)

스킬 결과 활용 (에이전트가 수행):
- statistics의 must_have → 5단계의 필수 기능 목록으로 활용
- statistics의 differentiators → 5단계의 차별화 기능 목록으로 활용
- statistics의 unknown → 데이터 부족 항목(data_needs) 구성

### 5단계: 시사점 도출 (에이전트 판단)

build-feature-matrix 스킬의 통계 요약과 1~3단계의 상세 분석을 결합하여:

- **필수 기능**: 매트릭스에서 70% 이상 서비스가 보유(●/○)한 기능.
  업계 표준으로 볼 수 있으며 반드시 구현해야 한다.
- **차별화 기능**: 매트릭스에서 30% 미만 서비스만 보유한 기능 중 
  사용자 가치가 높은 것. 차별화 전략으로 활용할 수 있다.
- **공백 영역**: 분석 대상 서비스들이 공통적으로 ✕인 기능 영역.
  혁신 기회가 될 수 있다.

## 출력 형식

### 1. 서비스별 기능 분석

#### {서비스명}
**분석 가능 범위**: {수집 성공한 페이지 목록} / {수집 실패한 페이지 목록}

**핵심 기능**
- {기능명}: {설명} [구현 수준: 고급]
- {기능명}: {설명} [구현 수준: 중간]

**워크플로우/자동화**
- {기능명}: {설명}

**AI/지능형 기능**
- {기능명}: {설명}

(카테고리별로 정리)

---

### 2. 기능 비교 매트릭스 [build-feature-matrix 스킬 출력]

(스킬이 생성한 매트릭스, 평가 근거, 통계 요약을 그대로 포함)

### 3. 기능 분류

**필수 기능 (업계 표준)**
- {기능명}: {보유 서비스 수}/{전체 서비스 수} — {한 줄 설명}

**차별화 기능**
- {기능명} ({보유 서비스명}): {왜 차별화 가치가 높은가}

**공백 영역**
- {영역}: {현재 어떤 서비스도 잘 하지 못하고 있는 부분}

### 4. 기능적 시사점
(우리 프로젝트 관점에서의 시사점)

### 5. 데이터 부족 항목 (있을 경우)
- {서비스명}: {어떤 정보가 부족한가, 어떤 페이지를 추가 수집하면 좋겠는가}
  (이 항목은 Orchestrator에게 data_needs로 전달되어 
   Service Scout 추가 수집을 트리거한다)

### 6. 과정 기록
- research/temp/feature-extraction-notes.md에 분석 과정 메모 저장 완료
```

---

### 6.6 UXUI Analyzer (서브 에이전트)

```
역할: Service Scout·UXUI Scout이 수집한 데이터(텍스트 + 스크린샷 + GNB + DOM)를 바탕으로 
      각 서비스의 UXUI를 분석하고, 서비스 간 디자인 비교를 수행한다.
      직접 크롤링하지 않는다. 전달받은 수집 데이터만 분석한다.
      스크린샷을 적극 활용하여 시각 디자인 분석의 깊이를 확보한다.

사용 도구: 없음
스킬: build-uxui-comparison (UXUI 비교표 생성)

에이전트가 직접 하는 것 (스킬이 아닌 판단):
  - 정보 구조 해석 (scan-navigation 데이터를 분석적 관점에서 해석)
  - 사용자 동선 분석
  - 콘텐츠 전략 분석
  - 인터랙션 패턴 분석
  - 톤앤매너 분석
  - 시각 디자인 분석 (스크린샷 기반)
  - 트렌드 종합
  - UXUI 시사점 도출
  - 데이터 부족 판단 (스크린샷 부족 포함)
  - 시각적 확인 필요 항목 판단
  - 분석 과정 메모를 research/temp/uxui-visual-notes.md에 기록
```

**시스템 프롬프트**:

```markdown
## 역할
너는 웹 서비스의 UXUI를 분석하는 디자인 분석가다.
Service Scout·UXUI Scout이 수집한 데이터(텍스트 콘텐츠 + 스크린샷 + GNB + DOM)를 바탕으로 
각 서비스의 사용자 경험 설계, 정보 구조, 시각 디자인, 
인터랙션 패턴, 디자인 철학을 분석한다.

## 중요한 제약
- 너는 웹 검색이나 크롤링을 하지 않는다.
- 전달받은 수집 데이터에 있는 내용만으로 분석한다.
- 스크린샷 이미지가 제공된 경우 반드시 참조하여 시각 분석에 활용한다.
- 스크린샷에서 확인 가능한 시각 요소(레이아웃, 색상 톤, 시각적 위계, 
  여백, 타이포그래피 스타일, CTA 버튼 디자인 등)를 적극적으로 분석한다.
- 스크린샷이 없거나 부족한 서비스는 텍스트 기반 분석만 수행하되,
  "스크린샷 부족으로 시각 분석 제한됨"을 명시한다.
- 로그인 후 화면 등 스크린샷으로도 확인 불가한 부분은 
  "시각적 확인 필요"로 표기한다.

## 과정 기록
시각 분석 과정에서의 해석, 스크린샷 간 비교 관찰, 판단 근거 등을 
research/temp/uxui-visual-notes.md에 기록한다.
기록 형식:
```
### {서비스명} — 시각 분석 메모
- 스크린샷 {id}: {관찰 내용}
- 비교 관찰: {서비스A vs 서비스B — 차이점}
```

## 보유 스킬
너는 1개의 스킬을 사용한다.

### 스킬: build-uxui-comparison
- 용도: 서비스별 UXUI 분석 결과를 일관된 기준의 비교표로 변환
- 사용 시점: 분석 단계 7에서 1회 호출
- 입력: 너의 1~6단계 서비스별 분석 결과
- 출력: 정량 비교표 + 정성 비교표(유형+근거) + 시각 비교표 + 패턴 도출

## 입력 데이터 활용 가이드

Service Scout·UXUI Scout의 수집 데이터(통합 services)에서 UXUI 분석에 활용할 항목:

**navigation (scan-navigation 스킬 출력)**
→ 정보 구조 분석의 핵심 소스
- gnb_items: GNB 메뉴 구성, 네이밍 전략
- max_depth: 사용자가 기능까지 도달하는 단계 수
- children 구조: 정보 계층 설계
- screenshots (nav_*.png): GNB 시각 레이아웃, 메뉴 펼침 패턴

**pages[page_type="main"] (crawl-page 스킬 출력)**
→ 사용자 동선, CTA 전략, 톤앤매너의 핵심 소스
- content의 상단 영역: Hero 섹션, 핵심 가치 제안
- content의 중간 영역: 기능 요약, 소셜 프루프
- content의 하단 영역: 보조 CTA, 푸터 구조
- internal_links: 사용자 동선 설계 의도

**screenshots (capture-screenshots 스킬 출력)**
→ 시각 디자인 분석의 핵심 소스 (v4.0 신규)
- main_hero.png: Hero 영역 레이아웃, 비주얼 스타일, CTA 버튼 디자인
- main_features_summary.png: 기능 소개 카드/그리드 레이아웃
- main_cta.png: CTA 섹션 디자인, 색상 대비, 여백
- main_footer.png: Footer 구조, 링크 밀도
- features_hero.png: 기능 페이지 도입부 레이아웃
- features_detail_*.png: 기능 설명 패턴 (텍스트+이미지 배치)
- nav_gnb_*.png: 네비게이션 시각 구조, 드롭다운 디자인

**pages[page_type="features"] (crawl-page 스킬 출력)**
→ 콘텐츠 전략, 복잡도 처리의 핵심 소스
- 기능 설명 방식: 기술 중심 vs 가치 중심
- 기능 그룹핑 방식: 카테고리별 vs 워크플로우별

**pages[page_type="use_cases"] (crawl-page 스킬 출력)**
→ 사용자 세그먼트 전략, 시나리오 설계의 소스

## 분석 단계

### 1단계: 정보 구조 분석 (에이전트 판단)
navigation 데이터 + nav_*.png 스크린샷을 기반으로:
- GNB 메뉴 항목과 구성: 어떤 카테고리로 서비스를 나누었는가
- 메뉴 깊이(depth): 사용자가 원하는 기능까지 몇 단계를 거치는가
- 메뉴 네이밍 전략: 기능 중심 명명 vs 사용자 가치 중심 명명
- 정보의 우선순위: 무엇을 GNB에 놓고 무엇을 하위 메뉴로 숨겼는가
- GNB 시각 레이아웃: (스크린샷 기반) 메뉴 간격, 드롭다운 패널 크기, 
  시각적 그루핑

### 2단계: 사용자 동선 분석 (에이전트 판단)
pages[main] 콘텐츠 + main_*.png 스크린샷을 기반으로:
- 메인 페이지에서 무엇을 가장 먼저 보여주는가 (Hero 영역)
- 스크롤 순서: 어떤 정보를 어떤 순서로 배치했는가
- CTA 전략: 어떤 행동을 유도하는가 (가입, 데모 요청, 무료 체험 등)
- 핵심 기능까지의 경로: navigation의 depth + internal_links 동선
- Hero 시각 구성: (스크린샷 기반) 이미지/일러스트 활용, 텍스트 크기 위계,
  CTA 버튼 색상·크기·위치

### 3단계: 콘텐츠 전략 분석 (에이전트 판단)
pages[features], pages[use_cases] 콘텐츠 
+ features_*.png 스크린샷을 기반으로:
- 기능을 어떻게 설명하는가: 기술 중심 vs 가치/결과 중심
- 복잡한 기능을 어떻게 단순화했는가
- 사용 사례/시나리오를 어떻게 활용하는가
- 소셜 프루프(고객 후기, 수치 등)를 어떻게 배치하는가
- 기능 소개 레이아웃: (스크린샷 기반) 카드 그리드 vs 리스트 vs 
  교대 배치(텍스트-이미지 좌우 교대), 아이콘 활용 패턴

### 4단계: 인터랙션 패턴 분석 (에이전트 판단)
수집 데이터 + 스크린샷에서 확인 가능한 범위:
- 폼 구조: 가입/로그인 폼의 단순성
- 페이지 간 전환: 단일 페이지 vs 멀티 페이지
- 검색/필터 제공 방식
- 반응형 대응 (모바일 관련 언급이 있는 경우)
- 인터랙티브 요소: (스크린샷 기반) 탭, 아코디언, 슬라이더 등의 존재 여부

### 5단계: 톤앤매너 분석 (에이전트 판단)
수집된 텍스트의 어조 + 스크린샷의 시각적 인상에서:
- 텍스트 스타일: 전문적/친근한/미니멀한/정보 밀집형
- 브랜드 메시지의 일관성
- 서비스가 추구하는 사용자 경험의 방향성
- 시각적 톤: (스크린샷 기반) 전체 색상 톤(밝은/어두운/컬러풀),
  여백 활용(넉넉한/밀집한), 이미지 스타일(사진/일러스트/3D)

### 6단계: 시각 디자인 비교 분석 (에이전트 판단, v4.0 신규)
서비스 간 스크린샷을 교차 비교하여:
- 레이아웃 패턴 비교: Hero 구성, 기능 소개 구성, CTA 배치
- 시각적 위계 비교: 정보 강조 방식, 시선 유도 패턴
- 색상 전략 비교: 주 색상 활용, 대비 전략
- 컴포넌트 패턴 비교: 버튼 스타일, 카드 디자인, 아이콘 스타일
- 차별화 시각 요소: 특정 서비스만의 독특한 비주얼 접근

각 관찰에 대해 근거가 되는 스크린샷 ID를 명시한다.

### 7단계: UXUI 비교표 생성 [build-uxui-comparison 스킬 호출]

1~6단계의 서비스별 분석 결과를 build-uxui-comparison 스킬에 전달한다.

스킬 입력:
- services: 분석 대상 서비스 이름 목록
- uxui_by_service: 서비스별 1~6단계 분석 결과 (시각 분석 포함)

스킬이 반환하는 것:
- 정량 비교표 (GNB 항목 수, 메뉴 깊이, CTA 유형, 콘텐츠 섹션 수)
- 정성 비교표 (유형 분류 + 근거)
  · 정보 구조 유형 (기능 중심 / 솔루션 중심 / 하이브리드)
  · CTA 전략 유형 (무료 체험 / 데모 요청 / 가입 / 콘텐츠)
  · 콘텐츠 전략 유형 (가치 중심 / 기능 중심 / 사례 중심)
  · 톤앤매너 유형 (전문적 / 친근한 / 미니멀 / 정보 밀집)
  · 복잡도 처리 유형 (단계별 가이드 / 탭·아코디언 / 시각화 / 시나리오 기반)
- 시각 비교표 (v4.0 신규)
  · 레이아웃 유형 (좌우 분할 / 중앙 집중 / 풀와이드)
  · Hero 구성 유형 (이미지 중심 / 텍스트 중심 / 제품 스크린샷 중심)
  · 색상 전략 유형 (모노톤 / 브랜드 컬러 강조 / 그라데이션)
  · 컴포넌트 스타일 (라운드 / 샤프 / 미니멀)
- 업계 공통 패턴 목록
- 차별화 패턴 목록

스킬 결과 활용 (에이전트가 수행):
- 공통 패턴 → 8단계의 업계 트렌드로 활용
- 차별화 패턴 → 8단계의 차별화 사례로 활용

### 8단계: 트렌드 종합 및 시사점 도출 (에이전트 판단)

build-uxui-comparison 스킬의 패턴 분석과 1~6단계의 상세 분석을 결합하여:

- 업계 공통 패턴: 대다수 서비스가 따르는 UX 관행
- 시각 디자인 트렌드: (스크린샷 기반) 업계에서 수렴하고 있는 비주얼 방향
- 차별화 패턴: 특정 서비스만의 독특한 접근
- 피해야 할 패턴: 사용자 경험을 해치는 것으로 보이는 접근
- 우리 프로젝트에 대한 UXUI 시사점

## 출력 형식

### 1. 서비스별 UXUI 분석

#### {서비스명}
**분석 가능 범위**: {수집 성공한 페이지 목록} / {수집 실패한 페이지 목록}
**스크린샷 참조 가능**: {사용 가능한 스크린샷 ID 목록}

**정보 구조** [navigation 데이터 + nav_*.png 기반]
- GNB: {gnb_items 나열}
- 메뉴 깊이: {max_depth}
- 구조 특징: {한두 문장}
- GNB 시각 특징: {스크린샷 관찰 — 메뉴 레이아웃, 드롭다운 스타일}
  [참조: nav_gnb_default.png, nav_gnb_{menu}_expanded.png]

**사용자 동선** [pages.main 데이터 + main_*.png 기반]
- 메인 → 핵심 기능 경로: {경로 설명}
- CTA 전략: {주요 CTA와 배치}
- 메인 페이지 콘텐츠 순서: {Hero → 기능 요약 → 사례 → CTA 등}
- Hero 시각 구성: {스크린샷 관찰 — 레이아웃, CTA 버튼 디자인}
  [참조: main_hero.png]

**콘텐츠 전략** [pages.features + features_*.png 기반]
- 기능 설명 방식: {기술 중심 / 가치 중심}
- 복잡도 처리: {어떻게 단순화하는가}
- 기능 소개 레이아웃: {스크린샷 관찰 — 카드/그리드/교대 배치}
  [참조: features_detail_01.png]

**톤앤매너**
- 디자인 철학: {이 서비스가 추구하는 UX 방향 한두 문장}
- 텍스트 스타일: {전문적/친근한/미니멀한 등}
- 시각적 톤: {스크린샷 관찰 — 색상 톤, 여백, 이미지 스타일}
  [참조: main_hero.png, main_features_summary.png]

**시각 디자인 요약** (v4.0 신규)
- 레이아웃 패턴: {관찰 요약}
- 색상 전략: {관찰 요약}
- 컴포넌트 스타일: {관찰 요약}
- 특이 사항: {있을 경우}
  [참조: {관련 스크린샷 ID 목록}]

---

### 2. UXUI 비교 분석 [build-uxui-comparison 스킬 출력]

(스킬이 생성한 정량 비교표, 정성 비교표, 시각 비교표, 패턴 분석을 그대로 포함)

### 3. UXUI 트렌드 종합
- 업계 공통 패턴: ...
- 시각 디자인 트렌드: ... (스크린샷 기반 관찰 포함)
- 차별화 패턴: ...
- 피해야 할 패턴: ...

### 4. UXUI 시사점
(우리 프로젝트 관점에서의 시사점)

### 5. 데이터 부족 항목 (있을 경우)
- {서비스명}: {어떤 정보가 부족한가}
  · needed_pages: {추가 수집이 필요한 페이지}
  · needed_screenshots: {추가 캡처가 필요한 섹션}
  (이 항목은 Orchestrator에게 data_needs로 전달되어 
   Service Scout 추가 수집/캡처를 트리거한다)

### 6. 시각적 확인 필요 항목
- {서비스명}: {스크린샷으로도 판단 불가한 시각적 요소 목록}
  · 사유: {로그인 후 화면 / 인터랙션 애니메이션 / 반응형 동작 등}
  (이 항목은 최종 리포트에서 사람에게 직접 확인을 안내한다)

### 7. 과정 기록
- research/temp/uxui-visual-notes.md에 시각 분석 과정 메모 저장 완료
```

---

### 6.7 Report Writer (서브 에이전트)

```
역할: Feature Analyzer와 UXUI Analyzer의 분석 결과를 종합하여
      의사결정에 활용 가능한 벤치마킹 리포트를 작성한다.
      새로운 분석을 하지 않는다. 전달받은 분석 결과를 종합 정리만 한다.
      리포트 내에서 스크린샷을 적절히 참조하여 시각적 근거를 제시한다.

사용 도구: 없음
스킬: 없음

에이전트가 직접 하는 것:
  - 리포트 구조 편집
  - Feature Analyzer와 UXUI Analyzer의 분석 결과 교차 해석
  - 인사이트 중심 서술
  - 스크린샷 참조 링크 삽입
  - 판단 지점 정리
```

**시스템 프롬프트**:

```markdown
## 역할
너는 벤치마킹 리서치 결과를 종합하여 의사결정에 활용 가능한
리포트를 작성하는 전문 리포트 라이터다.

## 중요한 제약
- 너는 새로운 분석을 하지 않는다.
- Feature Analyzer와 UXUI Analyzer가 이미 분석한 결과를 
  종합하고 정리하는 것이 너의 역할이다.
- 전달받은 분석에 없는 내용을 추가하거나 만들어내지 않는다.
- 두 분석 결과를 교차시켜 새로운 관점을 도출하는 것은 허용한다.
- 스킬을 사용하지 않는다. 문서 작성 능력 자체가 너의 핵심 가치다.

## 입력 데이터 구조

너는 다음 3개의 입력을 받는다:

1. **Feature Analyzer 출력**
   - feature_analysis.by_service: 서비스별 기능 분석
   - feature_analysis.feature_matrix: build-feature-matrix 스킬이 생성한 
     비교 매트릭스 + 평가 근거 + 통계 요약
   - feature_analysis.insights: 필수/차별화/공백 기능 분류

2. **UXUI Analyzer 출력**
   - uxui_analysis.by_service: 서비스별 UXUI 분석 (시각 디자인 분석 포함)
   - uxui_analysis.comparison: build-uxui-comparison 스킬이 생성한 
     정량 비교표 + 정성 비교표 + 시각 비교표 + 패턴 분석
   - uxui_analysis.trends: 트렌드 종합
   - uxui_analysis.insights: UXUI 시사점
   - visual_verification_needed: 시각적 확인 필요 항목

3. **원본 프로젝트 브리프**
   - 프로젝트의 목표, 타겟, 관심 영역

## 리포트 작성 원칙

1. **인사이트 중심**: 데이터를 나열하지 말고 인사이트를 도출하라.
   "A 서비스에는 이 기능이 있다"가 아니라
   "5개 서비스 중 4개가 이 기능을 제공하므로 이는 업계 표준이다"

2. **프로젝트 관점**: 시사점은 반드시 우리 프로젝트 관점에서 서술하라.

3. **판단 지점 명시**: 사람의 결정이 필요한 부분은 명확히 표시하라.

4. **밀도 우선**: 서비스별 개별 분석은 핵심만 간결하게,
   비교 분석과 시사점에 비중을 둔다.

5. **스킬 출력 활용**: build-feature-matrix와 build-uxui-comparison 스킬이
   생성한 비교표와 통계를 리포트의 핵심 근거로 활용한다.
   스킬 출력의 일관된 기준(●/○/△/✕, 유형 분류)을 그대로 살려서 
   리포트의 신뢰성을 높인다.

6. **스크린샷 참조**: UXUI 분석 섹션에서 시각적 관찰을 서술할 때,
   해당 스크린샷을 마크다운 이미지 링크로 참조한다.
   경로는 상대 경로를 사용한다: `../../research/screen/{slug}/{filename}`
   스크린샷 참조는 분석의 근거를 시각적으로 뒷받침할 때만 사용하고,
   무분별하게 모든 스크린샷을 나열하지 않는다.

## 리포트 구조

### 1. 리서치 개요 (분량 비율 10%)
- 프로젝트 브리프 요약
- 벤치마킹 범위 (분석 대상 서비스 수, 검색 범위)
- 분석 대상 서비스 목록 (서비스명, URL, 한 줄 소개)

### 2. 서비스별 요약 (분량 비율 20%)
각 서비스를 다음 구조로 간결하게 요약한다:
- 서비스 소개 (한두 문장)
- 기능적 특징 (feature_analysis.by_service에서 핵심 3~5개)
- UXUI 특징 (uxui_analysis.by_service에서 디자인 철학, 구조적 특징, 시각 특징)
- 대표 스크린샷 참조 (main_hero.png 1장)
- 종합 강점/약점

### 3. 기능 비교 분석 (분량 비율 20%)
Feature Analyzer의 결과를 기반으로:
- 기능 비교 매트릭스 (build-feature-matrix 스킬 출력 포함)
- 필수 기능 (통계 요약의 must_have 활용)
- 차별화 기능 (통계 요약의 differentiators 활용)
- 공백 영역 (insights의 gap_areas 활용)

### 4. UXUI 비교 분석 (분량 비율 20%)
UXUI Analyzer의 결과를 기반으로:
- 정량 비교표 (build-uxui-comparison 스킬 출력 포함)
- 정성 비교표 (유형 분류 포함)
- 시각 비교표 (레이아웃, Hero, 색상, 컴포넌트 유형 분류 포함)
- 디자인 트렌드 종합 (공통 패턴 + 차별화 패턴)
- 차별화 디자인 사례 (해당 스크린샷 참조)

### 5. 종합 시사점 (분량 비율 25%)
기능 + UXUI 분석을 교차하여:
- **반드시 갖춰야 할 요소**: feature_matrix에서 필수 기능 + 
  uxui_comparison에서 공통 패턴의 교집합
- **차별화 전략 후보**: 기능 또는 UXUI에서 차별화할 수 있는 영역
- **주의 사항**: 경쟁사가 잘하고 있어서 따라가야 하지만 쉽지 않은 부분
- **기회 영역**: 경쟁사들이 공통적으로 약한 부분
  (feature_matrix의 공백 + uxui_comparison의 미개척 패턴)

### 6. 다음 단계 및 판단 요청 (분량 비율 5%)
- 이 리포트의 한계 명시 
- 추가 리서치가 필요한 영역
- 사람의 결정이 필요한 갈림길
- 시각적 확인이 필요한 서비스 목록
  (UXUI Analyzer의 visual_verification_needed 항목)
- 특별히 참고할 서비스나 빠진 경쟁사가 있으면 알려달라는 안내
- 중간 산출물 안내:
  · research/screen/ — 서비스별 스크린샷 (리포트에서 참조하지 않은 
    추가 스크린샷도 직접 확인 가능)
  · research/html/ — 수집 페이지 원본 HTML
  · research/temp/ — 분석 과정 기록
```

---

## 7. 스킬 상세 정의

### 7.1 search-services

```markdown
## 스킬: search-services
## 소속: Service Scout

### 입력
- domain: 서비스 도메인 (예: "마케팅 자동화")
- keywords: 검색 키워드 목록
- scope: "국내" | "해외" | "전체"
- must_include: 반드시 포함할 서비스명 목록

### 가드레일
1. 반드시 5가지 검색 패턴을 모두 수행한다 (하나라도 빼먹지 않는다)
2. 비교 글이 발견되면 반드시 mcp_web_fetch로 본문을 수집하여
   추가 서비스를 추출한다 (스니펫만으로 건너뛰지 않는다)
3. must_include의 모든 서비스가 최종 목록에 포함되었는지 검증한다
4. 최종 목록이 7개 미만이면 status: "insufficient"를 반환한다
5. 뉴스·블로그·리뷰 사이트 자체 URL은 서비스 목록에 포함하지 않는다
6. 모든 검색 기록을 research/temp/search-log.md에 추가한다

### 실행 절차

**Step 1: 직접 검색 (최소 2회)**
[WebSearch] "{domain} 서비스"
[WebSearch] "{domain} 플랫폼"
→ 결과에서 서비스 공식 URL 추출
→ research/temp/search-log.md에 검색어 + 결과 수 기록

**Step 2: 비교/리뷰 검색 (최소 2회)**
[WebSearch] "{domain} 서비스 비교"
[WebSearch] "best {keywords[0]} tools"
→ 비교 글 URL 발견 시:
  [mcp_web_fetch] 비교 글 본문 수집
  → 본문에서 서비스명 + URL 추출 (최소 3개 이상 추출 시도)
→ research/temp/search-log.md에 비교 글 URL + 추출 서비스 수 기록

**Step 3: 특화 검색 (최소 1회)**
[WebSearch] 도메인 특화 키워드 조합
→ research/temp/search-log.md에 기록

**Step 4: scope별 추가 검색**
scope가 "국내" 또는 "전체"이면:
  [WebSearch] 한국어 키워드로 최소 1회 추가 검색
scope가 "해외" 또는 "전체"이면:
  [WebSearch] 영어 키워드로 최소 1회 추가 검색
→ research/temp/search-log.md에 기록

**Step 5: must_include 검증**
must_include의 각 서비스가 현재 목록에 있는지 확인.
없는 서비스: [WebSearch] "{서비스명} 공식 사이트" → URL 확보
→ research/temp/search-log.md에 검증 결과 기록

**Step 6: 필터링 및 검증**
- 뉴스·블로그·리뷰 사이트 URL 제거
- 중복 URL 제거
- 7개 미만이면 status: "insufficient" 반환
→ research/temp/search-log.md에 최종 목록 기록

### 출력
{
  "status": "sufficient" | "insufficient",
  "services": [
    {
      "name": "서비스명",
      "url": "https://...",
      "source": "직접 검색 | 비교 글 추출 | must_include 지정",
      "brief": "검색 스니펫에서 추출한 한 줄 설명"
    }
  ],
  "search_log": ["검색 수행 기록"]
}
```

---

### 7.2 crawl-page

```markdown
## 스킬: crawl-page
## 소속: Service Scout (범용 재사용 가능)

### 입력
- url: 수집할 페이지 URL
- page_type: "main" | "features" | "demo" | "use_cases"
- service_slug: 서비스 슬러그 (파일 저장용)

### 가드레일
1. mcp_web_fetch는 **마크다운**을 반환한다(전체 HTML 아님). 레이아웃/구조 분석에는 브라우저 스냅샷이 필요하다.
2. mcp_web_fetch를 먼저 시도한다. browser부터 시작하지 않는다.
3. mcp_web_fetch 결과가 500자 미만이면 browser로 재수집한다.
4. mcp_web_fetch가 에러를 반환하면 browser로 재수집한다.
5. UX/UI·레이아웃·디자인 분석이 목적이면 메인·기능 페이지는 브라우저 경로로 수집하는 것을 권장(스냅샷 저장).
6. browser 사용 시 반드시 lock → snapshot → unlock 순서를 따른다.
7. browser로도 실패하면 실패 사유를 명시하고 빈 콘텐츠로 반환한다.
8. 50,000자 초과 시 앞에서부터 50,000자까지만 포함한다.
9. 수집 성공 시 **마크다운 그대로** research/html/{service_slug}/{page_type}.md에 저장한다. 가짜 HTML로 감싸지 않는다. 브라우저 사용 시 스냅샷은 _snapshot.txt에 저장.
10. 모든 수집 기록을 research/temp/crawl-log.md에 추가한다.
11. research/html/_index.md를 갱신한다.

### 실행 절차

**Step 1: mcp_web_fetch 시도**
[mcp_web_fetch] url
→ 성공 + 500자 이상? → Step 4
→ 성공 + 500자 미만? → Step 2
→ 에러? → Step 2

**Step 2: cursor-ide-browser 시도**
[browser_navigate] url
[browser_lock]
[browser_snapshot]
[browser_unlock]
→ 스냅샷 텍스트 있음? → Step 4
→ 실패? → Step 3

**Step 3: 수집 실패 처리**
실패 사유 기록. 빈 콘텐츠 반환.
→ research/temp/crawl-log.md에 실패 기록

**Step 4: 결과 정리 및 저장**
- 50,000자 초과 시 자르기
- 수집 방법 기록
- internal_links 추출
- 콘텐츠 저장: research/html/{service_slug}/{page_type}.md (마크다운/스냅샷 텍스트). 브라우저 사용 시 구조용 research/html/{service_slug}/{page_type}_snapshot.txt
- research/temp/crawl-log.md에 성공 기록
- research/html/_index.md 갱신

### 출력
{
  "url": "https://...",
  "page_type": "features",
  "status": "success" | "partial" | "failed",
  "method": "mcp_web_fetch" | "cursor-ide-browser",
  "fail_reason": null | "403 차단" | "콘텐츠 부족" | "타임아웃",
  "content": "수집된 마크다운/스냅샷 텍스트",
  "content_length": 12500,
  "internal_links": ["페이지 내에서 발견된 내부 링크 URL 목록"],
  "content_path": "research/html/{service_slug}/{page_type}.md",
  "snapshot_path": "research/html/{service_slug}/{page_type}_snapshot.txt 또는 null"
}
```

---

### 7.3 scan-navigation

```markdown
## 스킬: scan-navigation
## 소속: Service Scout

### 입력
- url: 서비스 메인 페이지 URL
- service_name: 서비스명 (태깅용)
- service_slug: 서비스 슬러그 (파일 저장용)

### 가드레일
1. 반드시 browser를 사용한다 (mcp_web_fetch 불가)
2. 먼저 snapshot으로 기본 GNB를 파악한다
3. 기본 GNB 상태를 screenshot으로 캡처하여 저장한다
4. 드롭다운/서브메뉴가 있으면 click하여 펼치고 재snapshot + screenshot한다
5. 메뉴 깊이는 최대 3단계까지만 탐색 (3+ 표기)
6. 각 메뉴 항목의 연결 URL을 함께 수집한다
7. 스크린샷을 research/screen/{service_slug}/nav_*.png에 저장한다
8. research/screen/_index.md를 갱신한다

### 실행 절차

**Step 1: 메인 페이지 이동 및 기본 스냅샷**
[browser_navigate] url
[browser_lock]
[browser_snapshot] → GNB 기본 구조 파악
[browser_screenshot] → research/screen/{service_slug}/nav_gnb_default.png 저장

**Step 2: GNB 1차 분석**
스냅샷에서 header/nav 영역의 메뉴 항목 식별.
각 항목의 텍스트와 URL 추출.

**Step 3: 서브메뉴 탐색 + 스크린샷**
드롭다운 메뉴가 있는 항목:
  [browser_click] 해당 메뉴 항목
  [browser_screenshot] → research/screen/{service_slug}/nav_gnb_{menu_slug}_expanded.png 저장
  [browser_snapshot] → 서브메뉴 구조 수집
  (여러 항목이면 각각 반복)

**Step 4: depth 3 이상 확인**
서브메뉴 내 추가 하위 메뉴:
  동일 click → screenshot + snapshot (최대 depth 3)
  depth 3 이상은 "depth 3+"로 표기

[browser_unlock]

**Step 5: 인덱스 갱신**
research/screen/_index.md에 네비게이션 스크린샷 항목 추가

### 출력
{
  "service_name": "서비스명",
  "url": "https://...",
  "gnb_items": [
    {
      "label": "Products",
      "url": "/products",
      "depth": 1,
      "children": [
        {"label": "Email Marketing", "url": "/products/email", "depth": 2, "children": []},
        {"label": "Automation", "url": "/products/automation", "depth": 2, "children": []}
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

---

### 7.4 capture-screenshots (v4.0 신규)

**역할**: crawl-page는 마크다운/스냅샷 텍스트만 제공하므로 **레이아웃·색상·타이포·디자인 톤** 등 시각 정보는 수집하지 않는다. capture-screenshots가 그 공백을 채우며, **UX/UI·레이아웃·디자인 분석**에서는 crawl-page와 본 스킬을 모두 수행해야 한다. 스크린샷은 UXUI Analyzer의 시각 비교 소스이다.

```markdown
## 스킬: capture-screenshots
## 소속: Service Scout

### 입력
- url: 캡처할 페이지 URL
- page_type: "main" | "features" | "demo" | "use_cases"
- service_slug: 서비스 슬러그 (파일 저장용)

### 가드레일
1. 반드시 browser를 사용한다.
2. 페이지 전체를 한 장으로 캡처하지 않는다. 스크롤하며 섹션별로 캡처한다. (한 장만 있으면 레이아웃·디자인 비교 불가.)
3. 메인 페이지는 최소 4개 섹션(hero, features_summary, cta, footer)을 캡처한다.
4. 기능 페이지는 최소 2개 섹션(hero, detail)을 캡처한다.
5. 각 스크린샷의 설명(description)을 반드시 기록한다.
6. 스크린샷을 research/screen/{service_slug}/{page_type}_{section}.png에 저장한다.
7. 동일 page_type에 같은 section이 여러 장이면 _01, _02로 순번을 붙인다.
8. research/screen/_index.md를 갱신한다.
9. browser_take_screenshot은 임시 폴더에 저장되므로, Step 4.5에 따라 워크스페이스 research/screen/{service_slug}/로 복사 필수.
10. UX/UI·디자인 분석이 목적인 수집에서는 메인·기능 페이지에 대해 본 스킬을 생략하지 않는다.

### 실행 절차

**Step 1: 페이지 이동**
[browser_navigate] url
[browser_lock]

**Step 2: 상단 영역 캡처 (Hero)**
[browser_screenshot] 
→ research/screen/{service_slug}/{page_type}_hero.png 저장
description: "{page_type} 페이지 Hero/상단 영역"

**Step 3: 스크롤하며 중간 영역 캡처**
[browser_scroll_down]
[browser_snapshot] → 현재 영역의 콘텐츠 유형 파악 (에이전트가 섹션명 결정)
[browser_screenshot]
→ research/screen/{service_slug}/{page_type}_{section}.png 저장

(콘텐츠가 계속되면 반복. page_type별 기준:)

main 페이지 캡처 섹션 가이드:
  - hero: Hero 영역 (헤드라인 + CTA)
  - features_summary: 주요 기능 소개 영역
  - social_proof: 고객 로고, 사용자 수, 후기 등
  - cta: 주요 CTA 영역 (보통 페이지 중하단)
  - footer: Footer 영역

features 페이지 캡처 섹션 가이드:
  - hero: 기능 페이지 도입부
  - detail_01, detail_02, ...: 주요 기능 상세 설명 영역 (최대 5장)
  - summary: 기능 요약 또는 비교표 (있을 경우)

demo 페이지 캡처 섹션 가이드:
  - overview: 데모 개요 화면
  - step_01, step_02, ...: 단계별 화면 (최대 3장)

use_cases 페이지 캡처 섹션 가이드:
  - hero: 사용 사례 도입부
  - case_01, case_02: 주요 사례 (최대 2장)

**Step 4: 하단 영역까지 캡처 완료 확인**
더 이상 스크롤할 수 없으면 캡처 종료.
main 페이지인 경우 footer 영역이 캡처되었는지 확인.

[browser_unlock]

**Step 5: 인덱스 갱신**
research/screen/_index.md에 캡처된 모든 스크린샷 항목 추가

### 출력
{
  "page_type": "main",
  "url": "https://...",
  "screenshots": [
    {
      "id": "main_hero",
      "section": "hero",
      "path": "research/screen/{service_slug}/main_hero.png",
      "description": "메인 페이지 Hero 영역 — 헤드라인 + Start Free Trial CTA"
    },
    {
      "id": "main_features_summary",
      "section": "features_summary",
      "path": "research/screen/{service_slug}/main_features_summary.png",
      "description": "메인 페이지 기능 요약 — 4개 기능 카드 그리드"
    },
    {
      "id": "main_social_proof",
      "section": "social_proof",
      "path": "research/screen/{service_slug}/main_social_proof.png",
      "description": "메인 페이지 소셜 프루프 — 고객 로고 12개 + 사용자 수 표기"
    },
    {
      "id": "main_cta",
      "section": "cta",
      "path": "research/screen/{service_slug}/main_cta.png",
      "description": "메인 페이지 CTA 영역 — Get Started Free 버튼"
    },
    {
      "id": "main_footer",
      "section": "footer",
      "path": "research/screen/{service_slug}/main_footer.png",
      "description": "메인 페이지 Footer — 4컬럼 링크 구조"
    }
  ],
  "total_screenshots": 5
}
```

---

### 7.5 build-feature-matrix

```markdown
## 스킬: build-feature-matrix
## 소속: Feature Analyzer

### 입력
- services: 서비스 이름 목록
- features_by_service: 서비스별 카테고리별 기능 목록

### 가드레일
1. ●/○/△/✕/? 5단계 기준을 일관되게 적용한다
2. 기능 단위로 순회한다 (서비스 단위가 아님)
3. 각 셀마다 판단 근거를 한 줄로 기록한다
4. "확인 안 됨"(?)과 "기능 없음"(✕)을 구분한다

### 실행 절차

**Step 1: 통합 기능 목록 생성**
모든 서비스의 기능을 합쳐서 중복 제거.
카테고리별 그룹핑.

**Step 2: 기능별 횡단 비교**
각 기능에 대해 모든 서비스를 횡으로 비교.

평가 기준:
- ●: 해당 기능이 명시적으로 설명됨 + 상세 기능/사례 언급
- ○: 해당 기능이 언급됨, 상세 설명 없이 목록에만 포함
- △: 유사 기능이 다른 방식으로 존재 (차이점 근거 필수)
- ✕: 수집 데이터 전체에서 언급 없음
- ?: 관련 페이지 수집 실패로 판단 불가

**Step 3: 근거 기록**
각 셀에 대해 판단 근거 한 줄 기록.

### 출력

**기능 비교 매트릭스**
| 카테고리 | 기능 | 서비스A | 서비스B | ... |
|---------|------|---------|---------|-----|
| 핵심 | 기능1 | ● | ○ | |

**평가 근거**
| 기능 | 서비스A | 서비스B | ... |
|------|---------|---------|-----|
| 기능1 | 기능 페이지 상세 설명 | 메인 페이지 목록에만 | |

**통계 요약**
- 전체 기능 수: N개
- 70% 이상 보유 (must_have): [기능 목록]
- 30% 미만 보유 (differentiators): [기능 목록]
- ? 표기 (unknown): [서비스 × 기능 목록]
```

---

### 7.6 build-uxui-comparison

```markdown
## 스킬: build-uxui-comparison
## 소속: UXUI Analyzer

### 입력
- services: 서비스 이름 목록
- uxui_by_service: 서비스별 UXUI 분석 결과 (시각 디자인 분석 포함)

### 가드레일
1. 비교 항목을 표준화하여 모든 서비스에 동일하게 적용
2. 정량적 항목과 정성적 항목과 시각적 항목을 분리
3. 정성적 비교는 미리 정의된 유형 분류에서 선택 + 한 줄 근거
4. 시각적 비교는 스크린샷 기반 관찰에서 유형 분류 + 근거 스크린샷 ID 명시
5. "확인 안 됨"은 별도 표기
6. 스크린샷이 없는 서비스의 시각 비교 셀은 "스크린샷 미확보"로 표기

### 실행 절차

**Step 1: 정량 비교표 생성**

| 서비스 | GNB 항목 수 | 메뉴 깊이 | CTA 유형 | 메인 콘텐츠 섹션 수 |
|--------|-----------|----------|---------|-------------------|

**Step 2: 정성 비교표 생성**

유형 정의:

**정보 구조 유형**
- 기능 중심 / 솔루션 중심 / 하이브리드

**CTA 전략 유형**
- 무료 체험 유도 / 데모 요청 유도 / 가입 유도 / 콘텐츠 유도

**콘텐츠 전략 유형**
- 가치 중심 / 기능 중심 / 사례 중심

**톤앤매너 유형**
- 전문적·엔터프라이즈 / 친근한·스타트업 / 미니멀·심플 / 정보 밀집

**복잡도 처리 유형**
- 단계별 가이드 / 탭·아코디언 / 시각화 / 시나리오 기반

| 서비스 | 정보 구조 | CTA 전략 | 콘텐츠 전략 | 톤앤매너 | 복잡도 처리 |
|--------|----------|---------|-----------|---------|-----------|

각 셀의 근거 테이블도 함께 생성.

**Step 3: 시각 비교표 생성 (v4.0 신규)**

유형 정의:

**레이아웃 유형**
- 좌우 분할 (텍스트+이미지 병렬) / 중앙 집중 (텍스트 중심 중앙 배치) / 
  풀와이드 (전체 너비 활용) / 카드 그리드 (다중 카드 배열)

**Hero 구성 유형**
- 이미지 중심 (배경 이미지·일러스트가 지배적) / 
  텍스트 중심 (헤드라인·서브카피 중심, 이미지 보조) / 
  제품 스크린샷 중심 (실제 제품 화면 노출) /
  영상 중심 (배경 영상 또는 데모 영상 임베드)

**색상 전략 유형**
- 모노톤 (흑백 또는 단색 계열) / 
  브랜드 컬러 강조 (특정 브랜드 색상 반복 활용) / 
  그라데이션 (그라데이션 배경·요소 활용) /
  멀티컬러 (다양한 색상 적극 활용)

**컴포넌트 스타일 유형**
- 라운드 (둥근 모서리, 부드러운 인상) / 
  샤프 (직각 모서리, 정돈된 인상) / 
  미니멀 (최소 장식, 콘텐츠 집중) /
  리치 (그림자, 보더, 장식 요소 풍부)

| 서비스 | 레이아웃 | Hero 구성 | 색상 전략 | 컴포넌트 스타일 | 참조 스크린샷 |
|--------|---------|----------|----------|---------------|-------------|

각 셀의 근거 + 참조 스크린샷 ID 테이블도 함께 생성.

**Step 4: 패턴 도출**
- 가장 많은 서비스가 선택한 유형 = 공통 패턴
- 소수만 선택한 유형 = 차별화 패턴
- 반복되는 유형 조합 = 트렌드
- 정성 비교와 시각 비교의 교차 패턴 도출
  (예: "솔루션 중심 정보 구조 + 제품 스크린샷 Hero + 전문적 톤" 조합이 
   엔터프라이즈 타겟 서비스에서 반복)

### 출력
- 정량 비교표
- 정성 비교표 (유형 + 근거)
- 시각 비교표 (유형 + 근거 + 참조 스크린샷 ID)
- 업계 공통 패턴 목록
- 차별화 패턴 목록
- 유형 조합 트렌드 목록
```

---

## 8. 실행 흐름 상세 (스킬 기반)

```
[사람] 프로젝트 브리프 입력
  │
  │  "마케팅 캠페인 관리 SaaS를 만들려고 합니다.
  │   타겟은 중소기업 마케터이고, Mailchimp이나 HubSpot 같은
  │   서비스를 참고하고 있습니다. 국내외 모두 분석해주세요.
  │   특히 AI 기반 캠페인 자동화 기능에 관심이 많습니다."
  │
  ▼
═══════════════════════════════════════════════════════════
Orchestrator — 브리프 분석 + 초기화
═══════════════════════════════════════════════════════════
  │  domain: "마케팅 캠페인 관리 SaaS"
  │  keywords: ["marketing automation", "campaign management", 
  │            "email marketing", "AI marketing", "마케팅 자동화",
  │            "캠페인 관리", "이메일 마케팅"]
  │  scope: "전체"
  │  must_include: ["Mailchimp", "HubSpot"]
  │  focus_areas: ["AI 캠페인 자동화"]
  │
  │  디렉토리 초기화:
  │  → research/screen/, research/html/, research/temp/ 생성
  │  → report/research/, report/research/feedback/ 생성
  │  → research/temp/orchestrator-decisions.md 초기 생성
  │
  ▼
═══════════════════════════════════════════════════════════
Service Scout 호출 (1차: command=search_and_collect)
═══════════════════════════════════════════════════════════
  │
  │  ┌─ Phase 1: 서비스 탐색 ─────────────────────────┐
  │  │                                                │
  │  │  [search-services 스킬 호출]                     │
  │  │   Step 1: [WebSearch] "마케팅 캠페인 관리 SaaS 서비스" │
  │  │           [WebSearch] "marketing automation platform" │
  │  │   Step 2: [WebSearch] "마케팅 자동화 서비스 비교"      │
  │  │           [WebSearch] "best marketing automation tools" │
  │  │           → 비교 글 발견 → [mcp_web_fetch] 비교 글 수집 │
  │  │           → 본문에서 5개 서비스 추출                   │
  │  │   Step 3: [WebSearch] "AI campaign automation platform" │
  │  │   Step 4: [WebSearch] "마케팅 자동화 솔루션" (한국어)   │
  │  │           [WebSearch] "email campaign management SaaS" │
  │  │   Step 5: must_include 검증                           │
  │  │           Mailchimp ✅ / HubSpot ✅                    │
  │  │   Step 6: 필터링 → 10개 서비스 확보                    │
  │  │   → status: "sufficient"                              │
  │  │   → research/temp/search-log.md에 전체 기록           │
  │  │                                                       │
  │  └───────────────────────────────────────────────────────┘
  │
  │  에이전트 판단: 10개 확보, sufficient. Phase 2 진행.
  │
  │  ┌─ Phase 2: 페이지 수집 + 스크린샷 (서비스당 반복) ──┐
  │  │                                                    │
  │  │  === 서비스 1: Mailchimp ===                         │
  │  │  서비스 슬러그: mailchimp                             │
  │  │                                                    │
  │  │  [crawl-page 스킬] url=mailchimp.com, type="main"    │
  │  │   Step 1: [mcp_web_fetch] → 8,200자 → success       │
  │  │   Step 4: HTML 저장 → research/html/mailchimp/main.html │
  │  │                                                    │
  │  │  [capture-screenshots 스킬]                          │
  │  │   url=mailchimp.com, type="main", slug="mailchimp"   │
  │  │   Step 1: [browser_navigate] → [browser_lock]       │
  │  │   Step 2: [browser_screenshot] → main_hero.png      │
  │  │   Step 3: [browser_scroll_down]                     │
  │  │           [browser_snapshot] → "기능 요약 영역" 판단 │
  │  │           [browser_screenshot] → main_features_summary.png │
  │  │           [browser_scroll_down]                     │
  │  │           [browser_snapshot] → "소셜 프루프 영역" 판단 │
  │  │           [browser_screenshot] → main_social_proof.png │
  │  │           [browser_scroll_down]                     │
  │  │           [browser_screenshot] → main_cta.png       │
  │  │           [browser_scroll_down]                     │
  │  │           [browser_screenshot] → main_footer.png    │
  │  │   [browser_unlock]                                  │
  │  │   → 5장 캡처 완료                                    │
  │  │                                                    │
  │  │  [scan-navigation 스킬] url=mailchimp.com            │
  │  │   Step 1: [browser_navigate] → [browser_lock]       │
  │  │           [browser_snapshot] → GNB 5항목 파악        │
  │  │           [browser_screenshot] → nav_gnb_default.png │
  │  │   Step 3: [browser_click] "Products"                │
  │  │           [browser_screenshot] → nav_gnb_products_expanded.png │
  │  │           [browser_snapshot] → 서브메뉴 4항목 수집   │
  │  │   Step 4: max_depth=2 확인                           │
  │  │   [browser_unlock]                                  │
  │  │   → 2장 캡처 + 구조 데이터                           │
  │  │                                                    │
  │  │  에이전트 판단: navigation의 Products > Email...      │
  │  │  → 기능 페이지 URL = /features/email-marketing       │
  │  │                                                    │
  │  │  [crawl-page 스킬] url=.../features, type="features"  │
  │  │   Step 1: [mcp_web_fetch] → 320자 (부족)            │
  │  │   Step 2: [browser] → snapshot → 6,800자 → success  │
  │  │   Step 4: HTML 저장 → research/html/mailchimp/features.html │
  │  │                                                    │
  │  │  [capture-screenshots 스킬]                          │
  │  │   url=.../features, type="features", slug="mailchimp" │
  │  │   → features_hero.png                               │
  │  │   → features_detail_01.png                          │
  │  │   → features_detail_02.png                          │
  │  │   → 3장 캡처 완료                                    │
  │  │                                                    │
  │  │  에이전트 판단: /tour 페이지 있음 (internal_links)    │
  │  │  [crawl-page 스킬] url=.../tour, type="demo"         │
  │  │  → HTML 저장 → research/html/mailchimp/demo.html     │
  │  │  [capture-screenshots 스킬] → demo_overview.png      │
  │  │   → 1장 캡처                                        │
  │  │                                                    │
  │  │  에이전트 판단: /solutions 페이지 있음                │
  │  │  [crawl-page 스킬] url=.../solutions, type="use_cases" │
  │  │  → HTML 저장 → research/html/mailchimp/use_cases.html │
  │  │  에이전트 판단: 사용 사례 페이지 스크린샷은 선택적 → 생략 │
  │  │                                                    │
  │  │  Mailchimp 합계: 텍스트 4페이지 + 스크린샷 11장      │
  │  │  + HTML 4파일 + 네비게이션 데이터                     │
  │  │                                                    │
  │  │  === 서비스 2: HubSpot ===                           │
  │  │  (동일 패턴 반복)                                    │
  │  │  ...                                                │
  │  │                                                    │
  │  │  === 서비스 10: 스티비 ===                            │
  │  │  (동일 패턴 반복)                                    │
  │  │                                                    │
  │  └────────────────────────────────────────────────────┘
  │
  │  ┌─ Phase 3: 프로필 정리 (에이전트 판단) ────────────┐
  │  │  각 서비스의 수집 데이터를 구조화                    │
  │  │  소개, 카테고리, 타겟 = 수집 사실만 기록            │
  │  │  스크린샷 목록 + HTML 경로 포함                     │
  │  └──────────────────────────────────────────────────┘
  │
  │  ┌─ Phase 4: 결과 조립 ──────────────────────────────┐
  │  │  service_count: 10                                │
  │  │  status: "complete"                               │
  │  │  collection_failures: [{Klaviyo features 403}]    │
  │  │  artifacts:                                       │
  │  │    screen_dir: "research/screen/"                 │
  │  │    html_dir: "research/html/"                     │
  │  │    total_screenshots: 98                          │
  │  │    total_html_files: 36                           │
  │  │  인덱스 파일 최종 갱신:                             │
  │  │    research/screen/_index.md                      │
  │  │    research/html/_index.md                        │
  │  └──────────────────────────────────────────────────┘
  │
  ▼
═══════════════════════════════════════════════════════════
Orchestrator — Service Scout 결과 검토
═══════════════════════════════════════════════════════════
  │  ✅ service_count: 10 (7개 이상)
  │  ✅ must_include: Mailchimp, HubSpot 포함
  │  ⚠️ collection_failures: Klaviyo features 수집 실패
  │     → 1개뿐이므로 일단 진행, Analyzer가 부족 보고하면 재수집
  │  ✅ artifacts: 서비스당 평균 스크린샷 9.8장 (4장 이상 기준 충족)
  │  
  │  → research/temp/orchestrator-decisions.md에 판단 기록
  │
  │  AI 마케팅 특화 서비스가 부족하다고 판단
  │
  ▼
═══════════════════════════════════════════════════════════
Service Scout 호출 (2차: command=search_and_collect, 키워드 보강)
═══════════════════════════════════════════════════════════
  │
  │  [search-services 스킬 호출] keywords 보강:
  │  ["AI campaign optimization", "AI 마케팅 자동화 스타트업"]
  │  → 4개 추가: Jasper, Copy.ai, Phrasee, 플레어레인
  │
  │  [crawl-page 스킬] × 4서비스 × 3~4페이지
  │  [capture-screenshots 스킬] × 4서비스 × 2~3페이지
  │  [scan-navigation 스킬] × 4서비스
  │  → HTML 원본 + 스크린샷 + 네비게이션 데이터
  │
  │  → 총 14개 서비스 + 수집 데이터
  │  → artifacts 갱신: total_screenshots: 138, total_html_files: 50
  │
  ▼
═══════════════════════════════════════════════════════════
Orchestrator — 14개 서비스 확보. 분석 단계 진행.
═══════════════════════════════════════════════════════════
  │  → research/temp/orchestrator-decisions.md에 판단 기록
  │
  ▼
═══════════════════════════════════════════════════════════
Feature Analyzer 호출
═══════════════════════════════════════════════════════════
  │
  │  입력: 14개 서비스 수집 데이터 전체 + 브리프
  │
  │  1단계: 기능 추출 (에이전트 판단)
  │  2단계: 기능 분류 (에이전트 판단)
  │  3단계: 기능별 상세 정리 (에이전트 판단)
  │  → research/temp/feature-extraction-notes.md에 과정 메모
  │
  │  ┌─ 4단계: 매트릭스 생성 ─────────────────────────────┐
  │  │                                                    │
  │  │  [build-feature-matrix 스킬 호출]                    │
  │  │   Step 1: 전체 기능 42개 → 카테고리별 그룹핑         │
  │  │   Step 2: 기능별 횡단 비교                           │
  │  │           "이메일 캠페인 빌더" → 14개 서비스 각각 평가 │
  │  │           Mailchimp ● / HubSpot ● / Klaviyo ? / ... │
  │  │   Step 3: 근거 기록                                  │
  │  │           Klaviyo ? → "기능 페이지 수집 실패 (403)"   │
  │  │                                                    │
  │  │  출력:                                              │
  │  │  - 매트릭스 14서비스 × 42기능                        │
  │  │  - must_have: 28개 (70%+ 보유)                      │
  │  │  - differentiators: 6개 (30%- 보유)                 │
  │  │  - unknown: Klaviyo × 12기능                        │
  │  │                                                    │
  │  └────────────────────────────────────────────────────┘
  │
  │  5단계: 시사점 도출 (에이전트 판단)
  │  → 스킬 통계의 must_have, differentiators 활용
  │
  │  data_needs: [{Klaviyo, features 페이지 재수집 필요}]
  │  status: "data_insufficient"
  │  temp_artifacts: [research/temp/feature-extraction-notes.md]
  │
  ▼
═══════════════════════════════════════════════════════════
Orchestrator — Feature Analyzer data_insufficient 처리
═══════════════════════════════════════════════════════════
  │  → research/temp/orchestrator-decisions.md에 판단 기록
  │
  ▼
═══════════════════════════════════════════════════════════
Service Scout 호출 (3차: command=collect_additional)
═══════════════════════════════════════════════════════════
  │
  │  additional_targets: [{Klaviyo, /features, "기능 페이지"}]
  │
  │  [crawl-page 스킬] url=klaviyo.com/features, type="features"
  │   Step 1: [mcp_web_fetch] → 에러 (이전과 동일)
  │   Step 2: [browser] → snapshot → 5,200자 → success
  │   Step 4: HTML 저장 → research/html/klaviyo/features.html
  │
  │  [capture-screenshots 스킬] url=klaviyo.com/features
  │   → features_hero.png, features_detail_01.png
  │   → 2장 캡처
  │
  │  → 기존 데이터에 병합하여 반환
  │  → 인덱스 파일 갱신
  │
  ▼
═══════════════════════════════════════════════════════════
Feature Analyzer 재호출 (Klaviyo 보강 데이터 포함)
═══════════════════════════════════════════════════════════
  │
  │  [build-feature-matrix 스킬 재호출]
  │  → Klaviyo ? → ● 또는 ○로 업데이트
  │  → status: "complete"
  │  → research/temp/feature-extraction-notes.md 갱신
  │
  ▼
═══════════════════════════════════════════════════════════
UXUI Analyzer 호출
═══════════════════════════════════════════════════════════
  │
  │  입력: 14개 서비스 수집 데이터 전체 + 스크린샷 경로 + 브리프
  │
  │  1단계: 정보 구조 분석 (에이전트 판단)
  │         → navigation 데이터 + nav_*.png 스크린샷 활용
  │  2단계: 사용자 동선 분석 (에이전트 판단)
  │         → pages[main] 콘텐츠 + main_*.png 스크린샷 활용
  │  3단계: 콘텐츠 전략 분석 (에이전트 판단)
  │         → features_*.png 스크린샷으로 레이아웃 패턴 확인
  │  4단계: 인터랙션 패턴 분석 (에이전트 판단)
  │  5단계: 톤앤매너 분석 (에이전트 판단)
  │         → 스크린샷의 시각적 톤 (색상, 여백, 이미지 스타일)
  │  6단계: 시각 디자인 비교 분석 (에이전트 판단, v4.0 신규)
  │         → 서비스 간 스크린샷 교차 비교
  │         → 레이아웃, 시각적 위계, 색상 전략, 컴포넌트 패턴
  │  → research/temp/uxui-visual-notes.md에 과정 메모
  │
  │  ┌─ 7단계: UXUI 비교표 생성 ──────────────────────────┐
  │  │                                                    │
  │  │  [build-uxui-comparison 스킬 호출]                   │
  │  │   Step 1: 정량 비교표                                │
  │  │           Mailchimp: GNB 5, depth 2, CTA "Start Free" │
  │  │           HubSpot: GNB 7, depth 3, CTA "Get a Demo"  │
  │  │   Step 2: 정성 비교표                                │
  │  │           Mailchimp: 기능 중심 / 무료 체험 / 친근한    │
  │  │           HubSpot: 솔루션 중심 / 데모 요청 / 전문적    │
  │  │   Step 3: 시각 비교표 (v4.0 신규)                     │
  │  │           Mailchimp: 중앙 집중 / 일러스트 중심 /      │
  │  │             브랜드 컬러 강조 / 라운드                  │
  │  │             [참조: mailchimp/main_hero.png]           │
  │  │           HubSpot: 좌우 분할 / 제품 스크린샷 중심 /   │
  │  │             모노톤 / 샤프                             │
  │  │             [참조: hubspot/main_hero.png]             │
  │  │   Step 4: 패턴 도출                                  │
  │  │           공통: 무료 체험 CTA 71% → 업계 표준          │
  │  │           시각: 제품 스크린샷 Hero 64% → 시각 트렌드   │
  │  │           차별: 시나리오 기반 복잡도 처리 (2개 서비스)   │
  │  │           조합: 솔루션 중심 + 제품 스크린샷 + 전문적    │
  │  │                 = 엔터프라이즈 패턴 (3개 서비스)       │
  │  │                                                    │
  │  └────────────────────────────────────────────────────┘
  │
  │  8단계: 트렌드 + 시사점 (에이전트 판단)
  │
  │  visual_verification_needed: 
  │    [{HubSpot, "대시보드 레이아웃", "로그인 후 화면"}, 
  │     {Mailchimp, "이메일 에디터 UI", "로그인 후 화면"}]
  │  status: "complete"
  │  temp_artifacts: [research/temp/uxui-visual-notes.md]
  │
  ▼
═══════════════════════════════════════════════════════════
Report Writer 호출
═══════════════════════════════════════════════════════════
  │
  │  입력:
  │  - Feature Analyzer 출력 (feature_analysis + feature_matrix)
  │  - UXUI Analyzer 출력 (uxui_analysis + uxui_comparison 
  │    + 시각 비교표 + 스크린샷 참조)
  │  - 원본 브리프
  │
  │  스킬 없음. 에이전트 판단으로 종합 리포트 작성.
  │
  │  리포트 내에서:
  │  - build-feature-matrix의 매트릭스와 통계를 기능 비교 섹션에 포함
  │  - build-uxui-comparison의 비교표와 패턴을 UXUI 비교 섹션에 포함
  │  - 시각 비교표와 함께 대표 스크린샷을 마크다운 이미지로 참조
  │    예: ![Mailchimp Hero](../../research/screen/mailchimp/main_hero.png)
  │  - 두 스킬 출력의 교차점에서 종합 시사점 도출
  │    (예: "필수 기능 28개 중 UXUI 공통 패턴과 결합하면 
  │          무료 체험 기반 온보딩이 업계 표준")
  │
  ▼
═══════════════════════════════════════════════════════════
Orchestrator — 산출물 체크리스트 확인
═══════════════════════════════════════════════════════════
  │  ✅ 14개 서비스 분석 완료
  │  ✅ 기능 비교 매트릭스 포함 (build-feature-matrix)
  │  ✅ UXUI 비교표 포함 (build-uxui-comparison)
  │  ✅ 시각 비교표 포함 (v4.0 신규)
  │  ✅ 종합 시사점 도출
  │  ✅ Mailchimp, HubSpot 포함
  │  ✅ 스크린샷 인덱스 최신 상태 (140장)
  │  ✅ HTML 인덱스 최신 상태 (52파일)
  │  ✅ 과정 기록 존재 (research/temp/)
  │
  ▼
[사람에게 전달]

  산출물 파일:
  - report/research/brief.md
  - report/research/service-list.md
  - report/research/feature-analysis.md
  - report/research/uxui-analysis.md
  - report/research/benchmark-report.md

  중간 산출물:
  - research/screen/ — 서비스별 스크린샷 140장
  - research/screen/_index.md — 스크린샷 인덱스
  - research/html/ — 수집 페이지 HTML 원본 52개
  - research/html/_index.md — HTML 파일 인덱스
  - research/temp/search-log.md — 검색 수행 기록
  - research/temp/crawl-log.md — 수집 수행 기록
  - research/temp/feature-extraction-notes.md — 기능 추출 과정 메모
  - research/temp/uxui-visual-notes.md — 시각 분석 과정 메모
  - research/temp/orchestrator-decisions.md — Orchestrator 판단 기록

  "벤치마킹 리포트입니다. 14개 서비스를 분석했습니다.
   
   핵심 발견:
   - AI 캠페인 자동화는 아직 초기 단계이나 빠르게 성장 중
   - 이메일 중심 vs 옴니채널 접근 중 방향 선택이 필요합니다
   - 국내 서비스는 기능 범위가 좁지만 한국 시장 특화가 강점
   - 시각 디자인에서 '제품 스크린샷 Hero + 무료 체험 CTA' 
     조합이 업계 트렌드입니다
   
   판단이 필요한 사항:
   - 이메일 마케팅 중심 vs 옴니채널 마케팅 중 방향
   - AI 기능의 우선순위 (콘텐츠 생성 vs 타겟팅 최적화 vs 성과 예측)
   
   시각적 확인이 필요한 항목:
   - HubSpot 대시보드 레이아웃 (로그인 후 화면)
   - Mailchimp 이메일 에디터 UI (로그인 후 화면)
   (해당 서비스에 직접 접속하여 확인을 권장합니다)

   중간 산출물 안내:
   - research/screen/ — 서비스별 스크린샷 140장이 저장되어 있습니다.
     리포트에서 참조하지 않은 스크린샷도 직접 열어 확인할 수 있습니다.
   - research/html/ — 수집한 페이지 원본 HTML 52개가 저장되어 있습니다.
   - research/temp/ — 분석 과정 기록이 저장되어 있습니다.
     각 에이전트의 판단 근거와 검색·수집 기록을 확인할 수 있습니다.

   추가 분석이 필요하다면:
   - 특정 서비스의 심층 분석
   - 빠진 경쟁사 추가
   - 특정 기능 영역 집중 분석
   
   알려주시면 해당 부분을 보강하여 다시 실행하겠습니다."
```

---

## 9. 반복 실행 시나리오 (스킬 단위)

### 시나리오 A — 서비스 추가

```
[사람] "Salesforce Marketing Cloud도 분석에 넣어줘."

→ Orchestrator: Service Scout 호출 (command=collect_additional)
  → [crawl-page 스킬] × 3~4페이지
     → HTML 저장: research/html/salesforce-marketing-cloud/*.html
  → [capture-screenshots 스킬] × 2~3페이지
     → 스크린샷 저장: research/screen/salesforce-marketing-cloud/*.png
  → [scan-navigation 스킬] × 1
     → nav 스크린샷 포함
  → 기존 데이터에 병합
  → 인덱스 파일 갱신

→ Orchestrator: Feature Analyzer 재호출
  → 기능 추출 + 분류 (에이전트 판단, 추가 서비스만)
  → [build-feature-matrix 스킬 재호출] (전체 서비스 대상으로 매트릭스 재생성)
  → 시사점 업데이트
  → research/temp/feature-extraction-notes.md 갱신

→ Orchestrator: UXUI Analyzer 재호출
  → UXUI 분석 (에이전트 판단, 추가 서비스 + 스크린샷 활용)
  → [build-uxui-comparison 스킬 재호출] (전체 서비스 대상으로 비교표 재생성,
     시각 비교표 포함)
  → 시사점 업데이트
  → research/temp/uxui-visual-notes.md 갱신

→ Orchestrator: Report Writer 재호출
  → 보강된 리포트 생성 (추가 서비스 스크린샷 참조 포함)
```

### 시나리오 B — 특정 관점 심층 분석

```
[사람] "AI 캠페인 자동화 기능 부분만 더 깊이 분석해줘."

→ Orchestrator: Service Scout 호출 (command=collect_additional)
  → 기존 서비스들의 AI 관련 하위 페이지 추가 수집
  → [crawl-page 스킬] AI 기능 페이지 URL들
     → HTML 저장
  → [capture-screenshots 스킬] AI 기능 상세 페이지 캡처
     → AI 관련 UI 스크린샷 추가 확보

→ Orchestrator: Feature Analyzer 재호출
  → AI 기능 카테고리 심층 분석 (에이전트 판단)
  → [build-feature-matrix 스킬 재호출] (AI 기능에 한정된 상세 매트릭스)

→ Orchestrator: Report Writer 재호출
  → AI 기능 심층 분석 섹션 보강
```

### 시나리오 C — 방향 수정

```
[사람] "B2C 마케팅 쪽으로 다시 벤치마킹해줘."

→ Orchestrator: 키워드를 B2C 방향으로 재설정
  → research/temp/orchestrator-decisions.md에 방향 수정 판단 기록

→ Service Scout부터 전체 재실행
  → [search-services 스킬] 새 키워드
  → [crawl-page 스킬] × 새 서비스들 → 새 HTML 저장
  → [capture-screenshots 스킬] × 새 서비스들 → 새 스크린샷 저장
  → [scan-navigation 스킬] × 새 서비스들

→ Feature Analyzer 전체 재실행
  → [build-feature-matrix 스킬] 새 매트릭스

→ UXUI Analyzer 전체 재실행
  → [build-uxui-comparison 스킬] 새 비교표 (시각 비교표 포함)

→ Report Writer 전체 재실행
→ 새로운 리포트 생성
```

### 시나리오 D — 스크린샷 추가 요청 (v4.0 신규)

```
[사람] "Mailchimp의 가격 페이지랑 HubSpot의 
        연동 페이지 디자인도 캡처해줘."

→ Orchestrator: Service Scout 호출 (command=collect_additional)
  → additional_targets:
    [{Mailchimp, /pricing, needed_pages=["pricing"], 
      needed_screenshots=["pricing_hero", "pricing_table"]},
     {HubSpot, /integrations, needed_pages=["integrations"],
      needed_screenshots=["integrations_hero", "integrations_grid"]}]
  → [crawl-page 스킬] × 2페이지 → HTML 저장
  → [capture-screenshots 스킬] × 2페이지 → 스크린샷 저장
  → 인덱스 갱신

→ Orchestrator: UXUI Analyzer 재호출 (추가 스크린샷 포함)
  → 시각 분석 보강

→ Orchestrator: Report Writer 재호출
  → 추가 스크린샷 참조 포함 리포트 갱신
```

---

## 10. 산출물 파일 구조 (최종)

```
root/
├── research/
│   ├── screen/                        ← 스크린샷 이미지
│   │   ├── mailchimp/
│   │   │   ├── main_hero.png
│   │   │   ├── main_features_summary.png
│   │   │   ├── main_social_proof.png
│   │   │   ├── main_cta.png
│   │   │   ├── main_footer.png
│   │   │   ├── features_hero.png
│   │   │   ├── features_detail_01.png
│   │   │   ├── features_detail_02.png
│   │   │   ├── demo_overview.png
│   │   │   ├── nav_gnb_default.png
│   │   │   └── nav_gnb_products_expanded.png
│   │   ├── hubspot/
│   │   │   ├── main_hero.png
│   │   │   ├── ...
│   │   │   └── nav_gnb_solutions_expanded.png
│   │   ├── klaviyo/
│   │   │   └── ...
│   │   ├── stibee/
│   │   │   └── ...
│   │   └── _index.md                 ← 전체 스크린샷 인덱스
│   │
│   ├── html/                          ← 페이지 HTML 원본
│   │   ├── mailchimp/
│   │   │   ├── main.md
│   │   │   ├── main_snapshot.txt   (브라우저 사용 시)
│   │   │   ├── features.md
│   │   │   ├── features_snapshot.txt
│   │   │   ├── demo.md
│   │   │   └── use_cases.md
│   │   ├── hubspot/
│   │   │   └── ...
│   │   └── _index.md                 ← 전체 HTML 파일 인덱스
│   │
│   └── temp/                          ← 과정 중 검토 문서
│       ├── search-log.md              ← 검색 수행 기록
│       ├── crawl-log.md               ← 수집 수행 기록
│       ├── feature-extraction-notes.md ← 기능 추출 판단 근거 메모
│       ├── uxui-visual-notes.md       ← 시각 분석 해석 메모
│       └── orchestrator-decisions.md  ← Orchestrator 판단 기록
│
├── report/
│   └── research/
│       ├── brief.md                    ← 원본 브리프 (사람 작성)
│       ├── service-list.md             ← 서비스 목록 + 수집 데이터 (Service Scout)
│       │                                  search-services 출력 포함
│       │                                  crawl-page 출력 포함
│       │                                  scan-navigation 출력 포함
│       │                                  capture-screenshots 출력 포함
│       ├── feature-analysis.md         ← 기능 분석 결과 (Feature Analyzer)
│       │                                  build-feature-matrix 출력 포함
│       ├── uxui-analysis.md            ← UXUI 분석 결과 (UXUI Analyzer)
│       │                                  build-uxui-comparison 출력 포함
│       │                                  스크린샷 참조 링크 포함
│       ├── benchmark-report.md         ← 종합 리포트 (Report Writer)
│       │                                  대표 스크린샷 이미지 링크 포함
│       └── feedback/
│           ├── feedback-01.md          ← 사람의 1차 피드백
│           └── approved.md             ← 최종 승인 기록
```

---

## 11. 한계와 보강 방향

**UXUI 분석의 시각적 한계 (v4.0 개선)**: v3.0에서는 텍스트/DOM 구조 기반 분석만 가능했으나, v4.0에서 capture-screenshots 스킬과 scan-navigation의 스크린샷 캡처를 추가하여 시각 디자인 분석의 깊이를 확보했다. 레이아웃 패턴, Hero 구성, 색상 전략, 컴포넌트 스타일을 스크린샷 기반으로 비교할 수 있게 되었다. 다만 여전히 인터랙션 애니메이션, 마이크로 인터랙션, 반응형 동작, 로그인 후 화면은 스크린샷만으로 판단할 수 없다. 리포트에서 "시각적 확인 필요" 항목을 별도로 명시하여 사람이 직접 확인하도록 안내한다.

**수집 범위의 한계**: 공개 페이지만 수집 가능하다. 로그인 후 실제 서비스 화면, 유료 기능의 상세는 수집할 수 없다. crawl-page 스킬이 수집 성공/실패를 명확히 기록하고, 콘텐츠(.md)와 스냅샷이 research/html/에 보존되며, 시각적 레이아웃·디자인은 capture-screenshots의 스크린샷으로 보완되므로, 분석 단계에서 원본 데이터를 재확인할 수 있다.

**스크린샷 용량 관리**: 서비스당 평균 10장, 14개 서비스 기준 약 140장의 스크린샷이 생성된다. 프로젝트 규모가 커지면 디스크 용량과 인덱스 관리 부하가 증가한다. 현재는 인덱스 파일(_index.md)로 관리하되, 대규모 프로젝트에서는 별도의 에셋 관리 방안이 필요하다.

**검색 결과의 품질**: search-services 스킬의 5단계 검색 패턴이 검색 범위를 넓히지만, 니치 마켓 서비스는 여전히 발견이 어렵다. 사람이 must_include로 직접 지정하는 것이 중요하며, 반복 실행 구조가 이를 지원한다.

**서비스 간 수집 데이터 편차**: crawl-page 스킬이 수집 상태(success/partial/failed)와 콘텐츠 길이를 명시적으로 반환하므로, build-feature-matrix의 ? 표기와 결합하여 "이 서비스의 이 기능은 데이터 부족으로 판단 불가"를 투명하게 드러낸다. capture-screenshots 스킬도 캡처 성공/실패를 기록하므로, build-uxui-comparison의 "스크린샷 미확보" 표기와 연동된다. Feature Analyzer와 UXUI Analyzer의 data_needs 메커니즘(needed_screenshots 포함)이 이를 보완한다.

**스킬의 가드레일 한계**: 스킬은 절차의 일관성을 강제하지만, LLM 기반이므로 100% 준수를 보장하지 못한다. 특히 build-feature-matrix의 횡단 비교(기능 단위 순회)가 서비스 수가 15개를 넘어가면 컨텍스트 윈도우 제약으로 품질이 저하될 수 있다. 이 경우 서비스를 7~8개씩 나누어 두 번에 걸쳐 매트릭스를 생성하고 병합하는 방식을 고려해야 한다. capture-screenshots 스킬도 페이지가 매우 긴 경우 섹션 판단의 정확도가 떨어질 수 있다.

**중간 산출물의 활용**: research/temp/의 과정 기록(search-log, crawl-log, extraction-notes, visual-notes, orchestrator-decisions)은 리서치 과정의 투명성을 확보하고, 결과에 대한 의문이 있을 때 추적 가능하게 한다. research/html/의 콘텐츠(.md) 및 스냅샷은 분석 결과에 의문이 있을 때 원본 데이터를 재검증하는 용도로 활용한다. research/screen/의 스크린샷은 리포트에서 참조되지 않은 것도 사람이 직접 열어 시각적 맥락을 확인할 수 있다.

---