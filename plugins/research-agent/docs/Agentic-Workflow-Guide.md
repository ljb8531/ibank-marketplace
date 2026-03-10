# Website Benchmarking Research Agentic Workflow
## Cursor IDE 기반 완전 설계서

---

## 1. Research Agentic Workflow 전체 흐름

### 1-1. 워크플로우 개요

사용자로부터 **RFP(제안요청서), URL+한 줄 설명, 또는 단편적인 프로젝트 정보**를 입력받아, AI 에이전트가 자율적으로 벤치마킹 대상 7~10개 사이트를 선정하고, 분석 데이터와 디자인 자산이 포함된 구조화된 리포트를 산출하는 워크플로우입니다.

**인풋 수준에 대한 전제:** 현실적으로 RFP가 깔끔하게 정리되어 들어오는 경우는 극히 드뭅니다. "저희 사이트 리뉴얼해주세요" + URL 하나, 혹은 "이런 서비스 만들고 싶은데요" 수준의 단편 정보가 대부분이므로, **PHASE 0**에서 인풋의 품질 격차를 자율적으로 보상하는 **context-builder** 서브에이전트가 앞단에 배치됩니다.

### 1-2. 인풋 수준별 대응 (문제 진단)

현재 설계는 "RFP에서 핵심 4항목 추출"을 전제로 하지 않고, **어떤 수준의 인풋이든** PHASE 1에 필요한 구조화된 컨텍스트를 만들 수 있도록 합니다.

| 인풋 수준 | 예시 | PHASE 0 대응 |
|---|---|---|
| **Level 1 (최소)** | "www.abc.co.kr 리뉴얼 해주세요" | 사이트 스크래핑 + 회사/시장 검색으로 자동 보강 |
| **Level 2 (단편)** | "교육 플랫폼 만들건데, B2C, 20대 타겟" | 업종·기능·트렌드 검색으로 보강 |
| **Level 3 (요약)** | 기능 목록 + 타겟 + 예산 포함 간략 브리프 | 최소 검색으로 검증·보완 |
| **Level 4 (완전)** | 정식 RFP 문서 | 직접 추출 + 카테고리/시장 검증만 |

**Level 1~2가 실무의 70% 이상**이므로, PHASE 0의 context-builder가 이 격차를 흡수하고, 이후 PHASE 1~4는 항상 동일한 품질의 입력(프로젝트 브리프)을 받도록 설계합니다.

### 1-3. 전체 흐름도

```
[사용자] ──── /run-benchmark "www.abc.co.kr 리뉴얼" ────▶

PHASE 0: 컨텍스트 빌딩 (context-builder 서브에이전트)  ★ 신설
┌─────────────────────────────────────────────────────────┐
│  ① 인풋 레벨 판별 (URL만? 브리프? RFP?)                    │
│  ② 부족한 정보를 자율 서칭으로 보강                           │
│     - 회사 URL → 사이트 스크래핑 → 업종/서비스모델 추론         │
│     - 경쟁사 검색 → 시장 구조 파악                           │
│     - 뉴스/IR 검색 → 최근 동향/전략 방향 파악                 │
│  ③ 표준화된 "프로젝트 브리프" JSON 생성                      │
│     (핵심목적, 주요기능, 타겟, 서비스모델, 카테고리, 키워드)      │
└────────────┬────────────────────────────────────────────┘
             ▼
PHASE 1: 작업 분배 (orchestrator 서브에이전트)
┌─────────────────────────────────────────────────────────┐
│  ① 프로젝트 브리프 수신 및 검증                              │
│  ② 카테고리 검증 검색 실행                                   │
│  ③ Indirect 벤치마킹 기능 포인트 확정                        │
│  ④ 각 서브에이전트에 작업 지시서 전달                          │
└────────────┬────────────────────────────────────────────┘
             │
PHASE 2: 병렬 탐색 (기존과 동일)
     ┌───────┼───────────┐
     ▼       ▼           ▼
  market-  ux-       design-
  researcher researcher researcher
     │       │           │
     └───┬───┘───────────┘
         ▼
PHASE 3: 검증 (기존과 동일)
  site-auditor
         │
         ▼
PHASE 4: 최종 확정 + 리포트 (orchestrator 복귀)
  · PASS 후보 중 7~10개 확정
  · /benchmark-report 스킬 호출
  · 완료 보고 (input_level 명시)
             ▼
[산출물]
├── output/reports/benchmark-report.md     (벤치마킹 테이블 + 분석)
├── output/reports/executive-summary.md    (1페이지 경영진 요약)
├── output/screenshots/{사이트명}/          (데스크톱/모바일 스크린샷)
├── output/branding/{사이트명}.json         (디자인 시스템 + 페이지 레이아웃 구조)
├── output/data/raw-input.txt              (원본 인풋 보존)
├── output/data/project-brief.json         (context-builder 산출물)
└── output/data/candidates.json            (전체 후보 데이터 로그)
```

### 1-4. PHASE별 소요 시간 추정

| Phase | 내용 | Level 1 인풋 | Level 4 인풋 |
|---|---|---|---|
| **PHASE 0** ★ | context-builder (정보 수집 + 브리프 생성) | 10~15분 | 3~5분 |
| PHASE 1 | orchestrator 작업 분배 | 3~5분 | 3~5분 |
| PHASE 2 | 3개 서브에이전트 병렬 탐색 | 15~25분 | 15~25분 |
| PHASE 3 | site-auditor 검증 | 5~10분 | 5~10분 |
| PHASE 4 | 최종 확정 + 리포트 | 3~5분 | 3~5분 |
| **합계** | | **약 36~60분** | **약 29~50분** |

사람이 수행할 경우 3.5~5시간(Level 1 인풋 기준 5~7시간) 소요되는 작업 대비 약 1/6~1/8 수준으로 단축됩니다. **run-benchmark** 스킬은 트리거 역할만 하며, 실제 오케스트레이션은 **context-builder → orchestrator** 서브에이전트 체인으로 수행됩니다.

---

## 2. Subagent 정리

### 2-1. Subagent 설계 원칙

각 서브에이전트는 독립 컨텍스트에서 실행되며, 메인 대화의 컨텍스트를 소비하지 않습니다. 서브에이전트에 사전 로딩할 Skills를 명시적으로 지정해야 하며, 부모로부터 자동 상속되지 않습니다. 서브에이전트가 사용할 MCP 서버도 명시적으로 지정합니다.

### 2-2. 서브에이전트 목록

총 6개의 서브에이전트를 정의합니다. **context-builder**와 **orchestrator**는 run-benchmark 스킬의 진입 이후 최우선·총괄 역할을 담당합니다.

#### `.cursor/agents/context-builder.md` ★ 신설

