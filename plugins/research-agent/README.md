# Website Benchmarking Research Agent

Cursor IDE 기반 **웹사이트 벤치마킹 리서치 에이전트**입니다.  
RFP, URL+한 줄 설명, 또는 단편 정보만 넣어도 에이전트가 자동으로 벤치마킹 대상 7~10개 사이트를 선정하고, 12항목 구조의 분석 리포트와 디자인 자산을 만들어 줍니다.

---

## 사전 준비

1. **Brave Search API 키**  
   [brave.com/search/api](https://brave.com/search/api/) 에서 발급 후 프로젝트 루트의 **`.env.mcp`** 에 `BRAVE_API_KEY` 값 입력

2. **Firecrawl API 키**  
   [firecrawl.dev/signup](https://www.firecrawl.dev/signup) 에서 발급 후 **`.env.mcp`** 에 `FIRECRAWL_API_KEY` 값 입력

   `.env.mcp` 예시:
   ```
   BRAVE_API_KEY=your_brave_api_key_here
   FIRECRAWL_API_KEY=your_firecrawl_api_key_here
   ```
   MCP 서버는 `envmcp`를 통해 이 파일에서 키를 읽습니다. 없으면 터미널에서 `npm install -g envmcp` 실행 후 `.env.mcp`를 생성하세요.

3. **스크립트 실행 권한**  
   ```bash
   chmod +x scripts/*.sh
   ```

4. **Cursor IDE**  
   이 프로젝트를 Cursor로 연 뒤 Agent(Cmd+K)로 `/start` 또는 `/run-benchmark` 사용

---

## 사용 방법

**권장:** Cursor에서 **`/start`** 커맨드를 사용합니다. 사용자 프롬프트에서 주제를 유추해 **상위 폴더**(예: `musinsa-renewal`, `grabelhotel-jeju-renewal`)를 만들고, 해당 폴더 하위에 `output/`과 산출물이 생성되므로 **주제별로 리포트와 자료가 분리**됩니다.

- **`/start`** 실행 시: (1) `.env.mcp` 확인 → (2) 프롬프트로부터 상위 폴더명 유추 → (3) 해당 폴더 생성 및 `.benchmark-output-root`에 경로 기록 → (4) `/run-benchmark` 호출
- **`/run-benchmark`** 만 호출해도 됩니다. 이때 `.benchmark-output-root`가 없거나 비어 있으면 프로젝트 루트의 `output/`을 사용합니다.
- 인풋은 **RFP 전체, URL+한 줄, 단편 정보** 중 어떤 형태든 가능합니다.

### 인풋 수준

| 수준 | 예시 | 에이전트 대응 |
|------|------|----------------|
| **Level 1 (최소)** | URL + "리뉴얼 해주세요" | 사이트·회사·시장 검색으로 자동 보강 |
| **Level 2 (단편)** | "교육 플랫폼, B2C, 20대 타겟" | 업종·기능·트렌드 검색으로 보강 |
| **Level 3 (요약)** | 기능 목록 + 타겟 + 예산 등 간략 브리프 | 최소 검색으로 검증·보완 |
| **Level 4 (완전)** | 정식 RFP 문서 | 직접 추출 + 카테고리/시장 검증 |

Level 1~2처럼 정보가 적어도 **context-builder**가 자동으로 보강한 뒤, 동일한 품질의 프로젝트 브리프로 이어집니다.

### 실행 예시

**시나리오 1: URL만 있는 경우 (Level 1)**  
```
/run-benchmark www.oliveyoung.co.kr 리뉴얼 해주세요
```

**시나리오 2: RFP 파일이 있는 경우 (Level 4)**  
```
/run-benchmark ./docs/rfp-education-platform.pdf
```

**시나리오 3: 요약 브리프를 직접 적는 경우 (Level 3)**  
```
/run-benchmark

프로젝트: 온라인 쇼핑몰 리뉴얼
목적: B2C 커머스, 기존 사이트 리뉴얼
타겟: 20~30대 여성
주요 기능: 상품 검색/필터, 개인화 추천, 간편 결제, 리뷰 시스템
서비스 모델: 직접 판매
국내 프로젝트
```

---

## 워크플로우 개요

```
[사용자]  /start (또는 /run-benchmark) + 인풋
       ↓
(선택)   상위 폴더 생성 + .benchmark-output-root 기록 → 해당 폴더 하위에 output/ 사용
       ↓
PHASE 0  context-builder  →  인풋 보강 + project-brief.json 생성
       ↓
PHASE 1  orchestrator     →  작업 분배 (카테고리·기능 포인트 확정)
       ↓
PHASE 2  market / ux / design-researcher  →  후보 사이트 병렬 탐색
       ↓
PHASE 3  site-auditor     →  제외 조건·보정 규칙 검증
       ↓
PHASE 4  orchestrator     →  최종 7~10개 선정 → report-writer  →  benchmark-report.md 등 생성
       ↓
[산출물]  {OUTPUT_BASE}/output/reports/, output/screenshots/, output/branding/, output/data/
```

- **소요 시간**: 인풋이 최소(Level 1)일 때 약 **36~60분**, 완전한 RFP(Level 4)일 때 약 **29~50분** (인력 대비 약 1/6~1/8 수준으로 단축)

---

## 산출물

실행이 끝나면 **현재 런의 OUTPUT_BASE** 하위에 결과가 쌓입니다. (`/start` 사용 시 OUTPUT_BASE = 상위 폴더 경로, 없거나 비어 있으면 `output`)

| 경로 | 내용 |
|------|------|
| `{OUTPUT_BASE}/output/reports/benchmark-report.md` | 벤치마킹 메인 리포트 (12항목 목차 + 부록) |
| `{OUTPUT_BASE}/output/reports/executive-summary.md` | 1페이지 경영진 요약 |
| `{OUTPUT_BASE}/output/reports/sections/` | report-writer 중간 산출물 (01-asis.md, 02-deepdive.md, 03-matrix.md, 04-insight.md) |
| `{OUTPUT_BASE}/output/screenshots/{서비스명}/` | 데스크톱/모바일 풀·접힌 스크린샷 |
| `{OUTPUT_BASE}/output/branding/{서비스명}.json` | 디자인 시스템·페이지 레이아웃 (branding-extract) |
| `{OUTPUT_BASE}/output/data/raw-input.txt` | 원본 인풋 |
| `{OUTPUT_BASE}/output/data/project-brief.json` | context-builder가 만든 프로젝트 브리프 |
| `{OUTPUT_BASE}/output/data/reference-codes.json` | 참조 코드 매핑 (PP-n, D-n 등, report-writer·스킬 공통) |
| `{OUTPUT_BASE}/output/data/candidates.json` | 전체 후보 데이터 로그 |

현재 런 경로는 프로젝트 루트의 **`.benchmark-output-root`** 파일에 한 줄로 기록됩니다. 주제가 바뀌면 `/start`로 새 상위 폴더를 만들면 이전 리포트와 분리되어 관리할 수 있습니다.

---

## 프로젝트 구조 요약

- **에이전트**: `context-builder`, `orchestrator`, `market-researcher`, `ux-researcher`, `design-researcher`, `site-auditor`, `report-writer` (`.cursor/agents/`)
- **스킬**: run-benchmark, multi-search, site-scrape, traffic-verify, screenshot-capture, branding-extract, report-asis, report-deepdive, report-matrix, report-insight, report-assemble (`.cursor/skills/`)
- **규칙**: 파일 저장·리포트 구조·검색 원칙·제외 조건·출력 포맷 (`.cursor/rules/`)

---

## 상세 문서

- **전체 설계·에이전트·스킬·Rule·Hook**: [docs/Agentic-Workflow-Guide.md](docs/Agentic-Workflow-Guide.md)
- 에이전트별 가이드: `docs/*-agent-guide.md`
- 스킬별 가이드: `docs/*-skill-guide.md`
