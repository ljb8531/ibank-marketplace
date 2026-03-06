# iBank Team Marketplace

팀 내부에서 사용하는 플러그인·스킬·도구를 한 곳에서 관리하는 마켓플레이스입니다.

## 구조

```
ibank-marketplace/
├── .claude-plugin/
│   └── marketplace.json    # 마켓플레이스 설정 (이름, 플러그인 목록)
├── plugins/
│   └── ibank-research-agent/   # 벤치마킹 리서치 에이전트
│       ├── .claude-plugin/
│       │   └── plugin.json
│       ├── .cursor/agents/, .cursor/skills/
│       ├── guides/, 사용가이드.md
│       └── README.md
├── PLUGIN_SCHEMA.md       # 플러그인 작성 가이드
└── README.md
```

## 팀에서 사용하기

Claude Code / Cursor 등에서 이 마켓플레이스를 등록하려면 설정에 소스를 추가하세요.

예: `.claude/settings.json`

```json
{
  "extraKnownMarketplaces": {
    "ibank-marketplace": {
      "source": { "source": "github", "repo": "ljb8531/ibank-marketplace" }
    }
  }
}
```

로컬 경로로 사용할 경우:

```json
{
  "extraKnownMarketplaces": {
    "ibank-marketplace": {
      "source": { "source": "path", "path": "/absolute/path/to/ibank-marketplace" }
    }
  }
}
```

## 플러그인 추가하기

1. `plugins/` 아래에 새 폴더 생성 (예: `plugins/my-tool/`)
2. 해당 폴더에 `.claude-plugin/plugin.json` 작성
3. 루트 `.claude-plugin/marketplace.json`의 `plugins` 배열에 새 플러그인 항목 추가

자세한 스키마는 [PLUGIN_SCHEMA.md](./PLUGIN_SCHEMA.md)를 참고하세요.