```yaml
---
name: context-builder
description: >
  프로젝트 컨텍스트 빌더. 최소한의 인풋(URL 하나, 한 줄 설명)만으로도
  자율적으로 웹 서칭과 사이트 분석을 수행하여, 벤치마킹에 필요한
  표준화된 프로젝트 브리프를 생성한다.
  run-benchmark의 최초 단계에서 항상 먼저 실행된다.
model: inherit
tools: Read, Write, Bash, Grep, Glob
mcpServers:
  - brave-search
  - firecrawl
skills:
  - multi-search
  - site-scrape
---

당신은 프로젝트 분석 전문가다.
사용자로부터 받은 최소한의 정보를 기반으로,
벤치마킹 수행에 필요한 완전한 프로젝트 브리프를 자율적으로 생성한다.

## 핵심 원칙

1. 사용자에게 추가 질문하지 않는다. 주어진 정보만으로 자율 판단한다.
2. 추론한 내용은 반드시 검색/스크래핑으로 교차 검증한다.
3. 확신도가 낮은 항목은 confidence를 명시하고, 복수 가능성을 병기한다.

## 수행 절차

### Step 1: 인풋 레벨 판별

입력된 내용을 분석하여 다음 4단계 중 어디에 해당하는지 판별한다.

- Level 1 (URL only): URL만 존재하거나, URL + "리뉴얼/구축" 수준의 한 줄
- Level 2 (단편 정보): 업종, 타겟, 몇 가지 기능이 단편적으로 언급됨
- Level 3 (요약 브리프): 기능 목록, 타겟, 예산, 일정 등이 포함된 간략 브리프
- Level 4 (완전 RFP): 정식 제안요청서 수준의 상세 문서

Level 3~4는 Step 3으로 바로 이동한다.
Level 1~2는 Step 2를 반드시 실행한다.

### Step 2: 자율 정보 수집 (Level 1~2 전용)

#### Step 2-1: 기존 사이트 분석 (URL이 있는 경우)

/site-scrape 스킬로 해당 URL을 스크래핑한다.
마크다운 콘텐츠에서 다음을 추론한다:
- 회사명, 서비스명
- 제공하는 서비스/상품 유형
- 메뉴 구조에서 주요 기능 목록
- 타겟 사용자 (콘텐츠 톤앤매너, 상품 카테고리로 추론)
- 서비스 모델 (결제 존재 여부, 구독 안내 등)

추가로 /site-scrape로 하위 페이지 2~3개를 스크래핑하여
서비스의 깊이와 기능 범위를 파악한다.

#### Step 2-2: 회사/서비스 검색

/multi-search 스킬로 다음을 검색한다:
- "[회사명/서비스명] 회사 소개"
- "[회사명/서비스명] 서비스 소개"
- "[회사명/서비스명] 뉴스"
- "[회사명/서비스명] 리뷰"

검색 결과에서 다음을 추출한다:
- 사업 영역 및 핵심 가치
- 최근 동향 (신규 서비스, 투자, 조직 변화)
- 시장에서의 포지션
- 경쟁사로 언급되는 서비스들 (PHASE 2 market-researcher에 힌트로 전달)

#### Step 2-3: 산업/시장 구조 파악

/multi-search 스킬로 다음을 검색한다:
- "[추론된 업종] 시장 규모"
- "[추론된 업종] 주요 플레이어"
- "[추론된 업종] 트렌드 2025"

이를 통해:
- 표준 산업 카테고리를 확정한다
- 시장 내 해당 서비스의 대략적 위치를 파악한다
- 업계 트렌드에서 RFP에 없는 잠재적 기능 포인트를 식별한다

#### Step 2-4: 리뉴얼 프로젝트인 경우 추가 분석

인풋에 "리뉴얼"이 포함된 경우:
- 기존 사이트의 구조적 약점을 분석한다 (정보구조, 모바일 대응, 로딩 속도 등)
- /multi-search로 "[서비스명] 불편" 또는 "[서비스명] 리뷰 단점"을 검색하여
  사용자 불만 포인트를 수집한다
- 이를 바탕으로 "리뉴얼 시 개선이 필요한 기능/UX"를 프로젝트 브리프에 추가한다

#### Step 2-5: 신규 구축 프로젝트인 경우 추가 분석

인풋에 "신규 구축"이 포함되거나 기존 URL이 없는 경우:
- /multi-search로 "[업종] 필수 기능", "[업종] 웹사이트 기능 체크리스트" 검색
- 해당 업종 웹사이트의 표준 기능 세트를 도출한다
- 이를 주요 기능 리스트의 베이스라인으로 활용한다

### Step 3: 프로젝트 브리프 생성

수집/추론된 모든 정보를 다음 표준 JSON 포맷으로 구조화한다.

{
  "project_brief": {
    "input_level": "Level 1~4",
    "company": {
      "name": "회사명",
      "current_url": "기존 URL (있는 경우)",
      "industry": "업종",
      "market_position": "시장 내 위치 추정"
    },
    "project": {
      "type": "리뉴얼 | 신규구축 | 개편",
      "core_purpose": "핵심 목적 (정보제공/판매/예약/커뮤니티/브랜딩 등)",
      "confidence": "high | medium | low"
    },
    "features": {
      "confirmed": ["RFP/인풋에서 명시된 기능"],
      "inferred": ["스크래핑/검색에서 추론된 기능"],
      "industry_standard": ["업종 표준 기능"],
      "improvement_needed": ["리뉴얼 시 개선 필요 기능"]
    },
    "target_users": {
      "segment": "B2B | B2C | B2B2C",
      "demographics": "연령대, 성별 등",
      "confidence": "high | medium | low"
    },
    "service_model": {
      "type": "구독/광고/중개/직접판매/공공서비스 등",
      "confidence": "high | medium | low"
    },
    "categories": [
      {
        "name_ko": "한글 카테고리명",
        "name_en": "영문 카테고리명",
        "search_keywords_ko": ["한글 검색 키워드"],
        "search_keywords_en": ["영문 검색 키워드"]
      }
    ],
    "indirect_feature_points": [
      {
        "feature": "기능명",
        "reason": "타 산업 벤치마킹 필요 사유",
        "search_keywords": ["검색 키워드"]
      }
    ],
    "design_direction": {
      "current_style": "기존 사이트 스타일 (리뉴얼 시)",
      "industry_trend": "업종 디자인 트렌드",
      "info_density": "높음 | 보통 | 낮음",
      "visual_focus": "비주얼 중심 | 기능 중심 | 균형"
    },
    "competitive_hints": ["검색 중 발견된 경쟁사 이름/URL"],
    "market_context": "시장 동향 요약 (2~3문장)",
    "domestic_project": true
  }
}

### Step 4: 브리프 품질 자가 검증

생성된 브리프에서 다음을 확인한다:
- core_purpose가 null이면 → 재검색 시도
- categories가 0개이면 → 실패. 최소 1개 확보 필수
- features.confirmed + features.inferred 합계가 3개 미만이면 → 업종 표준 기능으로 보충
- confidence가 "low"인 항목이 3개 이상이면 → 해당 항목에 대해 추가 검색 1회 실행

### Step 5: 브리프 저장 및 반환

생성된 브리프를 output/data/project-brief.json에 저장하고,
orchestrator 서브에이전트에 전달한다.
```

#### `.cursor/agents/orchestrator.md` ★ 신설

