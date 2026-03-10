# Screenshot-Capture 스킬 가이드

벤치마킹 에이전트 워크플로우에서 **screenshot-capture** 스킬의 역할, 사용 방법, 구성 방법을 정리한 문서입니다.  
상위 설계서: [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md), [design-researcher-agent-guide.md](./design-researcher-agent-guide.md)

---

## 1. 역할 (Role)

### 1-1. 목적

**screenshot-capture**는 **웹사이트의 데스크톱/모바일 스크린샷을 자동으로 캡처하는 스킬**입니다.

- **핵심 가치:** 디자인 벤치마킹 시 **비주얼 자산 수집**에 사용됩니다. Inspire 유형 후보의 시각적 레퍼런스를 확보하여 최종 리포트·스크린샷 갤러리에 반영합니다.
- **워크플로우 내 위치:** PHASE 2의 **design-researcher**에서, 5가지 소스 탐색 후 확보한 각 후보 URL에 대해 **소스 5(비주얼 자산 수집)** 단계에서 실행됩니다.

### 1-2. 담당 기능

| 구분 | 내용 |
|------|------|
| **입력** | 캡처할 URL (후보 사이트 주소) |
| **실행 방식** | Firecrawl MCP의 `firecrawl_scrape` — formats: `["screenshot"]`, fullPage: true. 데스크톱·모바일(mobile: true) 각각 실행 후, 반환된 스크린샷 URL에서 이미지 다운로드하여 로컬 저장 |
| **출력** | `screenshots`: { desktop_full, desktop_fold, mobile_full, mobile_fold } 형태의 이미지 경로. Inspire 후보 JSON 및 최종 benchmark-report에서 참조 |
| **품질 보장** | 저장된 이미지가 10KB 미만이면 빈 페이지로 판단하여 status: "failed" 처리. Firecrawl 실패 시 최대 3회 재시도 |

### 1-3. 파일 규칙과의 관계

`.cursor/rules/file-conventions.mdc`에 정의된 스크린샷 저장 규칙을 따릅니다.

- **저장 경로:** `output/screenshots/{서비스명_영문소문자}/`
- **파일명:** `desktop_full.png`, `desktop_fold.png`, `mobile_full.png`, `mobile_fold.png`
- **서비스명 변환:** 공백 → 하이픈(-), 특수문자 제거, 소문자. 예: "29CM" → "29cm", "무신사 스토어" → "musinsa-store"

---

## 2. 사용 방법 (Usage)

### 2-1. 호출 방식

- **스킬 이름:** `screenshot-capture`
- **인자 힌트:** `[URL]`
- **사용 예:** `/screenshot-capture https://example.com`, `/screenshot-capture https://awwwards.com/sites/example-site`

**입력:** 캡처할 **후보 사이트의 전체 URL**을 넘깁니다. design-researcher가 소스 1~4에서 확보한 각 Inspire 후보 URL마다 한 번씩 호출합니다.

### 2-2. 서브에이전트별 사용처

#### Design-Researcher (PHASE 2)

| 단계 | 용도 | 설명 |
|------|------|------|
| **소스 5: 비주얼 자산 수집** | 후보별 스크린샷 캡처 | Awwwards, GDWEB, Behance 등에서 확보한 **각 후보 URL**에 대해 `/screenshot-capture` 실행 → 데스크톱/모바일 fullPage 캡처 후 `output/screenshots/{서비스명}/` 하위에 저장. 이어서 `/branding-extract`로 디자인 시스템 추출 |

- **필수 여부:** **필수.** Inspire 유형은 최종 리포트·스크린샷 갤러리에 사용되므로, 캡처 없이는 산출물이 불완전합니다.
- **호출 주체:** 워크플로우 상 **design-researcher에서만** 사용됩니다. context-builder, orchestrator, market-researcher, ux-researcher, site-auditor는 이 스킬을 사용하지 않습니다.

### 2-3. 공통 출력 포맷과의 연동

screenshot-capture의 출력은 프로젝트 **공통 출력 포맷**(`output-format.mdc`)의 Inspire 유형 **선택 필드** `screenshots`에 매핑됩니다.

- `screenshots.desktop_full`: 데스크톱 전체 페이지 스크린샷 경로
- `screenshots.desktop_fold`: 데스크톱 폴드 영역 스크린샷 경로 (선택)
- `screenshots.mobile_full`: 모바일 전체 페이지 스크린샷 경로
- `screenshots.mobile_fold`: 모바일 폴드 영역 스크린샷 경로 (선택)

design-researcher는 이 경로들을 Inspire 후보 JSON에 포함하여 orchestrator → benchmark-report 스킬로 전달합니다. benchmark-report는 `output/screenshots/` 경로를 참조해 마크다운 리포트에 이미지를 정리합니다.

---

