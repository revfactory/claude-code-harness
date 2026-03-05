# MiniLang 인터프리터 프로젝트

MiniLang 프로그래밍 언어의 완전한 인터프리터를 구현합니다.

## 아키텍처 (4단계 파이프라인)
```
소스코드 → [Lexer] → 토큰 스트림 → [Parser] → AST → [Evaluator] → 결과
                                                         ↑
                                                   [Environment]
```

## 파일 구조 (필수)
```
src/
  lexer.js          - Tokenizer (소스→토큰)
  token.js          - 토큰 타입 정의
  parser.js         - 재귀 하강 파서 (토큰→AST)
  ast.js            - AST 노드 타입 정의
  interpreter.js    - Tree-walking 평가기
  environment.js    - 스코프 체인 + 클로저
  builtins.js       - 내장 함수 (print, len, push, type, str, int)
  errors.js         - 에러 클래스 (행/열 번호 포함)
  repl.js           - 대화형 실행 환경
  index.js          - CLI 진입점 (파일 실행 / REPL)
tests/
  lexer.test.js
  parser.test.js
  interpreter.test.js
  integration.test.js  - 검증 프로그램 실행
examples/
  fibonacci.mini
  map-filter.mini
  closure.mini
```

## 핵심 규칙
- 각 파이프라인 단계는 독립적으로 테스트 가능해야 함
- Parser는 재귀 하강 방식, Pratt Parser로 연산자 우선순위 처리
- Environment는 부모 참조를 통한 스코프 체인 (클로저 지원)
- 에러 메시지에 반드시 행/열 번호 포함
- 삭제는 tombstone이 아닌 실제 삭제 (CRDT가 아님)
