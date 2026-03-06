---
name: build-feature-matrix
description: Converts per-service feature analysis into a consistent comparison matrix with 5-level ratings (●/○/△/✕/?), per-cell rationale, and statistics (must_have, differentiators, unknown). Use when Feature Analyzer completes steps 1–3 and needs step 4 (cross-service comparison), when building a feature benchmark matrix from services and features_by_service, or when the user asks for a feature comparison matrix.
---

# build-feature-matrix

Feature Analyzer 소속. 서비스별 기능 분석 결과를 일관된 기준의 비교 매트릭스로 변환한다.

## 입력

- **services**: 서비스 이름 목록
- **features_by_service**: 서비스별 카테고리별 기능 목록 (기능명, 설명, 구현 수준 등 1~3단계 분석 결과)

## 가드레일

1. **●/○/△/✕/? 5단계 기준**을 일관되게 적용한다.
2. **기능 단위로 순회**한다 (서비스 단위가 아님). 각 기능에 대해 모든 서비스를 횡으로 비교.
3. **각 셀마다 판단 근거**를 한 줄로 기록한다.
4. **"확인 안 됨"(?)**과 **"기능 없음"(✕)**을 구분한다.
5. 서비스 수가 **15개를 넘으면** 컨텍스트 제약을 고려해 7~8개씩 나누어 매트릭스를 두 번 생성한 뒤 병합한다.

## 평가 기준

| 기호 | 의미 | 조건 |
|------|------|------|
| ● | 명시·상세 | 해당 기능이 명시적으로 설명됨 + 상세 기능/사례 언급 |
| ○ | 언급만 | 해당 기능이 언급됨, 상세 설명 없이 목록에만 포함 |
| △ | 유사·다른 방식 | 유사 기능이 다른 방식으로 존재 (차이점 근거 필수) |
| ✕ | 없음 | 수집 데이터 전체에서 언급 없음 |
| ? | 판단 불가 | 관련 페이지 수집 실패로 판단 불가 |

## 실행 절차

### Step 1: 통합 기능 목록 생성

- 모든 서비스의 기능을 합쳐서 **중복 제거**.
- **카테고리별 그룹핑** 유지 (핵심 기능, 워크플로우/자동화, AI/지능형 기능 등).

### Step 2: 기능별 횡단 비교

- **각 기능에 대해** 모든 서비스를 횡으로 비교.
- 위 평가 기준(●/○/△/✕/?)을 적용해 셀 값 결정.

### Step 3: 근거 기록

- 각 셀에 대해 **판단 근거 한 줄** 기록 (예: "기능 페이지 상세 설명", "메인 페이지 목록에만", "수집 실패").

## 출력

### 1. 기능 비교 매트릭스

| 카테고리 | 기능 | 서비스A | 서비스B | ... |
|---------|------|---------|---------|-----|
| 핵심 | 기능1 | ● | ○ | ... |

### 2. 평가 근거

| 기능 | 서비스A | 서비스B | ... |
|------|---------|---------|-----|
| 기능1 | 기능 페이지 상세 설명 | 메인 페이지 목록에만 | ... |

### 3. 통계 요약

- **전체 기능 수**: N개
- **70% 이상 보유 (must_have)**: [기능 목록] — 업계 표준·필수 기능 도출에 사용
- **30% 미만 보유 (differentiators)**: [기능 목록] — 차별화 기능 도출에 사용
- **? 표기 (unknown)**: [서비스 × 기능 목록] — data_needs 구성에 사용

### 구조화 출력 (선택)

다운스트림 자동 활용이 필요하면 다음 형태로 요약한다.

```json
{
  "matrix": { "카테고리/기능별 셀 값 매핑" },
  "evidence": { "기능×서비스별 근거 한 줄" },
  "statistics": {
    "total_features": 35,
    "must_have": ["기능명 목록"],
    "differentiators": ["기능명 목록"],
    "unknown": ["서비스명: 기능명", "..."]
  }
}
```

## 사용 시점

- Feature Analyzer **분석 4단계**에서 1~3단계 결과를 받은 뒤 1회 호출.
- 서비스 추가 수집 후 **매트릭스 재생성**이 필요할 때 재호출.
- 리포트의 기능 비교 섹션에는 이 스킬이 생성한 매트릭스·근거·통계를 그대로 포함한다.
