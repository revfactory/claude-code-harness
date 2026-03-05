# Evaluate - 산출물 평가

특정 실험 케이스의 산출물을 비교 평가합니다.

## Arguments
$ARGUMENTS - 케이스 ID (예: case-001) 또는 결과 디렉토리 경로

## Instructions

1. `experiments/results/$ARGUMENTS/` 에서 baseline과 harness 산출물을 읽으세요.
2. output-evaluator 스킬의 평가 기준에 따라 각 산출물을 평가하세요.
3. evaluation.json 을 생성하여 결과를 저장하세요.
4. 평가 결과를 사용자에게 테이블 형식으로 보여주세요.

### 출력 예시

```
| 차원      | Baseline | Harness | 차이 |
|-----------|----------|---------|------|
| 완성도    | 7        | 9       | +2   |
| 코드 품질 | 6        | 8       | +2   |
| 효율성    | 8        | 7       | -1   |
| 정확성    | 7        | 9       | +2   |
| 구조화    | 5        | 8       | +3   |
| **총점**  | **33**   | **41**  | **+8** |
```
