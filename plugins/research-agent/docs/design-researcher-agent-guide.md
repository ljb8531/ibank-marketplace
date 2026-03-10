# Design-Researcher 서브에이전트 가이드

벤치마킹 에이전트 워크플로우에서 **PHASE 2: 병렬 탐색**의 한 축을 담당하는 **design-researcher** 서브에이전트의 역할과 사용 스킬을 정의한 문서입니다.  
본 문서는 [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md)의 PHASE 2 및 design-researcher 설계를 기준으로 합니다.

---

## 1. PHASE 2: 병렬 탐색 — Design-Researcher의 역할

### 1-1. 위치와 책임

Design-researcher는 PHASE 2에서 **orchestrator**가 병렬로 기동하는 **3개 탐색 에이전트 중 하나**입니다.  
**디자인 인스피레이션(Design Inspiration)**을 발굴하는 데 전담하며, Awwwards·GDWEB·Behance 등 디자인 레퍼런스 소스에서 후보를 수집한 뒤, 각 후보에 대해 **스크린샷**과 **브랜딩/디자인 시스템 데이터**를 수집하여 **Inspire 유형 후보 4~5개**를 산출합니다.

| 구분 | 설명 |
|------|------|
| **입력** | orchestrator가 전달한 작업 지시서: **categories**(카테고리명 + 검색 키워드), **design_direction**(기존 스타일, 트렌드, 정보밀도, 비주얼포커스), **project.core_purpose** |
| **PHASE 2 산출** | **Inspire** 유형 후보 4~5개 + 스크린샷 + 브랜딩 데이터 (공통 출력 포맷 JSON + Inspire 전용 필드) |
| **실행 시점** | PHASE 2 — market-researcher, ux-researcher와 **동시에** 실행 |

### 1-2. Orchestrator로부터 받는 전달 내용

| 항목 | 용도 |
|------|------|
| **categories** | 카테고리명 + search_keywords — Awwwards, GDWEB, Behance 등 각 소스의 `site:` 검색 쿼리 베이스 |
| **design_direction** | current_style(기존 사이트 스타일), industry_trend(업종 디자인 트렌드), info_density(높음/보통/낮음), visual_focus(비주얼 중심/기능 중심/균형). 후보 선정 시 프로젝트 적합성·구현 가능성 판단에 사용 |
| **project.core_purpose** | 프로젝트 핵심 목적 — 선정 사유(design_strength)와 RFP 적합성 검토에 참고 |

### 1-3. design_direction 구조 (참조)

context-builder가 프로젝트 브리프에 채운 design_direction은 orchestrator를 거쳐 그대로 전달됩니다.

```json
{
  "current_style": "기존 사이트 스타일 (리뉴얼 시)",
  "industry_trend": "업종 디자인 트렌드",
  "info_density": "높음 | 보통 | 낮음",
  "visual_focus": "비주얼 중심 | 기능 중심 | 균형"
}
```

이 값을 활용해 “정보 밀도·페이지 구조가 RFP와 유사한 사이트”를 우선 선별하고, 선정 사유를 구체적으로 작성합니다.

### 1-4. 수행 절차 (5가지 소스)

반드시 **5가지 소스를 순서대로** 탐색합니다.

#### 소스 1: Awwwards (핵심 소스)

- **역할:** `site:awwwards.com [카테고리]` 검색으로 Site of the Day, Honorable Mention 등 수상 이력 확인. 4개 항목(디자인, 사용성, 창의성, 콘텐츠) 평균 7점 이상 사이트 우선 선별.
- **스킬:** `/multi-search` — 한·영 검색 키워드와 카테고리 조합.
- **산출:** 후보 리스트에 URL·서비스명·수상 이력 추가.

#### 소스 2: GDWEB / 디비컷 (국내 필수)

- **역할:** 국내 웹 디자인 트렌드·수상작 확인. `site:gdweb.co.kr [카테고리]`, `site:dbcut.com [카테고리] 웹사이트` 검색.
- **스킬:** `/multi-search`.
- **산출:** 국내 후보 확보 — **국내 소스 최소 1개 포함** 조건 충족용.

