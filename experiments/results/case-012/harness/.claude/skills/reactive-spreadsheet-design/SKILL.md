---
name: reactive-spreadsheet-design
description: "리액티브 스프레드시트 엔진 설계 가이드. 셀 수식 파싱, 의존성 그래프(DAG), 증분 재계산, 내장 함수 구현 시 사용한다."
---

# Reactive Spreadsheet Design Skill

## 3단계 파이프라인
```
입력 "=SUM(A1:A5)+B1" → [Parser] → AST → [DependencyExtractor] → 의존셀 목록
                                            ↓
                                    [DependencyGraph 갱신]
                                            ↓
                                    [위상 정렬 재계산 순서]
                                            ↓
                                    [Evaluator] → 결과값
```

## 의존성 그래프 (DAG)
- 셀 A가 셀 B를 참조 → A는 B에 의존 → edge: B → A
- 셀 값 변경 시: 변경 셀의 모든 dependents를 위상 정렬
- 순환 감지: DFS에서 back edge 발견 시 순환

## 증분 재계산 알고리즘
```
1. 변경된 셀 집합 S = {changed cell}
2. dirty 집합 D = S의 모든 직·간접 dependents (BFS/DFS)
3. D를 위상 정렬
4. 정렬 순서대로 각 셀 재평가
```

## Pratt Parser 기반 수식 파싱
- 연산자 우선순위: ^ > * / > + - > & > = <> < > <= >=
- 함수 호출: NAME ( arglist )
- 셀 참조: [A-Z]+[0-9]+
- 범위: cellRef : cellRef

## 에러 값 체계
| 에러 | 원인 |
|------|------|
| #CIRCULAR! | 순환 참조 |
| #VALUE! | 타입 불일치 |
| #REF! | 잘못된 셀 참조 |
| #DIV/0! | 0 나누기 |
| #NAME? | 알 수 없는 함수 |
| #N/A | VLOOKUP 불일치 |
