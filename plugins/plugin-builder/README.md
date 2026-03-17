# Plugin Builder Plugin

대화형 인터뷰로 업무 프로세스를 Cursor 플러그인으로 자동 변환하는 메타 플러그인입니다. 업무 목적·절차·도구를 수집한 뒤 T-T-D-A-V 사고사슬 맵 → MCP 의존성 해결 → 컴포넌트 설계 → Skill/Agent/Rule/Command/Hook 생성 → 검증까지 수행합니다.

**버전:** 1.0.0  
**작성:** ibank-ax (jblee@ibank.co.kr)

---

## 요구 사항

- Cursor IDE 2.5+
- Node.js (훅·스크립트 실행용)
- MCP 사용 시: `envmcp` 전역 설치 및 `.env.mcp` 설정

---

## 설치 및 설정

1. **플러그인 활성화**  
   이 프로젝트를 Cursor에서 열거나, `.cursor-plugin` 및 `.cursor` 디렉터리를 사용 중인 프로젝트에 복사합니다.

2. **MCP 환경 (선택)**  
   Brave Search·Firecrawl 등 MCP를 쓰려면:
   - 터미널에서 `npm install -g envmcp` 실행
   - 프로젝트 루트에 `.env.mcp`가 없으면 **`/setup-mcp-env`** 실행 → 템플릿 생성 후 API 키 입력

---

## 사용 방법

| 커맨드 | 설명 |
|--------|------|
| **/new-plugin** | 새 플러그인 생성 시작. 인터뷰 → 사고사슬 맵 → MCP 의존성 → 구조 설계 → 컴포넌트 작성 → 검증까지 순차 진행 |
| **/setup-mcp-env** | MCP 최초 설정. `.env.mcp` 없을 때 생성, `envmcp` 설치 안내 |
| **/add-component** | 기존 플러그인에 Skill/Agent/Rule/Command/Hook 추가 |
| **/visualize-process** | 추출된 T-T-D-A-V 맵을 Mermaid 다이어그램으로 시각화 |
| **/validate-plugin** | 플러그인 구조·스펙·연결성 검증 및 리포트 출력 |
| **/publish-plugin** | 배포 옵션 안내(로컬/전역/Marketplace). 팀 마켓플레이스 등록 시 `/register-plugin` 안내 |
| **/register-plugin** | `marketplace.json`의 `plugins`에 현재 플러그인 정보 등록·갱신 |

---

## 디렉터리 구조

```
├── .cursor-plugin/plugin.json   # 플러그인 매니페스트
├── .env.mcp                     # MCP 환경변수 (선택)
├── .cursor/
│   ├── mcp.json                 # MCP 서버 설정 (envmcp 사용)
│   ├── hooks.json               # 훅 (글자수·구조 검증)
│   ├── agents/                  # 서브에이전트
│   ├── skills/                 # 스킬
│   ├── commands/                # 슬래시 커맨드
│   └── rules/                   # 룰
├── references/                  # 상세 참조 문서
├── scripts/                     # validate-structure, count-chars
├── marketplace.json             # 팀 마켓플레이스 플러그인 목록
└── README.md                    # 본 사용 설명
```

---

## 라이선스

MIT
