# Experiment - Harness A/B 실험 실행

Claude Code Harness 적용/미적용 비교 실험을 에이전트 팀으로 실행합니다.

## Arguments
$ARGUMENTS - 실험 카테고리 (all | code-generation | bug-fix | refactoring | documentation | complex | research) 또는 특정 케이스 ID

## Instructions

### 1. 테스트 케이스 로드

`experiments/cases/` 디렉토리에서 테스트 케이스 YAML 파일을 읽으세요.
- $ARGUMENTS가 "all"이면 모든 케이스를 로드
- 카테고리명이면 해당 카테고리 케이스만 로드
- 케이스 ID면 해당 케이스만 로드

### 2. 에이전트 팀 구성 및 실행

**각 테스트 케이스마다** 아래 에이전트를 병렬로 실행하세요:

#### BaselineAgent (general-purpose, worktree 격리)
```
당신은 BaselineAgent입니다. 아래 태스크를 순수 기본 도구만으로 수행하세요.
- Skills, Commands, Agent 팀 패턴을 사용하지 마세요
- 별도의 구조화 가이드 없이 자연스럽게 작업하세요
- 결과물을 experiments/results/{case-id}/baseline/ 에 저장하세요

태스크: {케이스 description}

완료 후 아래 메타데이터를 result.json으로 저장:
- files_created: 생성한 파일 목록
- total_lines: 총 코드 라인 수
- approach: 접근 방식 설명 (2-3문장)
```

#### HarnessAgent (general-purpose, worktree 격리)
```
당신은 HarnessAgent입니다. 아래 태스크를 Harness 시스템을 최대한 활용하여 수행하세요.
- 작업을 하위 에이전트로 분할하여 병렬 처리하세요
- 체계적인 프로젝트 구조를 설계한 뒤 구현하세요
- 모듈화, 패턴 적용, 에러 핸들링을 적극 적용하세요
- 결과물을 experiments/results/{case-id}/harness/ 에 저장하세요

태스크: {케이스 description}

완료 후 아래 메타데이터를 result.json으로 저장:
- files_created: 생성한 파일 목록
- total_lines: 총 코드 라인 수
- agents_used: 사용한 하위 에이전트 수
- approach: 접근 방식 설명 (2-3문장)
```

### 3. 평가 에이전트 실행

두 에이전트가 모두 완료되면, **EvaluatorAgent**를 실행하세요:

#### EvaluatorAgent (general-purpose)
```
당신은 EvaluatorAgent입니다. 아래 두 산출물을 비교 평가하세요.

Baseline 산출물: experiments/results/{case-id}/baseline/
Harness 산출물: experiments/results/{case-id}/harness/

평가 기준 (각 0-10):
1. 완성도: 요구사항 충족률, 누락 기능, 엣지 케이스
2. 코드 품질: 가독성, 패턴, 모듈화, DRY
3. 효율성: 간결성, 파일 수 적정성
4. 정확성: 문법 오류, 로직 정확성
5. 구조화: 프로젝트 구조, 관심사 분리, 확장성

evaluation.json 형식으로 experiments/results/{case-id}/ 에 저장하세요.
반드시 baseline과 harness 각각의 점수, 총점, 차이, 승자, 요약을 포함하세요.
```

### 4. 모든 케이스 완료 후

모든 케이스의 평가가 완료되면, **ReportAgent**를 실행하세요:

#### ReportAgent (general-purpose)
```
당신은 ReportAgent입니다. experiments/results/ 의 모든 evaluation.json을 종합하여
최종 보고서를 experiments/reports/report-{date}.md 로 생성하세요.

보고서에 포함할 내용:
- 종합 승률 및 평균 점수 비교 테이블
- 카테고리별 분석
- 차원별 심층 분석 (어떤 차원에서 Harness 효과가 큰가)
- 트레이드오프 분석
- 결론 및 권장사항
```

### 5. 사용자에게 결과 요약 보고

최종 보고서의 핵심 발견사항을 사용자에게 간략히 전달하세요.
