# 리액티브 스프레드시트 엔진

## 아키텍처
```
사용자 입력 → [Cell.setValue] → [FormulaParser] → AST
                                                    ↓
                                            [DependencyGraph]
                                              ↓ (위상정렬)
                                        [FormulaEvaluator]
                                              ↓
                                      [증분 재계산 전파]
```

## 파일 구조
```
src/
  cell.js               - 셀 모델 (값, 수식, 표시값)
  sheet.js              - 시트 (셀 관리 + 재계산 트리거)
  formula-parser.js     - 수식 파서 (Pratt Parser / 재귀 하강)
  formula-ast.js        - 수식 AST 노드 정의
  dependency-graph.js   - DAG + 위상 정렬 + 순환 감지
  evaluator.js          - 수식 평가기
  functions.js          - 내장 함수 (SUM, AVERAGE, IF, VLOOKUP 등)
  cell-ref.js           - 셀 참조 파서 (A1, A1:B5)
  formatter.js          - 값 포맷터 (숫자, 날짜, 통화)
  index.js              - CLI + 대화형 스프레드시트
tests/
  parser.test.js        - 수식 파싱 테스트
  dependency.test.js    - 의존성 그래프 테스트
  evaluator.test.js     - 수식 평가 테스트
  functions.test.js     - 내장 함수 테스트
  integration.test.js   - 시나리오 통합 테스트
```

## 핵심 규칙
- 수식은 '=' 로 시작 (없으면 리터럴)
- 셀 참조: 컬럼(A-Z) + 행(1-99)
- 순환 참조 → #CIRCULAR! 에러
- 타입 불일치 → #VALUE! 에러
- 범위 참조 오류 → #REF! 에러
- 0 나누기 → #DIV/0! 에러
- 증분 재계산: 변경된 셀의 의존 셀만 위상 정렬 순서로 재평가