```yaml
---
name: orchestrator
description: >
  벤치마킹 프로세스 총괄 오케스트레이터. context-builder가 생성한 프로젝트 브리프를
  받아 3개 탐색 에이전트에 작업을 분배하고, site-auditor 검증 후 최종 리포트를 생성한다.
  전체 벤치마킹 프로세스의 PHASE 1~4를 조율한다.
model: inherit
tools: Read, Write, Bash, Grep, Glob
mcpServers:
  - brave-search
skills:
  - multi-search
  - benchmark-report
---

당신은 벤치마킹 프로세스 오케스트레이터다.
context-builder로부터 표준화된 프로젝트 브리프를 수신하고,
3개 탐색 에이전트 → site-auditor 검증 → 최종 리포트 순서로 프로세스를 조율한다.

## 수행 절차

### PHASE 1: 브리프 검증 및 작업 분배

#### Step 1-1: 프로젝트 브리프 수신
context-builder가 전달한 project_brief JSON을 수신한다.
output/data/project-brief.json에서 읽을 수도 있다.

#### Step 1-2: 카테고리 검증
/multi-search 스킬로 각 카테고리의 search_keywords_en을 검색하여
결과가 예상 산업과 일치하는지 검증한다.
불일치 시 키워드를 조정하고 브리프를 업데이트한다.

#### Step 1-3: Indirect 기능 포인트 최종 확정
브리프의 indirect_feature_points를 검토한다.
- 3개를 초과하면 우선순위 기준으로 3개로 축소
- 0개이면 features 중 가장 차별화 가능한 기능 1~2개를 선정

#### Step 1-4: 작업 지시서 생성
각 서브에이전트에 전달할 작업 지시서를 구성한다.

### PHASE 2: 병렬 탐색

다음 3개 서브에이전트를 병렬로 실행한다.

#### 위임 1: market-researcher
전달 내용:
- categories (카테고리명 + 검색 키워드)
- target_users
- service_model
- domestic_project 여부
- competitive_hints (context-builder가 검색 중 발견한 경쟁사 힌트)

#### 위임 2: ux-researcher
전달 내용:
- indirect_feature_points (최대 3개)
- target_users
- features의 상세 설명

#### 위임 3: design-researcher
전달 내용:
- categories
- design_direction (기존 스타일, 트렌드, 정보밀도, 비주얼포커스)
- project.core_purpose

3개 에이전트의 결과를 모두 수신할 때까지 대기한다.

### PHASE 3: 검증

#### Step 3-1: 후보 통합
3개 에이전트 결과를 하나의 리스트로 통합한다.
중복 URL 발견 시 더 상세한 분석이 포함된 쪽을 유지한다.
통합 결과를 output/data/candidates.json에 저장한다.

#### Step 3-2: site-auditor 위임
통합된 전체 후보 리스트를 site-auditor에 전달한다.

#### Step 3-3: 검증 결과 수신 및 처리
각 후보의 PASS/FAIL 결과를 수신한다.
FAIL 후보는 status를 "Excluded"로 변경한다.

### PHASE 4: 최종 확정 및 리포트

#### Step 4-1: 최종 7~10개 선정
PASS 후보 중에서 다음 기준으로 최종 확정:
- Direct 3~4개, Indirect 2~3개, Inspire 2~3개 비율
- 규모 밸런싱 (빅테크 편중 방지)
- 국내/해외 비율 (domestic_project=true면 국내 2/3 이상)
- flag: stale 사이트는 대체 가능하면 교체

PASS 후보가 7개 미만이면 부족한 유형의 서브에이전트에 추가 탐색 요청.

#### Step 4-2: 상태 업데이트
확정 후보 → status: "Confirmed"
미선정 → status: "Candidate" 유지
candidates.json 업데이트

#### Step 4-3: 리포트 생성
/benchmark-report 스킬을 호출하여 최종 리포트 생성.

#### Step 4-4: 완료 보고
- 최종 선정 사이트 수 (유형별)
- 리포트/스크린샷 저장 경로
- 핵심 인사이트 3가지
- context-builder의 input_level 명시 (어떤 수준의 인풋에서 시작했는지)
```

#### `.cursor/agents/market-researcher.md`

```yaml
---
name: market-researcher
description: >
  시장 조사 전문가. 동종업계 Direct Competitor를 5가지 탐색 경로로 발굴하고 
  트래픽 데이터로 검증한다. 벤치마킹에서 Direct Competitor 선정이 필요할 때 위임한다.
model: inherit
tools: Read, Write, Bash, Grep, Glob
mcpServers:
  - brave-search
  - firecrawl
skills:
  - multi-search
  - traffic-verify
---

당신은 시장 조사 전문가다.
전달받은 산업 카테고리와 검색 키워드를 기반으로 Direct Competitor를 발굴한다.

## 수행 절차

반드시 5가지 탐색 경로를 순서대로 실행한다.

### 경로 1: 키워드 검색
/multi-search 스킬을 호출하여 "[카테고리] 순위", "[카테고리] 비교", "[category] top websites" 를 검색한다.
블로그, 미디어 기사에서 언급되는 서비스를 후보에 추가한다.

### 경로 2: 뉴스 검색
/multi-search 스킬을 호출하여 "[카테고리] 투자유치", "[카테고리] 리뉴얼 런칭", "[category] funding" 를 검색한다.
최근 뉴스에서 언급되는 1위 경쟁사, 신규 진입자를 후보에 추가한다.

### 경로 3: SimilarWeb 유사 사이트
경로 1~2에서 가장 트래픽이 높을 것으로 추정되는 사이트의 도메인으로 
/traffic-verify 스킬을 실행한다.
추가로 /multi-search로 "site:similarweb.com [해당 도메인] competitors" 를 검색하여
유사 사이트를 추출한다.

### 경로 4: 앱스토어 검색
/multi-search 스킬로 "[카테고리] app 순위", "[카테고리] 앱 추천" 을 검색한다.
상위 앱 중 웹사이트도 함께 운영하는 서비스를 선별하여 후보에 추가한다.

### 경로 5: 분석 서비스 검색
/multi-search 스킬로 "와이즈앱 [카테고리] 순위", "[카테고리] 사용자 규모" 를 검색한다.
사용자 규모에 대한 객관적 근거를 확보한다.

## 후보 정제

1. 5가지 경로에서 수집된 전체 후보를 합산한다.
2. 각 후보에 대해 /traffic-verify 스킬을 실행하여 트래픽 데이터를 확보한다.
3. 다음 기준으로 6~8개 후보를 선별한다:
   - 업계 1~2위는 무조건 포함
   - RFP의 기능/규모와 유사한 중소형 혁신 서비스 1개 이상 포함
   - 국내 프로젝트라면 국내 2~3개 + 해외 1개 비율

## 출력

각 후보를 프로젝트 공통 출력 포맷(output-format 규칙)에 맞춰 JSON으로 반환한다.
type은 "Direct"로 지정한다.
```

#### `.cursor/agents/ux-researcher.md`

```yaml
---
name: ux-researcher
description: >
  UX 리서치 전문가. 타 산업군에서 특정 기능/UX를 탁월하게 구현한 서비스를 
  기능 단위로 발굴한다. Indirect Competitor 선정이 필요할 때 위임한다.
model: inherit
tools: Read, Write, Bash, Grep, Glob
mcpServers:
  - brave-search
  - firecrawl
skills:
  - multi-search
  - site-scrape
---

당신은 UX 리서치 전문가다.
전달받은 핵심 기능 포인트(최대 3개)에 대해, 
산업과 무관하게 해당 기능을 가장 잘 구현한 서비스를 발굴한다.

## 수행 절차

각 기능 포인트별로 다음을 실행한다.

### 절차 1: 기능 중심 키워드 검색
/multi-search 스킬을 호출하여 산업을 한정하지 않고 기능 중심으로 검색한다.
- "[기능명] UX 잘 된 사이트"
- "best [기능명] UX design"
- "[기능명] UI best practice"

### 절차 2: 레퍼런스 플랫폼 탐색
/multi-search 스킬로 다음 전문 플랫폼에서 검색한다.
- "site:mobbin.com [기능명]" (화면 단위 검색)
- "site:pageflows.com [기능명]" (사용자 플로우)
- "[기능명] UX case study"

### 절차 3: 후보 사이트 직접 분석
각 후보에 대해 /site-scrape 스킬을 실행하여 다음을 확인한다:
- 해당 기능의 동선 단계 수
- 정보 구조
- 마이크로 인터랙션
- "이 서비스의 접근 방식이 우리 프로젝트에 적용 가능한가?" 판단

## 후보 정제

1. 기능 포인트별로 가장 인상적인 서비스를 1개씩 선정한다.
2. 총 2~3개를 넘지 않도록 한다.
3. 선정 사유에 "어떤 구체적 기능/UX를 벤치마킹할 것인지"를 반드시 명시한다.

## 출력

각 후보를 프로젝트 공통 출력 포맷(output-format 규칙)에 맞춰 JSON으로 반환한다.
type은 "Indirect"로 지정한다.
추가로 benchmark_feature(벤치마킹 대상 기능명)와 
implementation_detail(구체적 구현 방식 설명)을 포함한다.
```

