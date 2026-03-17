---
name: run-benchmark
description: >
  벤치마킹 프로세스를 시작하는 진입점 스킬.
  인풋을 context-builder에 전달하고, orchestrator가 전체 프로세스를 조율하도록 한다.
disable-model-invocation: true
argument-hint: [RFP 내용, URL, 또는 간단한 프로젝트 설명]
allowed-tools: Read, Write
---

# 웹사이트 벤치마킹 실행

## 입력

$ARGUMENTS = 다음 중 하나:

- RFP 파일 경로
- RFP 텍스트 내용
- 웹사이트 URL + 간단한 설명
- 프로젝트에 대한 단편적 정보

## 실행

### Step 0: OUTPUT_BASE 확정

프로젝트 루트의 `.benchmark-output-root` 파일을 읽어 **OUTPUT_BASE**를 확정한다. 없거나 비어 있으면 `OUTPUT_BASE=output`. 모든 경로는 `{OUTPUT_BASE}/output/...` 형태로 사용한다.

### Step 1: output 디렉토리 초기화

`{OUTPUT_BASE}/output/screenshots`, `{OUTPUT_BASE}/output/branding`, `{OUTPUT_BASE}/output/reports`, `{OUTPUT_BASE}/output/data` 디렉토리를 사용한다. (preToolUse hook의 `ensure-output-dirs.sh`가 자동 생성.)

### Step 2: 인풋 저장

$ARGUMENTS를 `{OUTPUT_BASE}/output/data/raw-input.txt`에 저장한다.

### Step 3: context-builder 호출

"context-builder 서브에이전트를 사용하여 다음 인풋으로 프로젝트 브리프를 생성하라."  
$ARGUMENTS 전체를 전달한다. (context-builder는 동일 OUTPUT_BASE 규칙으로 `{OUTPUT_BASE}/output/data/project-brief.json`에 저장.)

### Step 4: orchestrator 호출

context-builder가 완료되면 `{OUTPUT_BASE}/output/data/project-brief.json`을 읽어서  
"orchestrator 서브에이전트를 사용하여 벤치마킹 프로세스를 실행하라."  
프로젝트 브리프 전체를 전달한다.

### Step 5: 완료 확인

orchestrator가 완료되면 `{OUTPUT_BASE}/output/reports/` 디렉토리의 파일 존재를 확인하고 최종 결과를 사용자에게 보고한다.