#### 소스 3: Behance / Dribbble

- **역할:** `site:behance.net [카테고리] website redesign live` 검색. **실제 라이브 URL이 있는 프로젝트만** 선별. Dribbble은 UI 컴포넌트 단위 시각 스타일 참고용으로만 활용.
- **스킬:** `/multi-search`.
- **산출:** 라이브 URL이 확인된 후보만 후보 리스트에 추가.

#### 소스 4: CSS Design Awards / FWA

- **역할:** `site:cssdesignawards.com [카테고리]` 검색. 고도의 인터랙션이 요구되는 프로젝트면 FWA도 함께 검색.
- **스킬:** `/multi-search`.
- **산출:** 인터랙션·비주얼 우수 후보 추가.

#### 소스 5: 비주얼 자산 수집

- **역할:** 확보된 후보 사이트 각각에 대해 데스크톱/모바일 스크린샷 캡처, 디자인 시스템(컬러·폰트·스페이싱 등) 및 페이지 레이아웃 구조 추출.
- **스킬:** `/screenshot-capture`, `/branding-extract`.
- **산출:** 각 후보별 `screenshots`, `branding`(디자인 시스템 + layout) 객체 및 저장 경로.

### 1-5. 확정 기준

- **프로젝트 적합성:** 정보 밀도·페이지 구조가 RFP(design_direction)와 유사한 사이트 우선.
- **구현 가능성:** 예산·기간 내 기술적으로 구현 가능한 수준인지 판단.
- **선정 사유 구체성:** “예쁘다”가 아닌 “마이크로 인터랙션 우수”, “직관적 IA”, “타이포그래피 계층 명확” 등 **구체적 디자인 강점**을 design_strength에 명시.
- **국내 소스 최소 1개 포함** (소스 2에서 확보).
- **최근성:** 최근 2년 이내 수상/제작 사이트 우선.

### 1-6. 출력

- 각 후보를 프로젝트 **공통 출력 포맷**(`output-format` 규칙)에 맞춰 JSON으로 반환.
- **type**은 반드시 **"Inspire"**로 지정.
- **Inspire 유형 필수 추가 필드:**
  - `screenshots`: { desktop_full, desktop_fold, mobile_full, mobile_fold } (이미지 경로)
  - `branding`: { colorScheme, colors, fonts, typography, spacing, components, **layout** }
  - `design_strength`: 구체적 디자인 강점 서술

### 1-7. PHASE 2 내 역할 요약

| 항목 | 내용 |
|------|------|
| **목적** | 디자인 인스피레이션(Inspire) 후보 4~5개 발굴 + 스크린샷·브랜딩 데이터 수집 |
| **소요 시간** | PHASE 2 전체 15~25분 중 일부 (market/ux-researcher와 병렬) |
| **성공 조건** | 5가지 소스 탐색 완료, screenshot-capture·branding-extract로 비주얼 자산 수집, 4~5개 Inspire 후보를 공통 포맷·Inspire 전용 필드와 함께 반환 |

---

## 2. PHASE 2에서 사용할 스킬

Design-researcher 에이전트에는 **multi-search**, **screenshot-capture**, **branding-extract** 세 스킬이 지정됩니다.  
**multi-search**는 공통 스킬이며, **screenshot-capture**와 **branding-extract**는 design-researcher의 비주얼 자산 수집에 필수입니다.

### 2-1. 필수 스킬: multi-search

| 항목 | 설명 |
|------|------|
| **스킬 이름** | `multi-search` |
| **사용 시점** | 소스 1~4 — Awwwards, GDWEB, 디비컷, Behance, CSS Design Awards, FWA 등 site: 검색 |
| **용도** | 단일 쿼리를 Brave Search 한·영 병렬 실행 후 통합·필터링·재검색. 디자인 레퍼런스 플랫폼 탐색, 카테고리별 수상작·라이브 사이트 검색에 사용. |
| **필수 여부** | **필수** — 5가지 소스 대부분이 검색 기반이므로 미사용 시 Inspire 후보 수집이 불가능. |

