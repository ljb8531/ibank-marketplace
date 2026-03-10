# Site-Scrape 스킬 가이드

벤치마킹 에이전트 워크플로우에서 **site-scrape** 스킬의 역할, 사용 방법, 구성 방법을 정리한 문서입니다.  
상위 설계서: [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md), [context-builder-agent-guide.md](./context-builder-agent-guide.md)

---

## 1. 역할 (Role)

### 1-1. 목적

**site-scrape**는 **단일 URL의 콘텐츠를 마크다운으로 추출하고, 사이트 구조(링크·페이지 수)를 분석하여 기능 존재 여부를 판단하는 스킬**입니다.

- **핵심 가치:** RFP나 상세 설명 없이 URL만 있어도, 실제 사이트 내용을 바탕으로 회사명·서비스 유형·주요 기능·타겟·서비스 모델 등을 **추론**할 수 있게 합니다.
- **워크플로우 내 위치:** 기존 사이트 분석, 후보 사이트의 콘텐츠·구조 확인, 제외 조건 검증(기능 미작동·분석 불가·App-only·폐쇄형 등)에 사용되는 **기반 스크래핑 스킬**입니다.

### 1-2. 담당 기능

| 구분 | 내용 |
|------|------|
| **입력** | 스크래핑할 URL (메인 페이지 또는 하위 페이지) |
| **실행 방식** | Firecrawl MCP `firecrawl_scrape`(markdown, links) + `firecrawl_map` → 주요 하위 페이지 추가 스크래핑 → 기능 존재 여부 판단 |
| **출력** | URL, 메인 페이지 마크다운, 페이지 수, 하위 페이지 목록, 감지된 기능, 콘텐츠 길이, 동적 콘텐츠 여부 등이 포함된 JSON |
| **품질 보장** | 마크다운 500자 미만 시 `status: "insufficient"` 태깅, `firecrawl_scrape` 실패 시 3회 재시도(간격 5초) |

### 1-3. 제외 조건·보정 규칙과의 관계

`.cursor/rules/exclusion-criteria.mdc`에 정의된 제외 조건 검증에서 **site-scrape 결과**가 직접 사용됩니다.

- **기능 미작동:** 마크다운 500자 미만, "Coming Soon", "Under Construction", "준비 중" 등 → FAIL
- **분석 불가:** 하위 페이지 3개 미만, 동적 기능(검색·필터·폼 등) 전혀 없음 → FAIL
- **App-only:** "앱 다운로드", "App Store", "Google Play" 안내만 있고 실질적 웹 콘텐츠 없음 → FAIL
- **폐쇄형:** 로그인/회원가입 없이 접근 가능한 콘텐츠가 메인 외에 없음 → FAIL
- **접근성·최신성:** 해외 사이트 지역 제한 여부, Copyright·최신 게시글 날짜 확인 → flag 또는 FAIL

---

## 2. 사용 방법 (Usage)

### 2-1. 호출 방식

- **스킬 이름:** `site-scrape`
- **인자 힌트:** `[URL]`
- **사용 예:** `/site-scrape https://www.example.com`, `/site-scrape https://competitor.co.kr/about`

단일 URL을 넘기면, 해당 URL의 메인 콘텐츠·링크·사이트맵 정보를 수집한 뒤 주요 하위 페이지까지 스크래핑합니다.

### 2-2. 서브에이전트별 사용처

#### Context-Builder (PHASE 0)

| 단계 | 용도 | 설명 |
|------|------|------|
| Step 2-1 | 기존 사이트 분석 | 메인 페이지 스크래핑 → 회사명, 서비스 유형, 메뉴(기능), 타겟·서비스 모델 추론 |
| Step 2-1 | 기능 범위 파악 | 하위 페이지 2~3개 추가 스크래핑 → 서비스 깊이·기능 범위 파악 |

- **필수 여부:** **URL이 주어졌을 때 필수.** RFP 없이 "이 URL 리뉴얼해주세요"만 들어와도 브리프를 채우려면 실제 사이트 내용이 필요합니다.

