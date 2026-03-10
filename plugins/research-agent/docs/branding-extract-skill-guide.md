# Branding-Extract 스킬 가이드

벤치마킹 에이전트 워크플로우에서 **branding-extract** 스킬의 역할, 사용 방법, 구성 방법을 정리한 문서입니다.  
상위 설계서: [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md), [design-researcher-agent-guide.md](./design-researcher-agent-guide.md)

---

## 1. 역할 (Role)

### 1-1. 목적

**branding-extract**는 **웹사이트의 디자인 시스템과 페이지 레이아웃 구조를 표준화된 JSON으로 추출하는 스킬**입니다.

- **핵심 가치:** 디자인 벤치마킹 시 **디자인 시스템 비교 분석** 및 **레이아웃 구조 비교**에 사용됩니다. Inspire 유형 후보의 컬러·폰트·타이포그래피·스페이싱·컴포넌트 스타일과, GNB·히어로·그리드·캐로셀·푸터 등 섹션 구성을 수집하여 최종 리포트에 반영합니다.
- **워크플로우 내 위치:** PHASE 2의 **design-researcher**에서, 5가지 소스 탐색 후 확보한 각 후보 URL에 대해 **소스 5(비주얼 자산 수집)** 단계에서 실행됩니다. screenshot-capture 실행 후 이어서 호출합니다.

### 1-2. 담당 기능

| 구분 | 내용 |
|------|------|
| **입력** | 추출 대상 URL (후보 사이트 주소) |
| **실행 방식** | Firecrawl MCP의 `firecrawl_scrape` — formats: `["branding", "images"]`. (선택) 레이아웃 추출 시 동일 URL에 `formats: ["json"]` + jsonOptions 또는 `firecrawl_extract`로 섹션 구조 추출 후 병합 |
| **출력** | `output/branding/{서비스명}.json` 저장. Inspire 후보 JSON의 `branding` 필드 및 benchmark-report의 디자인 시스템·레이아웃 비교표에 사용 |
| **품질 보장** | branding.colors.primary가 null이면 재시도 (최대 2회). fonts 배열이 비어 있으면 /site-scrape로 HTML에서 font-family 파싱 |

### 1-3. 파일 규칙과의 관계

- **저장 경로:** `output/branding/`
- **파일명:** `{서비스명}.json` (서비스명은 공백→하이픈, 특수문자 제거, 소문자 등 프로젝트 규칙 적용)
- **benchmark-report 연동:** 해당 디렉터리의 JSON을 읽어 디자인 시스템·레이아웃 비교표를 생성합니다.

---

## 2. 사용 방법 (Usage)

### 2-1. 호출 방식

- **스킬 이름:** `branding-extract`
- **인자 힌트:** `[URL]`
- **사용 예:** `/branding-extract https://example.com`, `/branding-extract https://awwwards.com/sites/example-site`

**입력:** 추출할 **후보 사이트의 전체 URL**을 넘깁니다. design-researcher가 소스 1~4에서 확보한 각 Inspire 후보 URL마다 한 번씩 호출합니다.

### 2-2. 서브에이전트별 사용처

#### Design-Researcher (PHASE 2)

| 단계 | 용도 | 설명 |
|------|------|------|
| **소스 5: 비주얼 자산 수집** | 후보별 디자인 시스템·레이아웃 추출 | 각 후보 URL에 대해 `/screenshot-capture` 실행 후 `/branding-extract` 실행 → branding·images 스크래핑 및 (선택) 레이아웃 JSON 추출 → `output/branding/{서비스명}.json` 저장 |

- **필수 여부:** **필수.** Inspire 유형의 branding 필드 및 최종 리포트의 디자인 시스템·레이아웃 비교에 사용되므로, 미수집 시 산출물이 불완전합니다.
- **호출 주체:** 워크플로우 상 **design-researcher에서만** 사용됩니다.

### 2-3. 공통 출력 포맷과의 연동

branding-extract의 출력은 프로젝트 **공통 출력 포맷**(`output-format.mdc`)의 Inspire 유형 **필수 필드** `branding`에 매핑됩니다.

- `branding.colorScheme`, `branding.colors`, `branding.fonts`, `branding.typography`, `branding.spacing`, `branding.components`, `branding.images`: 디자인 시스템
- `branding.layout`: 페이지 레이아웃 구조 (viewport, sections[])

design-researcher는 이 객체를 Inspire 후보 JSON에 포함하여 orchestrator → benchmark-report 스킬로 전달합니다.

---

## 3. 구성 방법 (Configuration)

### 3-1. 스킬 정의 파일 구조

스킬은 `.cursor/skills/branding-extract/SKILL.md`에 정의합니다. (해당 파일이 없으면 [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md) 내 "Skill ⑤: branding-extract" 절의 정의를 실행 절차로 따릅니다.)

