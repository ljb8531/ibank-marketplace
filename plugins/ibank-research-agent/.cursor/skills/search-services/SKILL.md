---
name: search-services
description: Search for benchmark target services by domain and keywords, run five search patterns, extract services from comparison articles, validate must_include, and write search-log.md. Use when Domain Scout discovers services (Phase 1), when starting a benchmarking workflow, or when the user asks to find services for a domain.
---

# search-services

Service-Scout 소속. 키워드 기반으로 벤치마킹 대상 서비스를 검색하고 목록을 확보한다.

## 입력

- **domain**: 서비스 도메인 (예: "마케팅 자동화")
- **keywords**: 검색 키워드 목록
- **scope**: `"국내"` | `"해외"` | `"전체"`
- **must_include**: 반드시 포함할 서비스명 목록

## 가드레일

1. **5가지 검색 패턴을 모두 수행**한다 (하나라도 생략하지 않는다).
2. 비교 글이 발견되면 **반드시 mcp_web_fetch로 본문을 수집**하여 추가 서비스를 추출한다 (스니펫만으로 건너뛰지 않는다).
3. **must_include의 모든 서비스**가 최종 목록에 포함되었는지 검증한다.
4. 최종 목록이 **7개 미만이면** `status: "insufficient"`를 반환한다.
5. 뉴스·블로그·리뷰 **사이트 자체 URL은** 서비스 목록에 포함하지 않는다.
6. **모든 검색 기록**을 `research/temp/search-log.md`에 추가한다.

## 실행 절차

### Step 1: 직접 검색 (최소 2회)

- `[WebSearch] "{domain} 서비스"`
- `[WebSearch] "{domain} 플랫폼"`
- 결과에서 서비스 공식 URL 추출
- `research/temp/search-log.md`에 검색어 + 결과 수 기록

### Step 2: 비교/리뷰 검색 (최소 2회)

- `[WebSearch] "{domain} 서비스 비교"`
- `[WebSearch] "best {keywords[0]} tools"`
- 비교 글 URL 발견 시:
  - `[mcp_web_fetch]` 비교 글 본문 수집
  - 본문에서 서비스명 + URL 추출 (최소 3개 이상 추출 시도)
- `research/temp/search-log.md`에 비교 글 URL + 추출 서비스 수 기록

### Step 3: 특화 검색 (최소 1회)

- `[WebSearch]` 도메인 특화 키워드 조합
- `research/temp/search-log.md`에 기록

### Step 4: scope별 추가 검색

- **scope**가 `"국내"` 또는 `"전체"` → 한국어 키워드로 최소 1회 추가 검색
- **scope**가 `"해외"` 또는 `"전체"` → 영어 키워드로 최소 1회 추가 검색
- `research/temp/search-log.md`에 기록

### Step 5: must_include 검증

- must_include의 각 서비스가 현재 목록에 있는지 확인
- 없는 서비스: `[WebSearch] "{서비스명} 공식 사이트"` → URL 확보
- `research/temp/search-log.md`에 검증 결과 기록

### Step 6: 필터링 및 검증

- 뉴스·블로그·리뷰 사이트 URL 제거
- 중복 URL 제거
- 7개 미만이면 `status: "insufficient"` 반환
- `research/temp/search-log.md`에 최종 목록 기록

## 출력

다음 JSON 구조로 반환한다.

```json
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

## 호출자 판단

- **status가 "insufficient"** → keywords를 변경(동의어, 상위/하위 개념)하여 search-services 재호출
- **status가 "sufficient"** → Phase 2(페이지 수집 등)로 진행
- **must_include 서비스가 빠져 있으면** → 해당 서비스 검색 추가 후 재호출

## 사용 도구

- **WebSearch**: 모든 검색 단계
- **mcp_web_fetch**: 비교 글 본문 수집 (Step 2)

## 부산물

- `research/temp/search-log.md`: 검색어, 비교 글 URL, 추출 서비스 수, 최종 목록 등 검색 수행 기록 추가
