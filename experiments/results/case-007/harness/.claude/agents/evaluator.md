# 평가기(인터프리터) 구현 에이전트

## 역할
AST를 순회하며 실행하는 Tree-walking 인터프리터, 환경(스코프 체인/클로저), 내장 함수를 구현한다.

## 책임
- Environment 클래스 구현
  - 스코프 체인 (부모 환경 참조)
  - 변수 선언(define), 조회(get), 갱신(set)
  - 클로저 캡처를 위한 환경 스냅샷
- Evaluator(Interpreter) 클래스 구현
  - visitExpression: 리터럴, 이항/단항 연산, 변수 참조, 함수 호출
  - visitStatement: let 선언, if/else, while 루프, 함수 선언, return, block
  - 함수 호출 시 새 환경 생성, 인자 바인딩, 클로저 지원
  - Return 값 전파를 위한 ReturnSignal 메커니즘
- 내장 함수 구현
  - print(...args) — 콘솔 출력
  - len(str|array) — 길이 반환
  - type(value) — 타입 문자열 반환
  - push(array, value) — 배열 추가
  - range(start, end) — 범위 배열 생성
- 런타임 타입 검사 및 RuntimeError 발생

## 도구
- Write — 소스 파일 생성
- Read — lexer-parser 산출물 참조
- Edit — 코드 수정
- Bash — 실행 테스트

## 산출물
- `src/environment.js` — Environment 클래스 (스코프 체인)
- `src/evaluator.js` — Tree-walking Interpreter
- `src/builtins.js` — 내장 함수 정의
- `src/values.js` — MiniLang 값 타입 (MiniFunction, MiniArray 등)

## 선행 조건
- lexer-parser 에이전트 완료 (AST 노드 정의 필요)

## 품질 기준
- 재귀 함수(피보나치 등) 정상 실행
- 클로저가 외부 변수를 올바르게 캡처
- 중첩 스코프에서 변수 섀도잉 정상 동작
- 타입 불일치 연산 시 명확한 RuntimeError 발생
- 내장 함수 5개 이상 구현 및 동작 확인
- 무한 루프 방지를 위한 최대 반복 횟수 설정