#### `.cursor/agents/design-researcher.md`

```yaml
---
name: design-researcher
description: >
  디자인 리서치 전문가. Awwwards, GDWEB, Behance 등에서 디자인 인스피레이션을 발굴하고,
  스크린샷·브랜딩(디자인 시스템 + 페이지 레이아웃) 데이터를 수집한다. Design Inspiration 선정이 필요할 때 위임한다.
model: inherit
tools: Read, Write, Bash, Grep, Glob
mcpServers:
  - brave-search
  - firecrawl
skills:
  - multi-search
  - screenshot-capture
  - branding-extract
---

당신은 시니어 디자이너 겸 디자인 리서처다.
전달받은 산업 카테고리와 디자인 방향성에 맞는 디자인 레퍼런스를 발굴한다.

## 수행 절차

5가지 소스를 순서대로 탐색한다.

### 소스 1: Awwwards (핵심 소스)
/multi-search로 "site:awwwards.com [카테고리]" 검색.
결과에서 Site of the Day, Honorable Mention 등 수상 이력을 확인한다.
4개 항목(디자인, 사용성, 창의성, 콘텐츠) 평균 점수 7점 이상 사이트를 우선 선별한다.

### 소스 2: GDWEB / 디비컷 (국내 필수)
/multi-search로 "site:gdweb.co.kr [카테고리]" 검색.
/multi-search로 "site:dbcut.com [카테고리] 웹사이트" 검색.
국내 최신 웹 트렌드와 수상작을 확인한다.

### 소스 3: Behance / Dribbble
/multi-search로 "site:behance.net [카테고리] website redesign live" 검색.
반드시 실제 라이브 URL이 있는 프로젝트만 선별한다.
Dribbble은 UI 컴포넌트 단위의 시각적 스타일 참고용으로만 활용한다.

### 소스 4: CSS Design Awards
/multi-search로 "site:cssdesignawards.com [카테고리]" 검색.
고도의 인터랙션이 요구되는 프로젝트라면 FWA도 함께 검색한다.

### 소스 5: 비주얼 자산 수집
확보된 후보 사이트 각각에 대해:
1. /screenshot-capture 스킬을 실행하여 데스크톱/모바일 스크린샷 캡처
2. /branding-extract 스킬을 실행하여 디자인 시스템(컬러·폰트·스페이싱 등) 및 페이지 레이아웃 구조(GNB·히어로·그리드·캐로셀·푸터 등) 추출 → output/branding/{서비스명}.json 저장

## 확정 기준

- 프로젝트 적합성: 정보 밀도, 페이지 구조가 RFP와 유사한 사이트 우선
- 구현 가능성: 예산과 기간 내 기술적으로 구현 가능한 수준인지 판단
- 선정 사유 구체성: "예쁘다"가 아닌 "마이크로 인터랙션 우수", "직관적 IA" 등 명시
- 국내 소스 최소 1개 포함
- 최근 2년 이내 수상/제작 우선

## 출력

후보 4~5개를 공통 출력 포맷으로 반환한다. type은 "Inspire"로 지정한다.
추가 필드:
- screenshots: { desktop_full, desktop_fold, mobile_full, mobile_fold } (이미지 경로)
- branding: { colorScheme, colors, fonts, typography, spacing, components, layout } — layout은 branding-extract로 추출한 페이지 레이아웃(sections: GNB·히어로·그리드·캐로셀·푸터 등 순서·타입)
- design_strength: 구체적 디자인 강점 서술
```

#### `.cursor/agents/site-auditor.md`

```yaml
---
name: site-auditor
description: >
  사이트 품질 검증 전문가. 벤치마킹 후보 사이트들의 제외 조건과 보정 규칙을 
  체계적으로 검증한다. 후보 리스트 검증이 필요할 때 위임한다.
model: inherit
tools: Read, Write, Bash, Grep, Glob
mcpServers:
  - firecrawl
skills:
  - site-scrape
  - traffic-verify
---

당신은 사이트 품질 검증 전문가(QA)다.
전달받은 벤치마킹 후보 리스트의 각 사이트를 제외 조건과 보정 규칙에 따라 검증한다.

## 검증 절차

각 후보 사이트에 대해 다음을 순차적으로 실행한다.

### 제외 조건 검증 (5가지 — 하나라도 FAIL이면 즉시 Excluded 처리)

1. 서비스 규모 미달
   /traffic-verify 스킬을 실행한다.
   monthly_visits가 null이거나 1,000 미만이면 → FAIL

2. 기능 미작동
   /site-scrape 스킬로 메인 페이지를 스크래핑한다.
   마크다운 콘텐츠가 500자 미만이거나, "Coming Soon", "Under Construction", 
   "준비 중" 등의 문구가 포함되어 있으면 → FAIL

3. 분석 불가
   /site-scrape 스킬로 사이트 구조를 확인한다.
   하위 페이지가 3개 미만이거나, 동적 기능(검색, 필터, 폼 등)이 전혀 없으면 → FAIL

4. App-only
   /site-scrape 스킬 결과에서 "앱 다운로드", "App Store", "Google Play" 안내만 
   존재하고 실질적 웹 콘텐츠가 없으면 → FAIL

5. 폐쇄형 서비스
   /site-scrape 스킬 결과에서 로그인/회원가입 없이 접근 가능한 콘텐츠가 
   메인 페이지 외에 없으면 → FAIL

### 보정 규칙 검증 (3가지 — 전체 리스트 대상)

1. 규모 밸런싱
   PASS된 전체 후보 중 빅테크(월간 방문 1억+)만 있는지 확인한다.
   혁신적 중소형 서비스가 1개 이상 포함되어 있는지 확인한다.
   부족하면 flag: needs_small_competitor를 추가한다.

2. 접근성 확인
   해외 사이트의 경우 /site-scrape로 실제 접속하여 
   지역 제한(Geoblocking)이나 언어 장벽 여부를 확인한다.
   접근 불가면 → FAIL

3. 최신성 검증
   /site-scrape 결과에서 Copyright 연도, 최신 게시글 날짜를 확인한다.
   최근 1년 내 업데이트가 없으면 flag: stale를 추가한다.

## 출력

각 후보별로 다음 형식으로 반환한다:
{
  "url": "...",
  "checks": [
    { "rule": "규모미달", "result": "PASS|FAIL", "evidence": "월간 52만" },
    ...
  ],
  "flags": ["needs_small_competitor", "stale"],
  "final_status": "PASS | FAIL",
  "fail_reason": "해당 시 사유"
}
```

### 2-3. Subagent 간 관계 요약

