# 고난이도 A/B 실험 실행

고난이도 케이스 011-015에 대한 Harness A/B 실험을 실행합니다.

## 실행 절차

### 1. 케이스 확인
`experiments/cases/` 에서 case-011 ~ case-015 YAML 파일을 읽고 각 케이스의 요구사항을 확인합니다.

### 2. Baseline 실행 (순수 Claude Code)
각 케이스에 대해 `.claude/` 사전 구성 없이 프롬프트만으로 실행합니다.
- 작업 디렉토리: `experiments/results/case-{id}/baseline/`
- 입력: YAML의 description 필드 그대로 사용

### 3. Harness 실행 (.claude/ 사전 구성)
각 케이스에 대해 사전 구성된 `.claude/` 폴더와 함께 실행합니다.
- 작업 디렉토리: `experiments/results/case-{id}/harness/`
- 입력: YAML의 description + .claude/CLAUDE.md + skills + agents

### 4. 평가
`/evaluate` 스킬을 사용하여 각 산출물을 10차원 × 10점 = 100점 만점으로 평가합니다.

### 5. 보고서
`/report` 스킬을 사용하여 결과 보고서를 생성합니다.

## 대상 케이스
- case-011: 분산 키-밸류 스토어 (Raft Consensus)
- case-012: 리액티브 스프레드시트 엔진
- case-013: 가상 머신 & 바이트코드 컴파일러
- case-014: 이벤트 소싱 CQRS 프레임워크
- case-015: Language Server Protocol 구현

$ARGUMENTS