```yaml
---
name: branding-extract
description: >
  웹사이트의 컬러, 폰트, 타이포그래피, 스페이싱, 컴포넌트 스타일 등
  디자인 시스템과 페이지 레이아웃 구조를 구조화된 데이터로 추출하는 스킬.
  디자인 벤치마킹 시 디자인 시스템·레이아웃 비교 분석에 사용.
argument-hint: [URL]
allowed-tools: Bash, Read, Write
---
```

### 3-2. 실행 절차

#### Step 1: Firecrawl branding·images 스크래핑

Firecrawl MCP의 `firecrawl_scrape` 도구를 사용합니다.

- **url:** 추출 대상 URL (`$ARGUMENTS`)
- **formats:** `["branding", "images"]`

#### Step 2: 디자인 시스템 데이터 정리

반환된 branding 객체에서 다음을 정리합니다.

| 항목 | 설명 |
|------|------|
| **colorScheme** | light / dark |
| **colors** | primary, secondary, accent, background, textPrimary 등 색상 코드 |
| **fonts** | 사용된 폰트 패밀리 목록 |
| **typography** | 폰트 사이즈(h1~body), weight, line-height |
| **spacing** | base unit, border-radius |
| **components** | 버튼 스타일(primary/secondary), 입력 필드 스타일 |
| **images** | 로고 URL, 파비콘 URL, OG 이미지 URL |

#### Step 3: (선택) 레이아웃 구조 추출

페이지 레이아웃을 표준화된 JSON으로 수집할 때는 다음 중 하나를 사용합니다.

- **방법 A:** 동일 URL에 `firecrawl_scrape` — formats: `["json"]`, jsonOptions: 레이아웃용 `prompt`·`schema`
- **방법 B:** `firecrawl_extract` — urls: [대상 URL], prompt: 레이아웃 추출 지시, schema: layout 스키마

**레이아웃 스키마 요약:** 상단→하단 순서의 `sections[]` 배열. 각 섹션에는 `order`, `type`(gnb|hero|grid|carousel|footer 등), `position`, `grid`(예: 4x4), `aside`(position·component, 예: 오른쪽 로그인), `scroll`(horizontal|vertical), `description`을 포함합니다.

#### Step 4: JSON 저장

정리한 디자인 시스템과 (추출한 경우) layout을 합쳐 `output/branding/{서비스명}.json`으로 저장합니다.

### 3-3. 출력 포맷

```json
{
  "url": "추출 대상 URL",
  "branding": {
    "colorScheme": "light | dark",
    "colors": {
      "primary": "#...",
      "secondary": "#...",
      "accent": "#...",
      "background": "#...",
      "textPrimary": "#..."
    },
    "fonts": [{ "family": "..." }],
    "typography": {
      "fontFamilies": {},
      "fontSizes": {},
      "fontWeights": {}
    },
    "spacing": { "baseUnit": 8, "borderRadius": "8px" },
    "components": { "buttonPrimary": {}, "buttonSecondary": {} },
    "images": { "logo": "url", "favicon": "url", "ogImage": "url" },
    "layout": {
      "viewport": "desktop",
      "sections": [
        {
          "order": 1,
          "type": "gnb",
          "position": "sticky_top",
          "description": "전역 내비게이션 바"
        },
        {
          "order": 2,
          "type": "hero",
          "description": "히어로 섹션"
        },
        {
          "order": 3,
          "type": "grid",
          "grid": "4x4",
          "aside": { "position": "right", "component": "login" },
          "description": "4열 그리드, 오른쪽 로그인"
        },
        {
          "order": 4,
          "type": "carousel",
          "scroll": "horizontal",
          "component": "product_cards",
          "description": "좌우 스크롤 상품 리스트"
        },
        {
          "order": 5,
          "type": "footer",
          "description": "푸터"
        }
      ]
    }
  },
  "saved_to": "output/branding/{서비스명}.json"
}
```

- **layout**은 레이아웃 추출을 수행한 경우에만 포함합니다. 생략 시 기존 디자인 시스템만 저장해도 됩니다.

### 3-4. 품질 체크

- **branding.colors.primary**가 null이면 재시도 (최대 2회).
- **fonts** 배열이 비어 있으면 `/site-scrape`로 HTML을 가져와 font-family를 직접 파싱하여 보완.

### 3-5. 필요한 MCP·도구

| 구분 | 내용 |
|------|------|
| **MCP 서버** | firecrawl (firecrawl_scrape, 필요 시 firecrawl_extract) |
| **allowed-tools** | Bash, Read, Write |
| **저장 경로 사전 생성** | `mkdir -p output/branding` (필요 시) |

---

## 4. 관련 문서

- [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md) — Skill ⑤: branding-extract 절, benchmark-report의 output/branding 참조
- [design-researcher-agent-guide.md](./design-researcher-agent-guide.md) — 소스 5 비주얼 자산 수집, 2-3. branding-extract
- [.cursor/rules/output-format.mdc](../.cursor/rules/output-format.mdc) — 공통 출력 포맷 및 Inspire 유형 branding 필드
