# iBank Team Marketplace

팀 내부에서 사용하는 플러그인·스킬·도구를 한 곳에서 관리하는 마켓플레이스입니다.

## 구조

```
ibank-marketplace/
├── .cursor-plugin/
│   └── marketplace.json    # 마켓플레이스 설정 (이름, 플러그인 목록)
├── plugins/
│   └── research-agent/         # 웹사이트 벤치마킹 리서치 (/run-benchmark)
├── scripts/
│   └── validate-template.mjs  # 마켓플레이스·플러그인 검증 스크립트
├── PLUGIN_SCHEMA.md       # 플러그인 작성 가이드
└── README.md
```

## 검증하기

변경 후 아래 명령으로 매니페스트·경로·프론트매터를 검증할 수 있습니다.

```bash
node scripts/validate-template.mjs
```

## 검수·제출 체크리스트

[Cursor Plugins](https://cursor.com/docs/plugins) 및 [팀 마켓플레이스 템플릿](https://github.com/fieldsphere/cursor-team-marketplace-template) 기준:

- [ ] 각 플러그인에 유효한 `.cursor-plugin/plugin.json` 존재
- [ ] 플러그인 `name`은 고유, 소문자, kebab-case
- [ ] `.cursor-plugin/marketplace.json` 항목이 실제 플러그인 폴더와 일치
- [ ] rules/skills/agents/commands 파일에 필수 프론트매터(`description`, `name` 등) 있음
- [ ] 매니페스트의 logo·rules·skills 등 경로가 실제 파일/폴더와 일치
- [ ] `node scripts/validate-template.mjs` 통과

## 팀에서 사용하기

Claude Code / Cursor 등에서 이 마켓플레이스를 등록하려면 설정에 소스를 추가하세요.

예: Cursor 설정 또는 `.claude/settings.json`

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
2. 해당 폴더에 `.cursor-plugin/plugin.json` 작성
3. 루트 `.cursor-plugin/marketplace.json`의 `plugins` 배열에 새 플러그인 항목 추가

자세한 스키마는 [PLUGIN_SCHEMA.md](./PLUGIN_SCHEMA.md)를 참고하세요.
