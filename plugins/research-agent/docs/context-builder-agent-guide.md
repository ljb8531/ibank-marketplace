# PHASE 0: Context-Builder 에이전트 가이드

벤치마킹 워크플로우의 **PHASE 0**을 담당하는 **context-builder** 서브에이전트의 역할과 사용 스킬을 정의한 문서입니다.  
상위 설계서: [Agentic-Workflow-Guide.md](./Agentic-Workflow-Guide.md)

---

## 1. Context-Builder의 역할

### 1-1. 목적

**최소한의 인풋**(URL 하나, 한 줄 설명, 단편 브리프, 또는 정식 RFP)만으로 **벤치마킹에 필요한 표준화된 프로젝트 브리프(project_brief)** 를 생성하는 것이 목적입니다.

- **실무 문제:** RFP가 깔끔하게 정리되어 들어오는 경우는 드물고, "저희 사이트 리뉴얼해주세요" + URL 하나 수준이 대부분입니다.
- **해법:** context-builder가 **인풋 품질 격차를 흡수**하고, PHASE 1(orchestrator) 이하는 항상 동일한 품질의 `project-brief.json`을 받도록 합니다.

### 1-2. 책임 범위

| 구분 | 내용 |
|------|------|
| **입력** | 원본 인풋 (URL, 한 줄 설명, 요약 브리프, RFP 문서 등) |
| **출력** | `output/data/project-brief.json` — 표준 프로젝트 브리프 JSON |
| **실행 시점** | `/run-benchmark` 호출 직후, **orchestrator보다 먼저** (PHASE 0) |
| **비개입 원칙** | 사용자에게 추가 질문하지 않음. 주어진 정보만으로 자율 판단·보강 |

### 1-3. 수행 단계 요약

1. **인풋 레벨 판별** — Level 1(URL만) ~ Level 4(완전 RFP) 중 분류  
2. **자율 정보 수집** — Level 1~2일 때만: 사이트 스크래핑, 회사/시장 검색, 리뉴얼·신규 구축별 추가 분석  
3. **프로젝트 브리프 생성** — 수집·추론 결과를 표준 JSON 스키마로 구조화  
4. **브리프 품질 자가 검증** — core_purpose, categories, features 최소 요건 충족 여부 확인  
5. **저장 및 반환** — `project-brief.json` 저장 후 orchestrator에 전달

---

## 2. 사용 스킬 정의

Context-builder는 **공통 스킬 2개**만 사용합니다. 둘 다 “정보 수집 → 브리프 필드 채우기”에 필수입니다.

---

### 2-1. 필수 스킬: `multi-search`

#### 역할

- **웹 검색**으로 회사/서비스 정보, 시장·업종 정보, 리뉴얼 시 사용자 불만, 신규 구축 시 업종 표준 기능 등을 수집합니다.
- context-builder는 **RFP가 없어도** 회사명·URL·한 줄 설명만으로 검색 쿼리를 만들어 정보를 보강해야 하므로, **multi-search는 필수**입니다.

#### Context-Builder에서의 사용처

| 단계 | 용도 | 예시 쿼리 |
|------|------|------------|
| Step 2-2 | 회사/서비스 정보 수집 | "[회사명] 회사 소개", "[서비스명] 뉴스", "[서비스명] 리뷰" |
| Step 2-3 | 산업/시장 구조 파악 | "[업종] 시장 규모", "[업종] 주요 플레이어", "[업종] 트렌드 2025" |
| Step 2-4 (리뉴얼) | 사용자 불만·개선 포인트 | "[서비스명] 불편", "[서비스명] 리뷰 단점" |
| Step 2-5 (신규 구축) | 업종 표준 기능 | "[업종] 필수 기능", "[업종] 웹사이트 기능 체크리스트" |
| Step 4 (자가 검증) | confidence 낮은 항목 보강 | 부족한 필드에 대한 추가 검색 1회 |

#### 스킬 요약 (공통 정의와 동일)

- **이름:** `multi-search`
- **설명:** 단일 쿼리를 Brave Search에서 한국어/영문 병렬 실행 후 결과 통합.
- **입력:** 검색 키워드 또는 쿼리.
- **동작:** Brave Search MCP `brave_web_search`로 한·영 각 10건 검색 → 중복 제거, confidence 태깅, 품질 필터링 → 결과 5개 미만이면 키워드 변형 후 최대 3회 재검색.
- **출력:** `{ url, title, snippet, source, confidence, rank }[]` 형태의 JSON 배열.

