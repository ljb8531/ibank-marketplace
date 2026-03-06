---
name: select-benchmark-candidates
description: 유형별(Direct/Indirect/Inspiration)로 벤치마크 후보를 검색한다. Direct 5개 이상, Indirect 3개 이상, Inspiration 3개 이상을 목표로 type별 검색 패턴을 수행하고, 각 후보에 type과 reason_for_selection을 부여한다. Domain Scout가 define-categories 이후 유형별로 호출. Use when Domain Scout runs Phase 2 (type-specific candidate search).
---

# select-benchmark-candidates

벤치마크 대상을 **유형(Direct / Indirect / Inspiration)**별로 검색하여 후보 목록을 확보한다. 유형마다 다른 검색 전략과 최소 개수 가이드를 적용한다.

## 개수 가이드

| 유형 | 최소 개수 | 목적 |
|------|----------|------|
| **direct** | 5개 이상 | 동일 산업·동일 서비스 목적, 시장 인지도 있는 직접 경쟁사 |
| **indirect** | 3개 이상 | 유사 기능·UX 해결(검색, 결제, 추천 등)을 잘 구현한 타 산업 서비스 |
| **inspiration** | 3개 이상 | Awwwards/Dribbble 등 디자인 트렌드·인터랙션 레퍼런스 |
| **총합** | 11개 이상 | |

## 입력

- **search_type**: `"direct"` | `"indirect"` | `"inspiration"`
- **categories**: define-categories 출력의 industry_categories (또는 domain 문자열)
- **core_purpose**: define-categories 출력의 core_purpose (선택)
- **main_features**: define-categories 출력의 main_features 배열 (선택, indirect 검색 시 활용)
- **keywords**: 검색에 사용할 키워드 목록
- **scope**: `"국내"` | `"해외"` | `"전체"`
- **must_include**: 반드시 포함할 서비스명 목록 (direct 호출 시에만 적용 권장)

## 가드레일

1. **search_type에 맞는 검색 패턴만** 수행한다 (아래 절차 참고).
2. 비교 글이 발견되면 **mcp_web_fetch로 본문 수집** 후 서비스명·URL 추출한다.
3. **뉴스·블로그·리뷰 사이트 URL**은 서비스 목록에 포함하지 않는다.
4. **모든 검색 기록**을 `research/temp/search-log.md`에 추가한다.
5. 각 후보에 **reason_for_selection**(1~2문장)을 반드시 부여한다.

## 실행 절차 (search_type별)

### search_type = "direct"

- **목표**: 동일 산업·동일 서비스 목적·유사 타겟·시장 인지도. **5개 이상** 수집.
- Step 1: `[WebSearch] "{categories[0]} 서비스"`, `"{categories[0]} 플랫폼"`
- Step 2: `[WebSearch] "{categories[0]} 서비스 비교"`, `"best {keywords[0]} tools"`
- 비교 글 URL 발견 시 `[mcp_web_fetch]` 본문 수집 → 서비스명·URL 추출
- Step 3: scope에 따라 국내/해외 추가 검색 1회 이상
- Step 4: must_include 검증 — 없으면 `[WebSearch] "{서비스명} 공식 사이트"`로 URL 확보
- **reason_for_selection**: "동종업계 시장 점유율", "유사 타겟·비즈니스 모델", "핵심 기능(RFP 요구) 일치" 등으로 1~2문장 작성

### search_type = "indirect"

- **목표**: 동일 산업은 아니지만 유사한 **기능·UX**(검색, 결제, 추천, 온보딩 등)를 잘 구현한 서비스. **3개 이상** 수집.
- Step 1: main_features 또는 키워드 기반 — `[WebSearch] "검색 UX 좋은 서비스"`, `"결제 플로우 벤치마크"`, `"개인화 추천 시스템"` 등
- Step 2: `[WebSearch] "{categories[0]} 유사 UX"`, `"best {main_features[0]} design"` 등
- 비교 글 발견 시 본문 수집 후 추출
- **reason_for_selection**: "검색/필터 UX 우수", "개인화 추천 로직 참고", "복잡 정보 전달 방식 벤치마킹" 등으로 1~2문장 작성

### search_type = "inspiration"

- **목표**: UI/UX 디자인·인터랙션·트렌드 레퍼런스. **3개 이상** 수집.
- Step 1: `[WebSearch] "Awwwards site of the day"`, `"Awwwards {categories[0]}"`
- Step 2: `[WebSearch] "best web design {연도}"`, `"Dribbble {industry} website"`
- 수상작·디자인 사례에서 **실제 서비스 URL**을 추출 (Behance/Dribbble 프로젝트 링크가 아닌, 해당 서비스 공식 사이트 우선)
- **reason_for_selection**: "Awwwards 수상, 마이크로 인터랙션 우수", "최신 다크모드·IA 참고" 등으로 1~2문장 작성

## 출력

다음 JSON 구조로 반환한다.

```json
{
  "status": "sufficient" | "insufficient",
  "search_type": "direct" | "indirect" | "inspiration",
  "services": [
    {
      "name": "서비스명",
      "url": "https://...",
      "brief": "한 줄 설명",
      "reason_for_selection": "선정 이유 1~2문장",
      "source": "직접 검색 | 비교 글 추출 | must_include 지정"
    }
  ],
  "search_log": ["검색 수행 기록"]
}
```

- **direct** 호출: 5개 미만이면 `status: "insufficient"`.
- **indirect** / **inspiration** 호출: 각각 3개 미만이면 `status: "insufficient"`.

## 호출자 판단

- **status가 "insufficient"** → keywords·검색어 확장 후 해당 search_type으로 select-benchmark-candidates 재호출.
- **status가 "sufficient"** → 다음 유형 호출 또는 filter-benchmark-list로 넘긴다.

## 사용 도구

- **WebSearch**: 모든 검색 단계
- **mcp_web_fetch**: 비교 글·리뷰 본문 수집

## 부산물

- `research/temp/search-log.md`: 검색어, 비교 글 URL, 추출 서비스 수, 유형별 목록 기록 추가
