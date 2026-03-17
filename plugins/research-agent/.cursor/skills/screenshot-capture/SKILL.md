---
name: screenshot-capture
description: >
  Firecrawl로 URL의 데스크톱/모바일 풀페이지 스크린샷을 캡처하는 스킬.
  Firecrawl 실패·품질 부족 시 Playwright MCP로 폴백·보조. Playwright는 뷰포트 제어·로딩 대기·품질 재캡처 등 강력한 보조수단으로 활용.
  design-researcher가 Inspire 후보 비주얼 자산 수집 시(PHASE 2 소스 5), 또는 디자인 벤치마킹·리포트용 스크린샷 수집 시 사용.
argument-hint: [URL]
allowed-tools: Bash, Read, Write, call_mcp_tool
---

# Screenshot-Capture

## 언제 사용하는가

- **Design-researcher (PHASE 2):** Awwwards, GDWEB, Behance 등에서 Inspire 후보를 확보한 뒤, **소스 5(비주얼 자산 수집)** 단계에서 **후보 URL마다 1회** 실행. Inspire 산출에 필수이며, 미실행 시 benchmark-report에 스크린샷 경로가 없음.
- **직접 사용:** 특정 URL의 데스크톱/모바일 스크린샷이 디자인 레퍼런스나 리포팅에 필요할 때.

## MCP 요구사항

| MCP 서버 | 도구 | 용도 |
|----------|------|------|
| **firecrawl** (`project-0-Research-Agent-firecrawl`) | `firecrawl_scrape` | 해당 페이지의 스크린샷 URL 획득 (1차) |
| **playwright** (`project-0-Research-Agent-playwright`) | `browser_navigate`, `browser_take_screenshot`, `browser_resize`, `browser_wait_for` | Firecrawl 실패 시 폴백·품질 부족 시 재캡처·뷰포트 정밀 제어 등 강력한 보조 |

`.cursor/mcp.json`에 firecrawl·playwright 설정. Firecrawl은 API 키 필요. Playwright는 폴백이 아닌 **보조수단**으로 품질 검증·특정 뷰포트 캡처에 활용.

## 경로 (OUTPUT_BASE)

프로젝트 루트의 `.benchmark-output-root`를 읽어 OUTPUT_BASE 확정(없으면 `output`). 스크린샷 저장 경로는 `{OUTPUT_BASE}/output/screenshots/{서비스명}/`.

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
- 디렉터리 생성: `{OUTPUT_BASE}/output/screenshots/{서비스명}/`.
- 각 스크린샷 URL을 다운로드(예: `curl`)하여 저장:
  - `{OUTPUT_BASE}/output/screenshots/{서비스명}/desktop_full.png`
  - `{OUTPUT_BASE}/output/screenshots/{서비스명}/mobile_full.png`

### 4. 품질 체크

- 저장된 파일 크기가 10KB 미만이면 실패(빈/깨진 페이지)로 간주. 이때 **Playwright 보조**로 재캡처 시도(로딩 대기 후 캡처).
- Firecrawl 오류 시 최대 3회 재시도(짧은 간격). 계속 실패하면 **Playwright 폴백(5단계)** 으로 전환.

### 5. Playwright 보조·폴백 (강력한 보조수단)

Playwright는 **단순 폴백이 아니라** 다음에 적극 활용한다.

- **폴백:** Firecrawl이 막혀 있거나, 에러·rate limit으로 재시도 후에도 수집이 안 될 때 → 데스크톱/모바일 캡처를 Playwright로 대체.
- **품질 보완:** Firecrawl 스크린샷이 10KB 미만이거나 빈 화면일 때 → Playwright로 `browser_navigate` → `browser_wait_for`(time=3) 후 `browser_take_screenshot`(fullPage: true) 재캡처.
- **뷰포트 정밀 제어:** 특정 브레이크포인트(예: 375×812, 390×844)가 필요할 때 → Playwright `browser_resize`로 지정 후 캡처.

**Playwright 폴백 실행 절차**

1. **데스크톱**
   - Playwright MCP: `browser_navigate`(url=`$ARGUMENTS`) → `browser_wait_for`(time=2~3) → `browser_take_screenshot`(type=`"png"`, fullPage: true, filename: `{OUTPUT_BASE}/output/screenshots/{서비스명}/desktop_full.png` 또는 상대 경로).
   - 반환된 **저장 경로**가 워크스페이스 밖이면 `mkdir -p {OUTPUT_BASE}/output/screenshots/{서비스명}/` 후 해당 파일을 `{OUTPUT_BASE}/output/screenshots/{서비스명}/desktop_full.png`로 **복사**. filename에 이미 output 경로를 주면 워크스페이스 내에 저장될 수 있음.
   - 복사 후 품질 체크(파일 크기 10KB 이상).

2. **모바일**
   - `browser_resize`(width=375, height=812) 호출 후 `browser_navigate`(url=`$ARGUMENTS`) → `browser_wait_for`(time=2) → `browser_take_screenshot`(type=`"png"`, fullPage: true, filename: `{OUTPUT_BASE}/output/screenshots/{서비스명}/mobile_full.png`).
   - 저장 경로 확인 후 필요 시 `{OUTPUT_BASE}/output/screenshots/{서비스명}/mobile_full.png`로 복사.

3. **주의**
   - Playwright 스크린샷은 `filename`에 **상대 경로**(예: `{OUTPUT_BASE}/output/screenshots/{서비스명}/desktop_full.png`)를 주면 워크스페이스 내에 저장되므로, 출력의 `screenshots` 경로는 이 경로를 사용한다. 반환 경로가 다르면 복사 후 해당 경로를 출력에 기재.
   - 폴백·보조 사용 시 출력에 `"source": "playwright_fallback"` 또는 `"playwright_supplement"` 등으로 구분.

## 출력 포맷

다음 형태로 반환:

```json
{
  "url": "<입력 URL>",
  "screenshots": {
    "desktop_full": "{OUTPUT_BASE}/output/screenshots/{서비스명}/desktop_full.png",
    "mobile_full": "{OUTPUT_BASE}/output/screenshots/{서비스명}/mobile_full.png"
  },
  "status": "success | partial | failed",
  "source": "firecrawl | playwright_fallback | playwright_supplement (선택)"
}
```

Inspire 후보의 경우 design-researcher가 이 경로를 후보의 `screenshots` 필드에 넣어 benchmark-report가 참조할 수 있게 한다.

## 요약: 1차(Firecrawl) vs 보조·폴백(Playwright)

| 단계 | 1차 도구 | 인자 | Playwright 보조·폴백 | 비고 |
|------|----------|------|----------------------|------|
| 데스크톱 | `firecrawl_scrape` | `url`, `formats: ["screenshot"]`, `screenshotOptions: { fullPage: true }` | `browser_navigate` → `browser_wait_for`(time=2~3) → `browser_take_screenshot`(type, fullPage, filename) | 품질 부족 시 재캡처·실패 시 폴백 |
| 모바일 | `firecrawl_scrape` | 위와 동일 + `mobile: true` | `browser_resize`(375,812) → `browser_navigate` → `browser_wait_for` → `browser_take_screenshot` | 뷰포트 정밀 제어·폴백 |

Firecrawl의 다른 도구는 사용하지 않는다. Playwright 사용 시 `filename`에 `{OUTPUT_BASE}/output/screenshots/{서비스명}/desktop_full.png` 등 **상대 경로**를 주어 워크스페이스 내에 저장하고, 반환 경로가 다르면 해당 위치로 복사한 경로를 출력에 사용한다.
