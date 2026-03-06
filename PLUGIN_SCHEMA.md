# 플러그인 작성 가이드

마켓플레이스에 등록할 플러그인의 디렉터리 구조와 필수 파일을 설명합니다.

## 디렉터리 구조 (권장)

```
plugin-name/
├── .claude-plugin/
│   └── plugin.json        # 필수: 플러그인 매니페스트
├── commands/              # 선택: 슬래시 명령어 정의
├── agents/                # 선택: 에이전트 정의
├── skills/                # 선택: 스킬 (SKILL.md)
├── hooks/                 # 선택: 훅 설정
├── .mcp.json              # 선택: MCP 서버 설정
├── README.md              # 선택: 사용법
└── CHANGELOG.md           # 선택: 버전 이력
```

## plugin.json (필수)

`.claude-plugin/plugin.json` 파일이 반드시 있어야 합니다.

### 필수 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `name` | string | 플러그인 식별자 (kebab-case 권장) |
| `version` | string | 시맨틱 버전 (예: "1.0.0") |
| `description` | string | 한 줄 설명 |

### 선택 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `author` | object | `name`, `email`, `url` |
| `keywords` | string[] | 검색용 키워드 |
| `commands` | string \| string[] | 명령어 정의 경로 |
| `agents` | string | 에이전트 디렉터리 경로 |
| `hooks` | string | 훅 설정 파일 경로 |
| `mcpServers` | string | MCP 설정 파일 경로 |

### 최소 예시

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "플러그인 한 줄 설명"
}
```

## 마켓플레이스에 등록

루트 `.claude-plugin/marketplace.json`의 `plugins` 배열에 항목을 추가하세요.

```json
{
  "name": "my-plugin",
  "description": "플러그인 설명",
  "version": "1.0.0",
  "source": "./plugins/my-plugin",
  "category": "development"
}
```

`source`는 마켓플레이스 루트 기준 상대 경로입니다.
