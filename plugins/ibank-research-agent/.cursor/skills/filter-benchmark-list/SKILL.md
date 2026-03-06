---
name: filter-benchmark-list
description: 벤치마크 후보 목록에 최종 필터링 규칙을 적용한다. 제외 5조건(소규모·랜딩전용·분석불가·앱전용·로그인필수) 및 보정 규칙(규모 밸런스·접근성·최신성)을 적용해 filtered·excluded를 반환. Domain Scout가 select-benchmark-candidates 결과를 합친 뒤 호출. Use when Domain Scout runs Phase 3 (final filtering before output).
---

# filter-benchmark-list

AI가 선정한 벤치마크 후보에 **최종 필터링 규칙**을 적용하여 분석 불가·부적합 대상을 제거하고, 보정 규칙으로 품질을 확보한다.

## 입력

- **candidates**: 유형별로 수집된 후보 배열. 각 항목은 최소 `name`, `url`, `type`(direct|indirect|inspiration), `reason_for_selection` 포함.
- **categories** (선택): industry_categories. 규모 밸런스 판단 시 참고.

## 제외 5조건 (반드시 제외)

다음에 해당하는 사이트는 **excluded**로 분류하고 최종 목록에서 제외한다.

1. **서비스 규모가 지나치게 작거나**, 개인이 운영하는 수준의 사이트
2. **실제 서비스 없이 랜딩페이지만** 존재하거나 Coming Soon 상태인 곳
3. **구체적인 기능 분석이 불가능한** 단순 브로셔 형태의 사이트
4. **웹사이트 기능이 제한적인** 모바일 앱 전용(App-only) 서비스
5. **로그인 없이는** 내부 기능·UX 흐름 확인이 불가능한 폐쇄형 서비스

## 보정 및 검증 규칙

- **규모 밸런스**: 빅테크(Amazon, Google 등)에만 의존하지 않고, 유사 규모의 혁신적 경쟁사를 포함할 것. (필수 제외는 아니나, 최종 목록 구성 시 참고)
- **접근성 확인**: 해외 사이트는 지역 제한(Geoblocking)·언어 장벽으로 분석 가능한지 주의. 확인 불가 시 excluded 후보로 둘 수 있음.
- **최신성 검증**: 최근 1년 이내 업데이트가 없는 방치된 사이트는 후순위 배치 또는 excluded 시 이유 명시.

## 실행 절차

1. **candidates**를 순회하며 위 **제외 5조건**에 해당하는지 판단한다.
   - 판단 시 URL·서비스명·brief·공개된 정보만 사용 가능. 직접 방문하지 않는다.
   - 해당하면 `excluded` 배열에 `{ ...item, excluded_reason: "조건 번호 또는 설명" }` 형태로 넣는다.
2. 제외되지 않은 항목만 **filtered** 배열에 넣는다.
3. **개수 가이드 재확인**: filtered가 Direct 5+, Indirect 3+, Inspiration 3+, **총 11개 이상**을 만족하는지 확인한다.
   - 만족하지 않으면 status를 `"insufficient"`로 하고, 부족한 유형과 개수를 명시한다.
4. search_log에 필터링 요약(제외 건수, 사유 요약)을 추가한다.

## 출력

다음 JSON 구조로 반환한다.

```json
{
  "status": "sufficient" | "insufficient",
  "filtered": [
    {
      "name": "서비스명",
      "url": "https://...",
      "type": "direct" | "indirect" | "inspiration",
      "brief": "한 줄 설명",
      "reason_for_selection": "선정 이유 1~2문장",
      "source": "직접 검색 | 비교 글 추출 | must_include 지정"
    }
  ],
  "excluded": [
    {
      "name": "서비스명",
      "url": "https://...",
      "type": "direct" | "indirect" | "inspiration",
      "excluded_reason": "랜딩페이지만 존재"
    }
  ],
  "summary": {
    "direct_count": 5,
    "indirect_count": 3,
    "inspiration_count": 3,
    "total": 11,
    "excluded_count": 2
  }
}
```

## 호출자 판단

- **status가 "insufficient"** → Domain Scout가 부족한 유형에 대해 select-benchmark-candidates를 다시 호출해 후보를 보강한 뒤 filter-benchmark-list 재호출.
- **status가 "sufficient"** → filtered를 최종 서비스 목록으로 사용하고, 표(TYPE | SERVICE | REASON) 형식으로 정리해 반환한다.

## 사용 도구

- 별도 웹 요청·크롤링 없이 **입력된 candidates 정보만**으로 판단한다. (WebSearch/mcp_web_fetch 사용하지 않음)

## 부산물

- `research/temp/search-log.md`: 필터링 적용 요약(제외 건수, excluded_reason 요약) 추가
