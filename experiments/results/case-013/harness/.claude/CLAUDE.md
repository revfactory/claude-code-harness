# 가상 머신 & 바이트코드 컴파일러

## 아키텍처 (2단계 파이프라인)
```
소스코드 → [Lexer] → 토큰 → [Parser] → AST → [Compiler] → Chunk
                                                              ↓
                                                          [VM.run()]
                                                              ↓
                                                           결과 출력
```

## 파일 구조
```
src/
  lexer.js              - 토크나이저 (Case-007 재사용 가능)
  parser.js             - AST 파서 (Case-007 재사용 가능)
  ast.js                - AST 노드 정의
  compiler.js           - AST → 바이트코드 컴파일러
  chunk.js              - 바이트코드 청크 (code + constants + lines)
  opcodes.js            - Opcode 상수 정의
  vm.js                 - 스택 기반 가상 머신
  value.js              - 값 타입 (Number, String, Bool, Null, Array, Closure)
  call-frame.js         - 호출 프레임
  disassembler.js       - 바이트코드 디버그 출력
  native-functions.js   - 내장 함수 (print, len, push, type)
  index.js              - CLI 진입점 + REPL
tests/
  compiler.test.js      - 컴파일 결과 검증
  vm.test.js            - VM 실행 검증
  integration.test.js   - 시나리오 통합 테스트
  disassembler.test.js  - 디셈블러 출력 검증
```

## 핵심 규칙
- 단일 패스 컴파일 (AST 한 번 순회)
- 스택 기반 VM (레지스터 아님)
- 로컬 변수는 스택 슬롯에 직접 매핑
- 클로저: upvalue로 캡처 (open → closed 전환)
- 호출 규약: caller가 인수 push → OP_CALL → callee가 Frame 생성
- 상수 풀: 숫자, 문자열, 함수 객체 공유