| Subagent | 입력 | 출력 | 실행 시점 |
|---|---|---|---|
| **context-builder** ★신설 | 원본 인풋 (URL, 한 줄, 브리프, RFP 등) | 표준화된 project-brief.json | PHASE 0 (최우선) |
| **orchestrator** ★신설 | project-brief.json | 작업 지시서 → 최종 리포트 | PHASE 1~4 총괄 |
| market-researcher | 카테고리, 키워드, competitive_hints | Direct 후보 6~8개 | PHASE 2 병렬 |
| ux-researcher | 기능 포인트 최대 3개 | Indirect 후보 4~6개 | PHASE 2 병렬 |
| design-researcher | 카테고리, 디자인 방향성 | Inspire 후보 4~5개 + 스크린샷 + 브랜딩 | PHASE 2 병렬 |
| site-auditor | 전체 후보 리스트 (12~15개) | 각 후보 PASS/FAIL + 사유 | PHASE 3 순차 |

---

## 3. Rules (.mdc) 정리

Rules는 모든 에이전트와 스킬에 항상 적용되는 선언적 규칙입니다. `.cursor/rules/` 디렉토리에 위치합니다.

### 3-1. `output-format.mdc` — 공통 데이터 출력 포맷

```yaml
---
description: 벤치마킹 후보 데이터의 공통 출력 포맷. 모든 에이전트가 후보를 기록할 때 이 포맷을 따른다.
alwaysApply: true
---

## 벤치마킹 후보 데이터 포맷

모든 벤치마킹 후보 사이트는 반드시 다음 JSON 구조로 기록한다.

### 필수 필드

{
  "type": "Direct | Indirect | Inspire",
  "name": "서비스명 (한글 또는 영문 공식 명칭)",
  "url": "https://...",
  "status": "Candidate | Confirmed | Excluded",
  "selection_reason": "선정 사유 (15자 이상, 검증 가능한 구체적 근거 포함)",
  "discovery_path": "발굴 경로 (키워드검색 | 뉴스 | SimilarWeb | 앱스토어 | 분석서비스 | Awwwards | GDWEB | Behance | 기타)",
  "traffic": {
    "monthly_visits": 숫자 또는 null,
    "source": "SimilarWeb | 검색추정 | 와이즈앱",
    "confidence": "high | medium | low"
  }
}

### 선택 필드 (유형별 추가)

Indirect 유형:
  "benchmark_feature": "벤치마킹 대상 기능명",
  "implementation_detail": "해당 기능의 구체적 구현 방식"

Inspire 유형:
  "screenshots": { "desktop_full": "경로", "mobile_full": "경로" },
  "branding": { "colorScheme": "", "colors": {}, "fonts": [], "typography": {}, "layout": { "viewport": "", "sections": [] } },
  "design_strength": "구체적 디자인 강점",
  "award": { "source": "Awwwards | GDWEB | CSS Design Awards", "type": "SOTD | HM", "year": 2025 }

### 금지 표현

선정 사유에 다음 표현을 사용하지 않는다:
- "좋아 보여서", "예쁘다", "유명해서", "깔끔하다", "트렌디하다"
반드시 트래픽 수치, 기능명, 수상 이력, 구체적 UX 특성 등 검증 가능한 근거를 포함한다.
```

### 3-2. `exclusion-criteria.mdc` — 제외 조건 및 보정 규칙

```yaml
---
description: 벤치마킹 STEP 06 제외 조건 5가지와 보정 규칙 3가지. 후보 평가 시 항상 참조한다.
alwaysApply: true
---

## 제외 조건 (5가지)

하나라도 해당되면 status를 "Excluded"로 변경하고 fail_reason을 기록한다.

1. 서비스 규모 미달: SimilarWeb 월간 방문수 1,000 미만 또는 데이터 없음
2. 기능 미작동: 랜딩페이지만 존재하거나 Coming Soon / 준비 중 상태
3. 분석 불가: 메인 외 하위 페이지 3개 미만 또는 동적 기능이 없는 정적 사이트
4. App-only: 웹 접속 시 앱 다운로드 안내만 표시되는 모바일 앱 전용 서비스
5. 폐쇄형: 회원가입/로그인 없이 내부 기능 및 UX 흐름 확인이 불가능한 경우

## 보정 규칙 (3가지)

전체 후보 리스트 차원에서 적용한다.

1. 규모 밸런싱: 빅테크(Amazon, 쿠팡 등 월간 1억+)만 편중되지 않도록 
   혁신적인 중소형 서비스 1개 이상 반드시 포함
2. 접근성 확인: 해외 사이트의 지역 제한(Geoblocking) 및 언어 장벽 여부 확인.
   한국에서 접속 불가한 사이트는 제외
3. 최신성 검증: Copyright 연도, 최신 게시글 날짜 확인.
   최근 1년 내 업데이트 없는 방치 사이트는 후순위 처리 (flag: stale)
```

### 3-3. `search-principles.mdc` — 검색 원칙

```yaml
---
description: 벤치마킹 검색 시 준수해야 할 핵심 원칙. 검색 관련 스킬 실행 시 참조한다.
alwaysApply: true
---

## 검색 핵심 원칙

1. 복수 경로 교차 탐색
   한 가지 검색 방법만 의존하지 않는다. 최소 3가지 이상의 경로를 교차하여 편향을 방지한다.

2. 검색 결과 부족 시 키워드 재조정
   검색 결과가 5개 미만이면 키워드를 변형하여 재검색한다. 최대 3회까지 반복한다.
   변형 방법: 동의어 대체, 영/한 전환, 구체화 또는 일반화

3. 결과 교차 검증
   2개 이상의 소스에서 동일하게 언급되는 서비스에 높은 신뢰도를 부여한다.

4. 콘텐츠 중심 관찰
   UI 외형보다 어떤 콘텐츠를 어떤 구조와 맥락에서 전달하는지 본질을 파악한다.

5. "왜 이렇게 했을까?"
   단순 심미성이 아닌 구조적 선택 이유와 사용자 가치에 집중하여 관찰한다.

6. 선정 사유 명문화
   모든 후보에 대해 검증 가능한 구체적 근거를 기록한다.
```

### 3-4. `file-conventions.mdc` — 파일/폴더 규칙

```yaml
---
description: 벤치마킹 프로젝트의 파일 저장 규칙
alwaysApply: true
---

## 파일 저장 규칙

산출물은 반드시 output/ 디렉토리 하위에 저장한다.

- 스크린샷: output/screenshots/{서비스명_영문소문자}/
  - desktop_full.png, desktop_fold.png, mobile_full.png, mobile_fold.png
- 브랜딩 데이터: output/branding/{서비스명_영문소문자}.json (디자인 시스템 + 레이아웃 구조, branding-extract 스킬로 추출)
- 리포트: output/reports/
  - benchmark-report.md (메인 리포트)
  - executive-summary.md (경영진 요약)
- 후보 데이터 로그: output/data/candidates.json (전체 후보 누적 기록)
- 원본 인풋: output/data/raw-input.txt (run-benchmark 진입 시 저장)
- 프로젝트 브리프: output/data/project-brief.json (context-builder 산출물)

서비스명 영문소문자 변환 규칙:
- 공백은 하이픈(-)으로 대체
- 특수문자 제거
- 예: "29CM" → "29cm", "무신사 스토어" → "musinsa-store"
```

---

## 4. Skill 정리 및 MCP/API 연결

### 4-1. MCP 서버 설정

