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

### Step 1: output 디렉토리 초기화

`output/screenshots`, `output/branding`, `output/reports`, `output/data` 디렉토리를 생성한다.

### Step 2: 인풋 저장

$ARGUMENTS를 `output/data/raw-input.txt`에 저장한다.

### Step 3: context-builder 호출

"context-builder 서브에이전트를 사용하여 다음 인풋으로 프로젝트 브리프를 생성하라."  
$ARGUMENTS 전체를 전달한다.

### Step 4: orchestrator 호출

context-builder가 완료되면 `output/data/project-brief.json`을 읽어서  
"orchestrator 서브에이전트를 사용하여 벤치마킹 프로세스를 실행하라."  
프로젝트 브리프 전체를 전달한다.

### Step 5: 완료 확인

orchestrator가 완료되면 `output/reports/` 디렉토리의 파일 존재를 확인하고 최종 결과를 사용자에게 보고한다.
