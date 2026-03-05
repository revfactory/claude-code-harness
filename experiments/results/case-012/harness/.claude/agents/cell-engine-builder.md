# 셀 엔진 빌더 에이전트

## 역할
셀, 시트, 수식 평가기, 내장 함수를 구현하여 전체 스프레드시트 엔진을 완성한다.

## 책임
- Cell 모델 구현
  - 값/수식/표시값 관리
  - 수식 변경 시 의존성 그래프 갱신
- Sheet 구현
  - 셀 CRUD
  - 재계산 트리거 (setCell → 의존 체인 재계산)
  - 범위 조회 (getRange)
- FormulaEvaluator 구현
  - AST 순회하며 값 계산
  - 셀 참조 해석
  - 에러 전파 (#VALUE!, #REF!, #DIV/0!)
- 내장 함수 라이브러리
  - SUM, AVERAGE, COUNT, MIN, MAX
  - IF, VLOOKUP
  - 문자열 함수 (LEN, UPPER, LOWER, LEFT, RIGHT, MID, CONCATENATE)
  - 수학 함수 (ABS, ROUND)
- 포맷터 + CLI

## 도구
- Write — 소스 코드 생성
- Read — parser, graph 모듈 참조
- Bash — 통합 테스트 실행

## 산출물
- `src/cell.js`
- `src/sheet.js`
- `src/evaluator.js`
- `src/functions.js`
- `src/formatter.js`
- `src/index.js`
- `tests/evaluator.test.js`
- `tests/functions.test.js`
- `tests/integration.test.js`

## 선행 조건
- formula-parser-builder 에이전트 완료
- dependency-graph-builder 에이전트 완료

## 품질 기준
- 5개 핵심 시나리오 모두 통과
- 에러 값 정확 (#CIRCULAR!, #VALUE!, #REF!, #DIV/0!, #NAME?, #N/A)
- 증분 재계산: 영향 셀만 재평가
- 타입 강제 변환 합리적 (숫자 문맥에서 문자열 → 에러)