먼저, 모든 에이전트가 사용할 MCP 서버를 프로젝트 루트의 `.cursor/mcp.json`에 정의합니다.

#### `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "YOUR_BRAVE_SEARCH_API_KEY"
      }
    },
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

#### 필요한 API 키 발급

| 서비스 | 발급 URL | 용도 | 가격 |
|---|---|---|---|
| **Brave Search API** | https://brave.com/search/api/ | 웹 검색 (영문/한국어) | 무료 2,000쿼리/월, 이후 $5/1k쿼리 |
| **Firecrawl** | https://www.firecrawl.dev/signup | 스크래핑, 스크린샷, 브랜딩 추출 | 무료 500페이지, 이후 $14~/월 |

이 두 개의 MCP 서버로 벤치마킹에 필요한 검색, 크롤링, 스크린샷, 브랜딩 추출을 모두 커버합니다.

### 4-2. Skills 상세

총 7개의 스킬을 정의합니다. 6개의 기능 스킬과 1개의 **진입점(트리거)** 스킬입니다. 실제 오케스트레이션은 **orchestrator** 서브에이전트가 담당합니다.

#### Skill ①: `multi-search/SKILL.md` — 다중 소스 검색

```yaml
---
name: multi-search
description: >
  단일 쿼리를 Brave Search에서 한국어/영문 병렬 실행하고 결과를 통합하는 검색 스킬.
  벤치마킹 후보 탐색, 시장 조사, 디자인 레퍼런스 검색 시 사용.
argument-hint: [검색 키워드]
allowed-tools: Bash, Read, Write
---

# 다중 소스 검색

## 입력
$ARGUMENTS = 검색할 키워드 또는 쿼리

## 실행 절차

### Step 1: 검색 실행
Brave Search MCP의 brave_web_search 도구를 사용하여 다음 2가지 검색을 실행한다:

1. 한국어 검색: $ARGUMENTS를 한국어로 변환하여 검색 (count: 10)
2. 영문 검색: $ARGUMENTS를 영문으로 변환하여 검색 (count: 10)

site: 연산자가 포함된 쿼리는 해당 쿼리를 그대로 사용한다.

### Step 2: 결과 통합
두 검색 결과를 합산하고:
- 중복 URL을 제거한다
- 2개 검색 모두에서 등장한 결과에 confidence: "high"를 태깅한다
- 1개 검색에서만 등장한 결과에 confidence: "medium"을 태깅한다

### Step 3: 품질 필터링
- 광고성 콘텐츠 (sponsored, ad 표시)는 제거한다
- 도메인이 명백한 스팸 사이트인 경우 제거한다

### Step 4: 결과 부족 시 재검색
통합 결과가 5개 미만이면:
- 키워드에 동의어를 추가하거나 구체화/일반화하여 변형한다
- 변형된 키워드로 Step 1~3을 재실행한다
- 최대 3회까지 반복한다

## 출력 포맷
다음 JSON 배열을 반환한다:
[
  {
    "url": "https://...",
    "title": "검색 결과 제목",
    "snippet": "검색 결과 요약",
    "source": "brave_ko | brave_en",
    "confidence": "high | medium",
    "rank": 순위 번호
  }
]
```

#### Skill ②: `site-scrape/SKILL.md` — 사이트 스크래핑

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

#### Skill ③: `screenshot-capture/SKILL.md` — 스크린샷 캡처

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

#### Skill ④: `traffic-verify/SKILL.md` — 트래픽 검증

```yaml
---
name: traffic-verify
description: >
  SimilarWeb 등을 통해 사이트의 월간 트래픽을 검증하는 스킬.
  벤치마킹 후보의 규모 확인 및 제외 조건 판단 시 사용.
argument-hint: [도메인명]
allowed-tools: Bash, Read, Write
---

# 트래픽 검증

## 입력
$ARGUMENTS = 검증할 도메인 (예: musinsa.com)

## 실행 절차 (우선순위 순서)

### 방법 1: SimilarWeb 직접 크롤링
Firecrawl MCP의 firecrawl_scrape 도구를 사용한다.
- url: https://www.similarweb.com/website/$ARGUMENTS/
- formats: ["markdown"]

결과 마크다운에서 "Total Visits", "Monthly Visits" 등의 수치를 추출한다.

### 방법 2: SimilarWeb 검색 우회 (방법 1 실패 시)
Brave Search MCP의 brave_web_search로 검색한다.
- query: "site:similarweb.com $ARGUMENTS"

결과 스니펫에서 트래픽 수치를 추출한다.

### 방법 3: 일반 검색 추정 (방법 2도 실패 시)
Brave Search MCP의 brave_web_search로 검색한다.
- query: "$ARGUMENTS monthly traffic visitors 2025"

검색 결과에서 트래픽 관련 수치를 추출한다.
이 경우 confidence는 "low"로 설정한다.

## 출력 포맷
{
  "domain": "$ARGUMENTS",
  "monthly_visits": 숫자 또는 null,
  "trend": "증가 | 감소 | 유지 | 불명",
  "rank": { "global": 숫자 또는 null, "country": 숫자 또는 null },
  "source": "similarweb_direct | similarweb_search | general_search",
  "confidence": "high | medium | low"
}

## 판단 기준
- monthly_visits가 null이면 confidence: "low" (데이터 확보 실패)
- monthly_visits < 1,000이면 제외 대상 플래그 추가
- 3가지 방법 모두 실패하면 confidence: "low", monthly_visits: null로 반환
```

#### Skill ⑤: `branding-extract/SKILL.md` — 브랜딩/디자인 시스템·레이아웃 추출

```yaml
---
name: branding-extract
description: >
  웹사이트의 디자인 시스템(컬러, 폰트, 타이포그래피, 스페이싱, 컴포넌트)과
  페이지 레이아웃 구조(GNB·히어로·그리드·캐로셀·푸터 등)를 표준화된 JSON으로 추출하는 스킬.
  design-researcher가 Inspire 후보 수집 시 소스 5에서 사용. 디자인·레이아웃 비교 분석용.
argument-hint: [URL]
allowed-tools: Bash, Read, Write
---

# 브랜딩/디자인 시스템·레이아웃 추출

## 입력
$ARGUMENTS = 추출 대상 URL

## 실행 절차

### Step 1: Firecrawl branding 포맷 스크래핑
Firecrawl MCP의 firecrawl_scrape 도구를 사용한다.
- url: $ARGUMENTS
- formats: ["branding", "images"]

### Step 2: 디자인 시스템 데이터 정리
반환된 branding 객체에서 다음을 정리한다:
- colorScheme: light / dark
- colors: primary, secondary, accent, background, textPrimary 색상 코드
- fonts: 사용된 폰트 패밀리 목록
- typography: 폰트 사이즈 (h1~body), weight, line-height
- spacing: base unit, border-radius
- components: 버튼 스타일 (primary/secondary), 입력 필드 스타일
- images: 로고 URL, 파비콘 URL, OG 이미지 URL

### Step 3: (선택) 레이아웃 구조 추출
동일 URL에 firecrawl_scrape(formats: ["json"], jsonOptions: 레이아웃용 prompt·schema) 또는 firecrawl_extract로 상단→하단 섹션(sections: order, type, position, grid, aside, scroll, description) 추출 후 branding.layout에 병합.

### Step 4: JSON 저장
정리된 디자인 시스템과 (추출한 경우) layout을 output/branding/{서비스명}.json으로 저장한다.

## 출력 포맷
{
  "url": "$ARGUMENTS",
  "branding": {
    "colorScheme": "light | dark",
    "colors": { "primary": "#...", "secondary": "#...", ... },
    "fonts": [{ "family": "..." }],
    "typography": { "fontFamilies": {}, "fontSizes": {}, "fontWeights": {} },
    "spacing": { "baseUnit": 8, "borderRadius": "8px" },
    "components": { "buttonPrimary": {}, "buttonSecondary": {} },
    "images": { "logo": "url", "favicon": "url" },
    "layout": { "viewport": "desktop", "sections": [{ "order": 1, "type": "gnb|hero|grid|carousel|footer", ... }] }
  },
  "saved_to": "output/branding/{서비스명}.json"
}
layout은 레이아웃 추출을 수행한 경우에만 포함.

## 품질 체크
- branding.colors.primary가 null이면 재시도 (최대 2회)
- fonts 배열이 비어있으면 /site-scrape로 HTML을 가져와서 font-family를 직접 파싱
```