**사용 방법 요약**

- 브리프의 `categories`(한·영 검색 키워드)와 각 소스별 쿼리 템플릿을 조합해 `/multi-search` 호출.
- `site:awwwards.com`, `site:gdweb.co.kr`, `site:behance.net` 등 **site:** 연산자 포함 쿼리는 한·영 변환 없이 **동일 쿼리**로만 검색.
- 스킬 문서: [.cursor/skills/multi-search/SKILL.md](../.cursor/skills/multi-search/SKILL.md).

**공통 스킬 적용**

- multi-search는 context-builder, orchestrator, market-researcher, ux-researcher 등에서도 공통 사용됩니다.
- Design-researcher에서는 **디자인 레퍼런스 플랫폼·수상작·라이브 URL** 검색이라는 **Inspire 후보 탐색용** 목적으로 집중 사용합니다.

### 2-2. 필수 스킬: screenshot-capture

| 항목 | 설명 |
|------|------|
| **스킬 이름** | `screenshot-capture` |
| **사용 시점** | 소스 5(비주얼 자산 수집) — 확보된 각 후보 URL에 대해 실행 |
| **용도** | 웹사이트의 데스크톱/모바일 스크린샷을 자동 캡처. Firecrawl의 screenshot 포맷으로 fullPage 캡처 후, 이미지를 output/screenshots/{서비스명}/ 하위에 저장. 디자인 벤치마킹용 비주얼 자산 수집. |
| **필수 여부** | **필수** — Inspire 유형은 최종 리포트·스크린샷 갤러리에 사용되므로, 캡처 없이는 산출물이 불완전함. |

**사용 방법 요약**

- **입력:** 캡처할 후보 URL.
- **실행:** Firecrawl MCP의 `firecrawl_scrape` — formats: ["screenshot"], fullPage: true. 데스크톱·모바일(mobile: true) 각각 실행 후, 반환된 URL에서 이미지 다운로드하여 `output/screenshots/{서비스명}/desktop_full.png`, `mobile_full.png` 등으로 저장.
- **출력:** `screenshots`: { desktop_full, desktop_fold, mobile_full, mobile_fold } 경로를 Inspire 후보 JSON에 포함.
- **참고:** screenshot-capture 스킬은 [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md) 내 “Skill ③: screenshot-capture” 절에 상세 정의되어 있습니다. 프로젝트에 `.cursor/skills/screenshot-capture/SKILL.md`가 있으면 해당 문서를 우선 참조.

**공통 스킬 적용**

- screenshot-capture는 워크플로우 상 **design-researcher**에서만 사용됩니다. 최종 benchmark-report 단계에서 output/screenshots/ 경로를 참조합니다.

### 2-3. 필수 스킬: branding-extract

| 항목 | 설명 |
|------|------|
| **스킬 이름** | `branding-extract` |
| **사용 시점** | 소스 5(비주얼 자산 수집) — 확보된 각 후보 URL에 대해 실행 |
| **용도** | 웹사이트의 **디자인 시스템**(컬러, 폰트, 타이포그래피, 스페이싱, 컴포넌트 스타일)과 **페이지 레이아웃 구조**(GNB·히어로·그리드·캐로셀·푸터 등 섹션 순서·타입)를 표준화된 JSON으로 추출. Firecrawl branding·images 스크래핑 및 레이아웃용 JSON 스키마 추출 후 `output/branding/{서비스명}.json` 저장. 디자인 시스템·레이아웃 비교 분석용. |
| **필수 여부** | **필수** — Inspire 후보의 branding 필드 및 최종 리포트의 디자인 시스템·레이아웃 비교에 사용되므로, 미수집 시 산출물이 불완전함. |

**사용 방법 요약**