#### UX-Researcher (PHASE 2)

| 절차 | 용도 | 설명 |
|------|------|------|
| 절차 3 | 후보 사이트 직접 분석 | 각 후보에 대해 `/site-scrape` 실행 → 해당 기능의 동선 단계 수, 정보 구조, 마이크로 인터랙션 확인 및 "우리 프로젝트에 적용 가능한가?" 판단 |

- **필수 여부:** Indirect 후보 선정 시, 기능·UX 구현 방식을 검증하기 위해 사용합니다.

#### Site-Auditor (PHASE 3)

| 검증 항목 | 용도 | 설명 |
|-----------|------|------|
| 제외 2 | 기능 미작동 | 메인 페이지 스크래핑 → 마크다운 500자 미만 또는 "Coming Soon" 등 문구 포함 시 FAIL |
| 제외 3 | 분석 불가 | 사이트 구조 확인 → 하위 페이지 3개 미만 또는 동적 기능 전혀 없으면 FAIL |
| 제외 4 | App-only | 스크래핑 결과에서 앱 다운로드 안내만 있고 실질적 웹 콘텐츠 없으면 FAIL |
| 제외 5 | 폐쇄형 | 로그인/회원가입 없이 접근 가능한 콘텐츠가 메인 외 없으면 FAIL |
| 보정 2 | 접근성 확인 | 해외 사이트 실제 접속 → 지역 제한(Geoblocking)·언어 장벽 여부 확인 |
| 보정 3 | 최신성 검증 | Copyright 연도, 최신 게시글 날짜 확인 → 1년 내 업데이트 없으면 flag: stale |

- **필수 여부:** **필수.** 각 후보 사이트에 대해 제외 조건·보정 규칙 검증 시 반드시 사용합니다.

### 2-3. 인풋 레벨별 사용 강도 (Context-Builder 기준)

| 인풋 레벨 | site-scrape 사용 강도 |
|-----------|----------------------|
| **Level 1** (URL만) | 메인 + 하위 2~3페이지 스크래핑으로 브리프 추론에 활용 |
| **Level 2** (단편 정보) | URL이 있으면 Level 1과 동일하게 메인·하위 페이지 분석 |
| **Level 3** (요약 브리프) | URL이 있을 때만 선택적으로 사용 |
| **Level 4** (완전 RFP) | 불필요 (RFP에서 직접 추출) |

---

## 3. 구성 방법 (Configuration)

### 3-1. 스킬 정의 파일 구조

스킬은 `.cursor/skills/site-scrape/SKILL.md`에 정의합니다.

```yaml
---
name: site-scrape
description: >
  단일 URL의 콘텐츠를 마크다운으로 추출하고 사이트 구조를 분석하는 스킬.
  후보 사이트의 콘텐츠 확인, 하위 페이지 파악, 기능 존재 여부 확인 시 사용.
argument-hint: [URL]
allowed-tools: Bash, Read, Write
---

# 사이트 스크래핑

## 입력
$ARGUMENTS = 스크래핑할 URL

## 실행 절차

### Step 1: 메인 페이지 스크래핑
Firecrawl MCP의 firecrawl_scrape 도구를 사용한다.
- url: $ARGUMENTS
- formats: ["markdown", "links"]

### Step 2: 사이트 구조 파악
Firecrawl MCP의 firecrawl_map 도구를 사용한다.
- url: $ARGUMENTS

결과에서 하위 페이지 URL 리스트와 총 페이지 수를 추출한다.

### Step 3: 주요 하위 페이지 스크래핑
firecrawl_map 결과에서 주요 하위 페이지 3개를 선별하여 각각 firecrawl_scrape를 실행한다.
선별 기준: 메뉴/네비게이션에 표시되는 핵심 페이지 우선

### Step 4: 기능 존재 여부 판단
스크래핑 결과의 마크다운 콘텐츠를 분석하여 다음을 판단한다:
- 검색 기능 유무
- 필터/정렬 기능 유무
- 회원가입/로그인 폼 유무
- 결제/예약 프로세스 유무
- 동적 인터랙션 유무

## 출력 포맷
{
  "url": "$ARGUMENTS",
  "main_page_markdown": "마크다운 텍스트 (첫 2000자)",
  "page_count": 숫자,
  "sub_pages": ["url1", "url2", "url3"],
  "features_detected": ["search", "filter", "login", ...],
  "content_length": 마크다운 전체 글자수,
  "has_dynamic_content": true/false
}

## 품질 체크
- 마크다운이 500자 미만이면 status: "insufficient"로 태깅
- firecrawl_scrape 실패 시 3회 재시도 (간격 5초)
```

