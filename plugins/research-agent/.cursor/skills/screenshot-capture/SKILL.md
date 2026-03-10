---
name: screenshot-capture
description: >
  Firecrawl로 URL의 데스크톱/모바일 풀페이지 스크린샷을 캡처하는 스킬.
  design-researcher가 Inspire 후보 비주얼 자산 수집 시(PHASE 2 소스 5), 또는 디자인 벤치마킹·리포트용 스크린샷 수집 시 사용.
argument-hint: [URL]
allowed-tools: Bash, Read, Write
---

# Screenshot-Capture

## 언제 사용하는가

- **Design-researcher (PHASE 2):** Awwwards, GDWEB, Behance 등에서 Inspire 후보를 확보한 뒤, **소스 5(비주얼 자산 수집)** 단계에서 **후보 URL마다 1회** 실행. Inspire 산출에 필수이며, 미실행 시 benchmark-report에 스크린샷 경로가 없음.
- **직접 사용:** 특정 URL의 데스크톱/모바일 스크린샷이 디자인 레퍼런스나 리포팅에 필요할 때.

## MCP 요구사항

| MCP 서버 | 도구 | 용도 |
|----------|------|------|
| **firecrawl** | `firecrawl_scrape` | 해당 페이지의 스크린샷 URL 획득 |

`.cursor/mcp.json`에 firecrawl 설정 필요(Firecrawl API 키 필요).

## 입력

`$ARGUMENTS` = 캡처할 전체 URL (예: `https://example.com`).

## 실행 절차

### 1. 데스크톱 스크린샷

**firecrawl** MCP의 **firecrawl_scrape** 호출:

- `url`: `$ARGUMENTS`
- `formats`: `["screenshot"]`
- `screenshotOptions`: `{ "fullPage": true }`

응답에서 스크린샷 URL(또는 이미지 URL 필드)을 추출 → **desktop_full**로 사용.

### 2. 모바일 스크린샷

**firecrawl** MCP의 **firecrawl_scrape** 한 번 더 호출:

- `url`: `$ARGUMENTS`
- `formats`: `["screenshot"]`
- `screenshotOptions`: `{ "fullPage": true }`
- `mobile`: `true`

응답에서 스크린샷 URL 추출 → **mobile_full**로 사용.

### 3. 로컬 저장

- URL에서 **서비스명** 도출: 소문자, 공백은 `-`, 특수문자 제거. 예: `29cm`, `musinsa-store`.
- 디렉터리 생성: `output/screenshots/{서비스명}/`.
- 각 스크린샷 URL을 다운로드(예: `curl`)하여 저장:
  - `output/screenshots/{서비스명}/desktop_full.png`
  - `output/screenshots/{서비스명}/mobile_full.png`

### 4. 품질 체크

- 저장된 파일 크기가 10KB 미만이면 실패(빈/깨진 페이지)로 간주하고 `status: "failed"` 설정.
- Firecrawl 오류 시 최대 3회 재시도(짧은 간격).

## 출력 포맷

다음 형태로 반환:

```json
{
  "url": "<입력 URL>",
  "screenshots": {
    "desktop_full": "output/screenshots/{서비스명}/desktop_full.png",
    "mobile_full": "output/screenshots/{서비스명}/mobile_full.png"
  },
  "status": "success | partial | failed"
}
```

Inspire 후보의 경우 design-researcher가 이 경로를 후보의 `screenshots` 필드에 넣어 benchmark-report가 참조할 수 있게 한다.

## 요약: Firecrawl 사용법

| 단계 | 도구 | 인자 |
|------|------|------|
| 데스크톱 | `firecrawl_scrape` | `url`, `formats: ["screenshot"]`, `screenshotOptions: { fullPage: true }` |
| 모바일 | `firecrawl_scrape` | 위와 동일 + `mobile: true` |

이 스킬에서는 Firecrawl의 다른 도구는 사용하지 않는다.
