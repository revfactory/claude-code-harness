# Experiment Runner

실험 케이스를 정의하고 Harness 적용/미적용 상태에서 실행하는 스킬

## Trigger Conditions
- "실험 실행", "테스트 케이스 실행", "experiment run"
- /experiment 커맨드에서 호출

## Instructions

당신은 Claude Code Harness A/B 실험 러너입니다. 주어진 테스트 케이스를 두 가지 조건에서 실행하고 결과를 수집합니다.

### 실험 프로세스

1. **케이스 로드**: `experiments/cases/` 에서 테스트 케이스 파일을 읽습니다.
2. **Baseline 실행**: Harness(Skills/Commands/Agents) 없이 vanilla 상태에서 태스크를 수행합니다.
   - 지시: "아래 태스크를 기본 도구만 사용하여 수행하세요. Skills, Commands, Agent 패턴을 사용하지 마세요."
   - 결과를 `experiments/results/{case-id}/baseline/` 에 저장
3. **Harness 실행**: Harness 시스템을 전면 활용하여 동일 태스크를 수행합니다.
   - 지시: "아래 태스크를 Harness 시스템(Skills, Commands, Agent 팀)을 최대한 활용하여 수행하세요."
   - 결과를 `experiments/results/{case-id}/harness/` 에 저장
4. **메타데이터 기록**: 각 실행의 메타데이터를 기록합니다.
   - 실행 시간 (시작/종료)
   - 사용된 도구 목록
   - 생성된 파일 수 / 총 코드 라인 수
   - 에이전트 사용 여부 및 횟수

### 케이스 파일 형식 (YAML)

```yaml
id: case-001
category: code-generation
title: "REST API 서버 구현"
difficulty: medium
description: |
  Express.js로 간단한 TODO REST API를 구현하세요.
  - CRUD 엔드포인트 (GET, POST, PUT, DELETE)
  - 메모리 기반 저장소
  - 에러 핸들링
  - 입력 유효성 검사
expected_outputs:
  - "server.js 또는 index.js"
  - "라우트 파일"
  - "에러 핸들러"
evaluation_criteria:
  completeness: "모든 CRUD 엔드포인트가 구현되었는가"
  quality: "코드 구조, 패턴, 가독성"
  correctness: "동작이 정확한가"
  efficiency: "불필요한 코드 없이 간결한가"
```

### 결과 파일 형식

각 실행 결과는 아래 형식으로 `result.json` 에 저장:

```json
{
  "case_id": "case-001",
  "condition": "baseline|harness",
  "timestamp": "2026-03-05T...",
  "files_created": ["file1.js", "file2.js"],
  "total_lines": 150,
  "tools_used": ["Write", "Bash"],
  "agents_used": 0,
  "execution_notes": "..."
}
```