## 3. 구성 방법 (Configuration)

### 3-1. 스킬 정의 파일 구조

스킬은 `.cursor/skills/screenshot-capture/SKILL.md`에 정의합니다. (해당 파일이 없으면 [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md) 내 "Skill ③: screenshot-capture" 절의 정의를 실행 절차로 따릅니다.)

```yaml
---
name: screenshot-capture
description: >
  웹사이트의 데스크톱/모바일 스크린샷을 자동 캡처하는 스킬.
  디자인 벤치마킹 시 비주얼 자산 수집에 사용.
argument-hint: [URL]
allowed-tools: Bash, Read, Write
---

# 스크린샷 캡처

## 입력
$ARGUMENTS = 캡처할 URL

## 실행 절차

### Step 1: 데스크톱 스크린샷
Firecrawl MCP의 firecrawl_scrape 도구를 사용한다.
- url: $ARGUMENTS
- formats: ["screenshot"]
- screenshot 옵션: fullPage: true

반환된 screenshot URL을 desktop_full로 기록한다.

### Step 2: 모바일 스크린샷
Firecrawl MCP의 firecrawl_scrape 도구를 사용한다.
- url: $ARGUMENTS
- formats: ["screenshot"]
- mobile: true
- screenshot 옵션: fullPage: true

반환된 screenshot URL을 mobile_full로 기록한다.

### Step 3: 이미지 저장
각 스크린샷 URL에서 이미지를 다운로드하여 output/screenshots/ 하위에 저장한다.
URL에서 서비스명을 추출하여 하위 폴더를 생성한다.

다운로드 명령:
curl -o output/screenshots/{서비스명}/desktop_full.png "{screenshot_url}"
curl -o output/screenshots/{서비스명}/mobile_full.png "{screenshot_url}"

## 출력 포맷
{
  "url": "$ARGUMENTS",
  "screenshots": {
    "desktop_full": "output/screenshots/{서비스명}/desktop_full.png",
    "mobile_full": "output/screenshots/{서비스명}/mobile_full.png"
  },
  "status": "success | partial | failed"
}

## 품질 체크
- 저장된 이미지 파일이 10KB 미만이면 빈 페이지로 판단하여 status: "failed" 처리
- Firecrawl 실패 시 3회 재시도
```

### 3-2. MCP 요구사항

| MCP 서버 | 사용 도구 | 용도 |
|----------|-----------|------|
| **firecrawl** | `firecrawl_scrape` | formats: `["screenshot"]`, fullPage: true. 데스크톱·모바일(mobile: true) 각각 호출하여 스크린샷 URL 획득 |

- **API 키:** Firecrawl API 키가 `.cursor/mcp.json`의 firecrawl 서버 설정에 필요합니다. (발급: https://www.firecrawl.dev/signup)

### 3-3. Skill — Subagent — MCP 매핑

| 구분 | 내용 |
|------|------|
| **스킬** | screenshot-capture |
| **사용 MCP 도구** | firecrawl: `firecrawl_scrape` (screenshot 포맷) |
| **호출하는 Subagent** | — (스킬 자체는 서브에이전트가 아님) |
| **사용하는 Subagent** | **design-researcher** (PHASE 2, 소스 5) |
| **사전 로딩 스킬** | design-researcher 에이전트에 multi-search, **screenshot-capture**, branding-extract 지정 |
| **MCP 서버** | design-researcher: brave-search, **firecrawl** |

### 3-4. Design-Researcher 에이전트 설정 (참조)

PHASE 2에서 screenshot-capture를 사용하는 design-researcher 서브에이전트는 아래 구성을 전제로 합니다.

| 항목 | 값 |
|------|-----|
| **MCP 서버** | brave-search, firecrawl |
| **스킬** | multi-search, **screenshot-capture**, branding-extract |
| **도구** | Read, Write, Bash, Grep, Glob |

- **firecrawl:** screenshot-capture에서 스크린샷 포맷 스크래핑, branding-extract에서 branding·images 포맷 스크래핑에 사용됩니다.

---

## 4. 관련 문서

- [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md) — 전체 워크플로우, PHASE 2 병렬 탐색, Skill ③ screenshot-capture 상세 정의
- [design-researcher-agent-guide.md](./design-researcher-agent-guide.md) — Design-researcher 역할, 5가지 소스, 소스 5 비주얼 자산 수집 절차
- [.cursor/agents/design-researcher.md](../.cursor/agents/design-researcher.md) — Design-researcher 에이전트 YAML
- [.cursor/rules/file-conventions.mdc](../.cursor/rules/file-conventions.mdc) — 스크린샷 저장 경로 및 서비스명 변환 규칙
- [.cursor/rules/output-format.mdc](../.cursor/rules/output-format.mdc) — 공통 출력 포맷, Inspire 유형 screenshots 필드
