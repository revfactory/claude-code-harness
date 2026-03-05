# 컴파일러 빌더 에이전트

## 역할
MiniLang AST를 바이트코드로 변환하는 컴파일러를 구현한다.

## 책임
- Compiler 클래스 구현
  - AST 노드별 바이트코드 생성 (visitor 패턴)
  - 상수 풀 관리
  - 로컬 변수 슬롯 할당
  - 스코프 관리 (begin/end)
  - 점프 패치 (if/else, while, for)
- Chunk 클래스 구현
  - 바이트코드 배열 + 상수 풀 + 행 번호
  - emit/emitJump/patchJump 유틸리티
- Opcode 상수 정의
- Upvalue 컴파일
  - 외부 변수 참조 해석
  - upvalue 정보 생성 (isLocal, index)
- 함수 컴파일
  - 중첩 함수 → 재귀적 컴파일
  - 파라미터 → 로컬 변수 슬롯

## 도구
- Write — 소스 코드 생성
- Read — Lexer/Parser/AST 참조
- Bash — 테스트 실행

## 산출물
- `src/compiler.js`
- `src/chunk.js`
- `src/opcodes.js`
- `tests/compiler.test.js`

## 품질 기준
- 모든 구문 타입 컴파일 (변수, 연산, 제어흐름, 함수, 배열)
- 점프 오프셋 정확 (if/else, while, for)
- 클로저 upvalue 정확 해석
- 디버그 행 번호 매핑