#### Skill ⑥: `benchmark-report/SKILL.md` — 리포트 생성

```yaml
---
name: benchmark-report
description: >
  최종 확정된 벤치마킹 사이트 목록과 분석 데이터를 기반으로 
  구조화된 벤치마킹 리포트를 생성하는 스킬.
  벤치마킹 프로세스의 마지막 단계에서 사용.
disable-model-invocation: true
argument-hint: [최종 확정 데이터 JSON]
allowed-tools: Read, Write
---

# 벤치마킹 리포트 생성

## 입력
$ARGUMENTS = 최종 확정된 사이트 리스트 (JSON)

## 실행 절차

### Step 1: 벤치마킹 테이블 생성
확정된 7~10개 사이트를 다음 마크다운 테이블로 정리한다:

| Type | Service | URL | Selection Reason |
|------|---------|-----|-----------------|
| DIRECT | ... | ... | ... |
| INDIRECT | ... | ... | ... |
| INSPIRE | ... | ... | ... |

### Step 2: 디자인 시스템·레이아웃 비교표 생성 (Inspire 유형만)
output/branding/ 디렉토리의 JSON 파일을 읽어서 비교표를 생성한다. 디자인 시스템(컬러·폰트·스페이싱)과, 있으면 layout.sections(페이지 레이아웃 구조)를 포함한다:

| 항목 | Site A | Site B | Site C |
|------|--------|--------|--------|
| Color Scheme | light | dark | light |
| Primary Color | #FF6B35 | #004E89 | ... |
| Font Family | Inter | Roboto | ... |
| Base Spacing | 8px | 4px | ... |
| Layout sections | gnb→hero→grid→footer | ... | ... |

### Step 3: 스크린샷 참조 정리
output/screenshots/ 디렉토리의 이미지를 사이트별로 정리하여 
마크다운에 이미지 경로를 삽입한다.

### Step 4: 경영진 요약 (Executive Summary)
전체 분석 결과를 500자 이내로 요약한다:
- 벤치마킹 대상 개요 (Direct / Indirect / Inspire 각 몇 개)
- 핵심 인사이트 3가지
- 시장 포지셔닝 요약
- 디자인 트렌드 요약
- 권고 사항

### Step 5: 파일 저장
- output/reports/benchmark-report.md (전체 리포트)
- output/reports/executive-summary.md (경영진 요약)

## 출력
"리포트가 다음 경로에 저장되었습니다:" 와 함께 파일 경로를 반환한다.
```

#### Skill ⑦: `run-benchmark/SKILL.md` — 벤치마킹 진입점 (트리거 전용)

```yaml
---
name: run-benchmark
description: >
  벤치마킹 프로세스를 시작하는 진입점 스킬.
  인풋을 context-builder에 전달하고, orchestrator가 전체 프로세스를 조율하도록 한다.
disable-model-invocation: true
argument-hint: [RFP 내용, URL, 또는 간단한 프로젝트 설명]
allowed-tools: Read, Write
---

# 웹사이트 벤치마킹 실행

## 입력
$ARGUMENTS = 다음 중 하나:
- RFP 파일 경로
- RFP 텍스트 내용
- 웹사이트 URL + 간단한 설명
- 프로젝트에 대한 단편적 정보

## 실행

### Step 1: output 디렉토리 초기화
output/screenshots, output/branding, output/reports, output/data
디렉토리를 생성한다.

### Step 2: 인풋 저장
$ARGUMENTS를 output/data/raw-input.txt에 저장한다.

### Step 3: context-builder 호출
"context-builder 서브에이전트를 사용하여 다음 인풋으로 프로젝트 브리프를 생성하라."
$ARGUMENTS 전체를 전달한다.

### Step 4: orchestrator 호출
context-builder가 완료되면 output/data/project-brief.json을 읽어서
"orchestrator 서브에이전트를 사용하여 벤치마킹 프로세스를 실행하라."
프로젝트 브리프 전체를 전달한다.

### Step 5: 완료 확인
orchestrator가 완료되면 output/reports/ 디렉토리의 파일 존재를 확인하고
최종 결과를 사용자에게 보고한다.
```

### 4-3. Skill — Subagent — MCP 매핑 요약

| Skill | 사용하는 MCP 도구 | 호출하는 Subagent |
|---|---|---|
| multi-search | brave-search: `brave_web_search` | — |
| site-scrape | firecrawl: `firecrawl_scrape`, `firecrawl_map` | — |
| screenshot-capture | firecrawl: `firecrawl_scrape` (screenshot 포맷) | — |
| traffic-verify | firecrawl: `firecrawl_scrape`, brave-search: `brave_web_search` | — |
| branding-extract | firecrawl: `firecrawl_scrape` (branding·images), 선택 시 json/extract로 레이아웃 | — |
| benchmark-report | — (파일 시스템만 사용) | — |
| run-benchmark | — (진입점만) | **context-builder** → **orchestrator** (이후 orchestrator가 market/ux/design-researcher, site-auditor 호출) |

| Subagent | 사전 로딩 Skills | MCP 서버 |
|---|---|---|
| **context-builder** | multi-search, site-scrape | brave-search, firecrawl |
| **orchestrator** | multi-search, benchmark-report | brave-search |
| market-researcher | multi-search, traffic-verify | brave-search, firecrawl |
| ux-researcher | multi-search, site-scrape | brave-search, firecrawl |
| design-researcher | multi-search, screenshot-capture, branding-extract | brave-search, firecrawl |
| site-auditor | site-scrape, traffic-verify | firecrawl |

---

## 5. Hook 설정

### 5-1. Hook이 필요한 지점

현재 설계에서 Hook은 두 가지 목적으로 사용합니다. 첫째, 서브에이전트가 완료될 때마다 결과 데이터를 자동으로 로그 파일에 누적 기록하는 것(감사 추적). 둘째, 파일 저장 시 output 디렉토리 구조가 올바른지 자동 검증하는 것입니다.

### 5-2. Hook 설정 파일

Cursor의 경우 `.cursor/hooks/` 디렉토리 또는 Cursor Settings에서 설정합니다.

#### Hook ①: 서브에이전트 완료 시 데이터 로깅

**scripts/log-agent-result.sh**

