# start

먼저 프로젝트 루트에 .env.mcp 파일이 존재하는지 확인합니다.

# .env.mcp 존재하지 않을경우
먼저 터미널에서 npm install -g envmcp 를 실행 합니다.
실행이 다 되면 그 후에
---
BRAVE_API_KEY=your_brave_api_key_here
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
---
위와 같은 내용으로 프로젝트 루트에 .env.mcp 파일을 새로 생성하고
사용자에게 아래와 같은 설명을 전달 합니다.
---
1. **Brave Search API 키**  
   [brave.com/search/api](https://brave.com/search/api/) 에서 발급 후 `.env.mcp`에 BRAVE_API_KEY 값을 입력해주세요.
2. **Firecrawl API 키**  
   [firecrawl.dev/signup](https://www.firecrawl.dev/signup) 에서 발급 후 `.env.mcp`에 FIRECRAWL_API_KEY 값을 입력해주세요.
---

# .env.mcp 존재 하는경우

1. **상위 폴더 결정**  
   사용자 프롬프트에서 주제·서비스명·키워드를 유추해 **상위 폴더명**을 정한다.  
   - 영문 소문자, 공백은 하이픈, 특수문자 제거 (예: `무신사 리뉴얼` → `musinsa-renewal`).  
   - 같은 주제를 나중에 구분하려면 `runs/` 아래에 날짜를 붙여도 된다 (예: `runs/2025-03-13-musinsa-renewal`).

2. **폴더 생성 및 경로 기록**  
   - 해당 상위 폴더를 프로젝트 루트에 생성한다: `mkdir -p {상위폴더명}`  
   - 그 경로를 **한 줄**로 프로젝트 루트의 `.benchmark-output-root` 파일에 기록한다.  
   - 이후 hook의 `ensure-output-dirs.sh`가 이 경로 하위에 `output/` 및 하위 디렉터리를 만든다.

3. **벤치마크 실행**  
   사용자 프롬프트와 함께 `/run-benchmark` 스킬을 호출하여 실행한다.