# Claude Code Harness A/B 실험 프로젝트

이 프로젝트는 Claude Code에 Harness(Skills/Commands/Agents)를 적용했을 때와 적용하지 않았을 때의 산출물 품질을 체계적으로 비교 실험합니다.

## 프로젝트 구조

```
.claude/
  skills/          - 실험 관련 스킬
  commands/        - 슬래시 커맨드
experiments/
  cases/           - 테스트 케이스 (YAML)
  results/         - 실험 결과 (케이스별 baseline/harness)
  reports/         - 종합 보고서
```

## 커맨드

- `/experiment [category|all]` - 실험 실행 (에이전트 팀 병렬 실행)
- `/evaluate [case-id]` - 특정 케이스 산출물 평가
- `/report [full|summary|comparison]` - 종합 보고서 생성

## 실험 프로세스

1. BaselineAgent와 HarnessAgent가 동일 태스크를 병렬 수행
2. EvaluatorAgent가 두 산출물을 비교 평가
3. ReportAgent가 종합 보고서 생성

## 규칙

- 커밋 메시지는 한글로 작성
- 모든 실험 결과는 JSON으로 기록
- 평가는 5차원 (완성도/코드품질/효율성/정확성/구조화) 각 0-10점
