# Website Benchmarking Research Agent

Cursor IDE 기반 **웹사이트 벤치마킹 리서치 에이전트**입니다.  
RFP, URL+한 줄 설명, 또는 단편 정보만 넣어도 에이전트가 자동으로 벤치마킹 대상 7~10개 사이트를 선정하고, 분석 리포트와 디자인 자산을 만들어 줍니다.

---

## 사전 준비

1. **Brave Search API 키**  
   [brave.com/search/api](https://brave.com/search/api/) 에서 발급 후 `.cursor/mcp.json`에 설정

2. **Firecrawl API 키**  
   [firecrawl.dev/signup](https://www.firecrawl.dev/signup) 에서 발급 후 `.cursor/mcp.json`에 설정

3. **스크립트 실행 권한**  
   ```bash
   chmod +x scripts/*.sh
   ```

4. **Cursor IDE**  
   이 프로젝트를 Cursor로 열어 둔 상태에서 Agent(Cmd+K) 사용

---

## 사용 방법

Cursor **Composer(Agent 모드)** 에서 **run-benchmark 스킬**을 호출합니다.

- 채팅에 `/run-benchmark` 를 입력한 뒤, 인풋을 함께 적어 주면 됩니다.
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
[사용자]  /run-benchmark + 인풋
       ↓
PHASE 0  context-builder  →  인풋 보강 + project-brief.json 생성
       ↓
PHASE 1  orchestrator     →  작업 분배 (카테고리·기능 포인트 확정)
       ↓
PHASE 2  market / ux / design-researcher  →  후보 사이트 병렬 탐색
       ↓
PHASE 3  site-auditor     →  제외 조건·보정 규칙 검증
       ↓
PHASE 4  orchestrator     →  최종 7~10개 선정 + benchmark-report 생성
       ↓
[산출물]  output/reports/, output/screenshots/, output/branding/, output/data/
```

- **소요 시간**: 인풋이 최소(Level 1)일 때 약 **36~60분**, 완전한 RFP(Level 4)일 때 약 **29~50분** (인력 대비 약 1/6~1/8 수준으로 단축)

---

## 산출물

실행이 끝나면 다음 경로에 결과가 쌓입니다.

| 경로 | 내용 |
|------|------|
| `output/reports/benchmark-report.md` | 벤치마킹 테이블·분석 |
| `output/reports/executive-summary.md` | 1페이지 경영진 요약 |
| `output/screenshots/{사이트명}/` | 데스크톱/모바일 스크린샷 |
| `output/branding/{사이트명}.json` | 디자인 시스템·페이지 레이아웃 |
| `output/data/raw-input.txt` | 원본 인풋 |
| `output/data/project-brief.json` | context-builder가 만든 프로젝트 브리프 |
| `output/data/candidates.json` | 전체 후보 데이터 로그 |

---

## 상세 문서

- **전체 설계·에이전트·스킬·Rule·Hook**: [docs/Agentic-Workflow-Guide.md](docs/Agentic-Workflow-Guide.md)
