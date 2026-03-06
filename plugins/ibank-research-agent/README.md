# ibank-research-agent

벤치마킹 리서치를 총괄하는 에이전트 플러그인입니다. 프로젝트 브리프를 분석한 뒤 Domain Scout → Service Scout → UXUI Scout → Web Scout → Feature Analyzer → UXUI Analyzer → Report Writer 순으로 서브 에이전트를 호출합니다.

## 사용법

Cursor 프롬프트에 브리프와 함께 **`/orchestrator`** 를 입력해 실행합니다.  
자세한 예시는 [사용가이드.md](./사용가이드.md)를 참고하세요.

## 구조

- **`.cursor/agents/`** — 오케스트레이터, 스카우트·분석·리포트 에이전트
- **`.cursor/skills/`** — 검색·크롤·스크린샷·DOM 캡처 등 스킬
- **`guides/`** — 에이전트·스킬 작성 가이드

## 포함 에이전트

| 에이전트 | 역할 |
|---------|------|
| orchestrator | 리서치 총괄, 서브 에이전트 호출 |
| domain-scout | 카테고리·벤치마크 후보 선정 |
| service-scout | 서비스 페이지 수집 |
| uxui-scout | UX/UI 스크린샷·네비게이션 수집 |
| web-scout | 웹 기사·이미지 수집 |
| feature-analyzer | 기능 매트릭스 분석 |
| uxui-analyzer | 시각·디자인 분석 |
| report-writer | 최종 벤치마크 리포트 작성 |
