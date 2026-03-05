---
name: interpreter-design
description: "Programming language interpreter design and implementation guide. Use when the user requests building an interpreter, parser, lexer, or language implementation — including Pratt parsing, AST evaluation, scope chains, and closures."
---

# Interpreter Design Skill

프로그래밍 언어 인터프리터 설계 및 구현 가이드

## 4단계 파이프라인 워크플로우

```
소스코드 → [Lexer] → 토큰 스트림 → [Parser] → AST → [Evaluator] → 결과
                                                         ↑
                                                   [Environment]
```

1. **Lexer**: 소스 코드를 토큰 스트림으로 변환
2. **Parser**: 재귀 하강 + Pratt Parser로 AST 생성
3. **Evaluator**: Tree-walking으로 AST 평가
4. **Environment**: 스코프 체인 + 클로저 지원

## 파일 구조 (필수)

```
src/
  lexer.js          - Tokenizer
  token.js          - 토큰 타입 정의
  parser.js         - 재귀 하강 파서
  ast.js            - AST 노드 타입 정의
  interpreter.js    - Tree-walking 평가기
  environment.js    - 스코프 체인 + 클로저
  builtins.js       - 내장 함수 (print, len, push, type, str, int)
  errors.js         - 에러 클래스 (행/열 번호 포함)
  repl.js           - 대화형 실행 환경
  index.js          - CLI 진입점
tests/
  lexer.test.js
  parser.test.js
  interpreter.test.js
  integration.test.js
```

## 핵심 원칙

- 각 파이프라인 단계는 독립적으로 테스트 가능해야 함
- Parser는 Pratt Parser로 연산자 우선순위 처리
- Environment는 부모 참조를 통한 스코프 체인 (클로저 지원)
- 에러 메시지에 반드시 행/열 번호 포함
- 클로저: 함수 정의 시 현재 환경을 캡처

## 테스트 전략

- **Lexer**: 각 토큰 타입별 tokenize 테스트
- **Parser**: 표현식 우선순위, 제어문, 함수 선언 파싱 테스트
- **Interpreter**: 산술, 비교, 변수, 제어흐름, 함수, 클로저 각각
- **Integration**: 피보나치, map/filter, makeCounter 검증 프로그램