상세 스펙은 [Agentic-Workflow-Guide.md § Skill ① multi-search](./Agentic-Workflow-Guide.md) 참조.

---

### 2-2. 필수 스킬: `site-scrape`

#### 역할

- **URL이 주어진 경우** 해당 사이트의 콘텐츠·구조를 파악해, 회사명·서비스 유형·주요 기능·타겟·서비스 모델 등을 **추론**하는 데 사용합니다.
- RFP 없이 “이 URL 리뉴얼해주세요”만 들어와도 브리프를 채우려면 **실제 사이트 내용**이 필요하므로, **site-scrape는 URL이 있을 때 필수**입니다.

#### Context-Builder에서의 사용처

| 단계 | 용도 | 설명 |
|------|------|------|
| Step 2-1 | 기존 사이트 분석 | 메인 페이지 스크래핑 → 회사명, 서비스 유형, 메뉴(기능), 타겟·서비스 모델 추론 |
| Step 2-1 | 기능 범위 파악 | 하위 페이지 2~3개 추가 스크래핑 → 서비스 깊이·기능 범위 파악 |

#### 스킬 요약 (공통 정의와 동일)

- **이름:** `site-scrape`
- **설명:** 단일 URL의 콘텐츠를 마크다운으로 추출하고 사이트 구조(링크, 페이지 수)를 분석.
- **입력:** 스크래핑할 URL.
- **동작:** Firecrawl MCP `firecrawl_scrape`(markdown, links) + `firecrawl_map` → 주요 하위 페이지 3개 추가 스크래핑 → 기능 존재 여부 판단(검색/필터/로그인/결제 등).
- **출력:** `url`, `main_page_markdown`, `page_count`, `sub_pages`, `features_detected`, `content_length`, `has_dynamic_content` 등.

상세 스펙은 [Agentic-Workflow-Guide.md § Skill ② site-scrape](./Agentic-Workflow-Guide.md) 참조.

---

## 3. 스킬 사용 정리

| 스킬 | 필수 여부 | 사용 목적 |
|------|-----------|-----------|
| **multi-search** | **필수** | 회사/시장/업종/리뉴얼·신규 구축 정보 수집 및 브리프 보강 |
| **site-scrape** | **URL 있을 때 필수** | 기존 사이트 분석으로 브리프 필드 추론 (회사명, 기능, 타겟, 서비스 모델 등) |

- **다른 공통 스킬(traffic-verify, screenshot-capture, branding-extract, benchmark-report 등)**  
  - context-builder는 **프로젝트 브리프 생성**만 담당하므로 사용하지 않습니다.  
  - 트래픽 검증·스크린샷·브랜딩·리포트는 PHASE 2~4의 market-researcher, design-researcher, site-auditor, orchestrator가 사용합니다.

---

## 4. 에이전트 설정 요약

Context-builder 서브에이전트에 지정할 설정은 상위 설계서와 동일하게 두면 됩니다.

```yaml
# .cursor/agents/context-builder.md
---
name: context-builder
skills:
  - multi-search
  - site-scrape
mcpServers:
  - brave-search
  - firecrawl
# tools, model 등은 상위 설계서 참조
---
```

- **MCP:** `brave-search`(multi-search용), `firecrawl`(site-scrape용) 필요.
- **스킬:** 위 2개만 로딩하면 되며, 공통 스킬 중 적용할 만한 것은 **multi-search**, **site-scrape** 두 개입니다.

---

## 5. 참고: 인풋 레벨별 스킬 사용 강도

| 인풋 레벨 | site-scrape | multi-search |
|-----------|--------------|--------------|
| **Level 1** (URL만) | 메인 + 하위 2~3페이지 | 회사/시장/리뉴얼 또는 신규 보강 다수 |
| **Level 2** (단편 정보) | URL 있으면 동일 | 업종·기능·트렌드 보강 |
| **Level 3** (요약 브리프) | 선택적(URL 있을 때) | 카테고리·시장 검증 수준 |
| **Level 4** (완전 RFP) | 불필요 | 카테고리·시장 검증만 최소 사용 |

이 가이드에 정의한 역할과 스킬만으로도 PHASE 0 context-builder를 구현·운영할 수 있습니다. 상세 절차·브리프 JSON 스키마·자가 검증 규칙은 [Agentic-Workflow-Guide.md § context-builder](./Agentic-Workflow-Guide.md)를 참조하면 됩니다.