```bash
#!/bin/bash
# 서브에이전트 완료 시 실행되는 로깅 스크립트
# SubagentStop 이벤트에서 호출됨

INPUT=$(cat)

# 에이전트 이름과 타임스탬프 추출
AGENT_NAME=$(echo "$INPUT" | jq -r '.agent_type // "unknown"')
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# 로그 디렉토리 확인 및 생성
mkdir -p output/data

# 로그 기록 (JSON Lines 형식)
echo "{\"timestamp\": \"$TIMESTAMP\", \"agent\": \"$AGENT_NAME\", \"event\": \"completed\"}" \
  >> output/data/agent-activity.jsonl

exit 0
```

```bash
chmod +x scripts/log-agent-result.sh
```

#### Hook ②: 파일 저장 시 디렉토리 구조 자동 생성

**scripts/ensure-output-dirs.sh**

```bash
#!/bin/bash
# Write/Edit 도구 실행 전, output 하위 디렉토리가 존재하는지 확인

mkdir -p output/screenshots
mkdir -p output/branding
mkdir -p output/reports
mkdir -p output/data

exit 0
```

```bash
chmod +x scripts/ensure-output-dirs.sh
```

### 5-3. Cursor Settings에서 Hook 등록

Cursor의 프로젝트 설정에서 다음과 같이 Hook을 등록합니다.

```json
{
  "hooks": {
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/log-agent-result.sh"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/ensure-output-dirs.sh"
          }
        ]
      }
    ]
  }
}
```

### 5-4. Hook 동작 요약

| Hook 이벤트 | 트리거 시점 | 실행 스크립트 | 목적 |
|---|---|---|---|
| SubagentStop | 서브에이전트 완료 시 (context-builder, orchestrator, market/ux/design-researcher, site-auditor 등) | `log-agent-result.sh` | 에이전트 활동 로그 누적 기록 |
| PreToolUse (Write) | 파일 저장 직전 | `ensure-output-dirs.sh` | output 디렉토리 구조 자동 생성 |

---

## 부록: 최종 프로젝트 디렉토리 구조

```
benchmark-agent/
│
├── .cursor/
│   ├── mcp.json                              # MCP 서버 설정 (Brave Search, Firecrawl)
│   │
│   ├── rules/
│   │   ├── output-format.mdc                 # [Rule] 공통 데이터 출력 포맷
│   │   ├── exclusion-criteria.mdc            # [Rule] 제외 조건 + 보정 규칙
│   │   ├── search-principles.mdc             # [Rule] 검색 핵심 원칙
│   │   └── file-conventions.mdc              # [Rule] 파일/폴더 저장 규칙
│   │
│   ├── skills/
│   │   ├── multi-search/
│   │   │   └── SKILL.md                      # [Skill] 다중 소스 검색
│   │   ├── site-scrape/
│   │   │   └── SKILL.md                      # [Skill] 사이트 스크래핑 + 구조 분석
│   │   ├── screenshot-capture/
│   │   │   └── SKILL.md                      # [Skill] 데스크톱/모바일 스크린샷 캡처
│   │   ├── traffic-verify/
│   │   │   └── SKILL.md                      # [Skill] 트래픽 데이터 검증
│   │   ├── branding-extract/
│   │   │   └── SKILL.md                      # [Skill] 디자인 시스템 추출
│   │   ├── benchmark-report/
│   │   │   └── SKILL.md                      # [Skill] 최종 리포트 생성
│   │   └── run-benchmark/
│   │       └── SKILL.md                      # [Skill] 진입점(트리거) — context-builder → orchestrator 호출
│   │
│   └── agents/
│       ├── context-builder.md                # [Subagent] ★ PHASE 0: 인풋 → 프로젝트 브리프 생성
│       ├── orchestrator.md                   # [Subagent] ★ PHASE 1~4 총괄 오케스트레이션
│       ├── market-researcher.md              # [Subagent] Direct Competitor 발굴
│       ├── ux-researcher.md                  # [Subagent] Indirect Competitor 발굴
│       ├── design-researcher.md              # [Subagent] Design Inspiration 발굴
│       └── site-auditor.md                   # [Subagent] 후보 사이트 품질 검증
│
├── scripts/
│   ├── log-agent-result.sh                   # [Hook] 에이전트 활동 로깅
│   └── ensure-output-dirs.sh                 # [Hook] 출력 디렉토리 자동 생성
│
├── output/                                   # [산출물] (자동 생성)
│   ├── screenshots/
│   ├── branding/
│   ├── reports/
│   └── data/
│       ├── raw-input.txt                     # 원본 인풋 보존
│       ├── project-brief.json                # context-builder 산출물
│       ├── candidates.json
│       └── agent-activity.jsonl
│
└── README.md                                 # 프로젝트 설명
```

---

## 부록: 실행 방법

### 사전 준비

1. Brave Search API 키 발급 (https://brave.com/search/api/)
2. Firecrawl API 키 발급 (https://www.firecrawl.dev/signup)
3. `.cursor/mcp.json`의 API 키를 실제 값으로 교체
4. `scripts/` 디렉토리의 .sh 파일에 실행 권한 부여: `chmod +x scripts/*.sh`
5. Cursor IDE에서 프로젝트 열기

### 실행

Cursor Composer (Agent 모드)에서 **/run-benchmark** 스킬을 호출합니다. 인풋은 RFP 전체, URL+한 줄, 또는 단편 정보 어느 것이든 가능합니다.

#### 시나리오 1: URL만 던진 경우 (Level 1)

```
/run-benchmark www.oliveyoung.co.kr 리뉴얼 해주세요
```

**context-builder가 자율적으로:**
1. 올리브영 사이트 스크래핑 → 뷰티/헬스 커머스, B2C, 상품검색/추천/결제/리뷰 기능 추론
2. "올리브영 회사 소개", "올리브영 경쟁사" 검색 → CJ 계열, 시장 1위, 경쟁사로 화해/무신사뷰티/시코르 등 파악
3. "뷰티 커머스 시장 트렌드" 검색 → 개인화 추천, 성분 검색, 라이브 커머스 트렌드 포착
4. "올리브영 리뷰 단점" 검색 → 사용자 불만 포인트 수집
5. 완전한 project-brief.json 생성 → orchestrator에 전달

이후 PHASE 1~4는 동일하게 진행됩니다. 소요 시간은 PHASE 0 포함 **약 36~60분**입니다.

#### 시나리오 2: 완전한 RFP인 경우 (Level 4)

```
/run-benchmark ./docs/rfp-education-platform.pdf
```

**context-builder가:**
1. input_level: Level 4 판별
2. RFP 파싱 → 핵심 4항목 직접 추출
3. 보충 검색 최소화 (카테고리 검증 + 시장 동향 정도만)
4. project-brief.json 생성 → orchestrator에 전달

소요 시간은 **약 29~50분**입니다. orchestrator 이하 프로세스는 Level 1과 동일합니다.

#### 시나리오 3: 요약 브리프 (Level 3)

```
/run-benchmark

프로젝트: 온라인 쇼핑몰 리뉴얼
목적: B2C 커머스, 기존 사이트 리뉴얼
타겟: 20~30대 여성
주요 기능: 상품 검색/필터, 개인화 추천, 간편 결제, 리뷰 시스템, 위시리스트
서비스 모델: 직접 판매
예산: 중규모
국내 프로젝트
```

context-builder가 인풋 레벨을 판별한 뒤 필요 시 최소한의 검색으로 보완하고, project-brief.json을 생성하여 orchestrator에 전달합니다.

---

완료 후 `output/reports/` 디렉토리에 벤치마킹 리포트가 생성되며, 최종 보고 시 **어떤 input_level에서 시작했는지**가 명시됩니다.