### 3-2. MCP 서버 설정

site-scrape는 **Firecrawl MCP**만 사용합니다.

- **MCP 서버명:** `firecrawl`
- **사용 도구:** `firecrawl_scrape`, `firecrawl_map`
- **필요 환경 변수:** `FIRECRAWL_API_KEY` (Firecrawl API 키)

`.cursor/mcp.json` 예시:

```json
{
  "mcpServers": {
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "YOUR_FIRECRAWL_API_KEY"
      }
    }
  }
}
```

- **API 키 발급:** https://www.firecrawl.dev/signup
- **용량:** 무료 500페이지, 이후 유료 구간 ($14~/월)

### 3-3. 서브에이전트에 스킬·MCP 연결

site-scrape를 사용하는 서브에이전트는 **skills**에 `site-scrape`를, **mcpServers**에 `firecrawl`을 명시해야 합니다.

| Subagent | skills 항목 | mcpServers 항목 |
|----------|-------------|-----------------|
| **context-builder** | multi-search, site-scrape | brave-search, firecrawl |
| **ux-researcher** | multi-search, site-scrape | brave-search, firecrawl |
| **site-auditor** | site-scrape, traffic-verify | firecrawl |

- **orchestrator**, **market-researcher**, **design-researcher**는 site-scrape를 사용하지 않습니다 (각각 multi-search·traffic-verify·screenshot-capture·branding-extract 등 사용).

### 3-4. Skill — MCP 매핑 요약

| Skill | 사용 MCP 도구 | 호출 주체 (Subagent) |
|-------|----------------|------------------------|
| site-scrape | firecrawl: `firecrawl_scrape`, `firecrawl_map` | context-builder, ux-researcher, site-auditor |

### 3-5. 출력 포맷 상세

| 필드 | 타입 | 설명 |
|------|------|------|
| `url` | string | 스크래핑 대상 URL |
| `main_page_markdown` | string | 메인 페이지 마크다운 (첫 2000자) |
| `page_count` | number | firecrawl_map 기준 총 페이지 수 |
| `sub_pages` | string[] | 스크래핑한 주요 하위 페이지 URL 목록 (최대 3개) |
| `features_detected` | string[] | 감지된 기능 (예: search, filter, login, payment 등) |
| `content_length` | number | 마크다운 전체 글자수 |
| `has_dynamic_content` | boolean | 동적 인터랙션·기능 존재 여부 |
| `status` | string (선택) | 품질 이슈 시 `"insufficient"` 등 |

---

## 4. 요약

- **역할:** 단일 URL의 콘텐츠·구조를 Firecrawl로 추출·분석하고, 기능 존재 여부를 판단하는 공통 스크래핑 스킬. 제외 조건 검증의 근거로 사용됨.
- **사용:** context-builder(URL 있을 때 필수), ux-researcher(후보 사이트 분석), site-auditor(제외·보정 검증 필수)에서 호출. URL만 넘기면 됨.
- **구성:** `.cursor/skills/site-scrape/SKILL.md`에 YAML 프론트매터와 실행 절차·출력 포맷을 두고, 사용하는 각 서브에이전트의 `skills`에 `site-scrape`, `mcpServers`에 `firecrawl`을 넣고, `FIRECRAWL_API_KEY`를 설정하면 됨.

상세 워크플로우·제외 조건·다른 스킬 정의는 [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md)를 참조하면 됩니다.