- **입력:** 추출 대상 후보 URL.
- **실행:** Firecrawl MCP의 `firecrawl_scrape` — formats: ["branding", "images"]. (선택) 동일 URL에 `formats: ["json"]` + `jsonOptions`(레이아웃용 prompt·schema)로 한 번 더 호출하거나, `firecrawl_extract`로 레이아웃만 추출. branding 객체와 레이아웃을 합쳐 `output/branding/{서비스명}.json` 저장.
- **레이아웃 스키마:** 상단→하단 순서의 `sections[]` 배열. 각 섹션: `order`, `type`(gnb|hero|grid|carousel|footer 등), `position`, `grid`(예: 4x4), `aside`(position·component, 예: 오른쪽 로그인), `scroll`(horizontal|vertical), `description`.
- **출력:** `branding`: { colorScheme, colors, fonts, typography, spacing, components, **layout**: { viewport, sections } } 를 Inspire 후보 JSON에 포함.
- **참고:** branding-extract 스킬은 [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md) 내 “Skill ⑤: branding-extract” 절에 상세 정의되어 있습니다. 프로젝트에 `.cursor/skills/branding-extract/SKILL.md`가 있으면 해당 문서를 우선 참조.

**공통 스킬 적용**

- branding-extract는 워크플로우 상 **design-researcher**에서만 사용됩니다. benchmark-report 스킬이 output/branding/ 디렉터리의 JSON을 읽어 디자인 시스템 비교표를 생성할 수 있습니다.

### 2-4. 스킬 요약 표

| 스킬 | PHASE 2 사용 여부 | 용도 |
|------|-------------------|------|
| **multi-search** | ✅ 사용 (소스 1, 2, 3, 4) | Awwwards, GDWEB, 디비컷, Behance, CSS Design Awards, FWA 등 디자인 레퍼런스 검색 |
| **screenshot-capture** | ✅ 사용 (소스 5) | 후보 사이트별 데스크톱/모바일 스크린샷 캡처 및 저장 |
| **branding-extract** | ✅ 사용 (소스 5) | 후보 사이트별 디자인 시스템(컬러, 폰트, 스페이싱 등) 및 페이지 레이아웃 구조 추출·JSON 저장 |

---

## 3. Design-Researcher 에이전트 설정 (참조)

PHASE 2를 수행하는 design-researcher 서브에이전트는 아래와 같이 스킬·MCP를 갖는 것을 전제로 합니다.  
(실제 에이전트 파일은 [.cursor/agents/design-researcher.md](../.cursor/agents/design-researcher.md) 참조.)

| 항목 | 값 |
|------|-----|
| **MCP 서버** | brave-search, firecrawl |
| **스킬** | multi-search, screenshot-capture, branding-extract |
| **도구** | Read, Write, Bash, Grep, Glob |

- **brave-search:** multi-search의 Brave 검색 호출에 사용.
- **firecrawl:** screenshot-capture(스크린샷 포맷), branding-extract(branding·images 포맷)에서 firecrawl_scrape 호출에 사용.

**참고:** `screenshot-capture`, `branding-extract` 스킬이 `.cursor/skills/` 하위에 별도 SKILL.md로 없을 수 있습니다. 이 경우 [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md) 내 “Skill ③: screenshot-capture”, “Skill ⑤: branding-extract” 절의 정의를 실행 절차로 따릅니다.

---

## 4. 관련 문서

- [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md) — 전체 워크플로우, PHASE 2 병렬 탐색, 서브에이전트·스킬 목록, screenshot-capture·branding-extract 상세
- [.cursor/agents/design-researcher.md](../.cursor/agents/design-researcher.md) — Design-researcher 에이전트 YAML 및 5가지 소스 상세
- [.cursor/skills/multi-search/SKILL.md](../.cursor/skills/multi-search/SKILL.md) — multi-search 스킬 상세
- [.cursor/rules/output-format.mdc](../.cursor/rules/output-format.mdc) (또는 워크플로우 가이드 내 output-format 규칙) — 공통 출력 포맷 및 Inspire 유형 필드(screenshots, branding, design_strength)
