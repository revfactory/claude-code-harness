# Language Server Protocol 구현 (MiniLang)

## 아키텍처
```
[Editor/Client] ←→ [JSON-RPC Transport] ←→ [LSP Server]
                                                ↓
                                    ┌───────────┼───────────┐
                                    ↓           ↓           ↓
                            [IncrementalParser] [SymbolTable] [Providers]
                                    ↓                       ↓
                                  [AST]          ┌──────────┼──────────┐
                                                 ↓          ↓          ↓
                                          [Diagnostic] [Completion] [Definition]
                                                                    [Hover]
```

## 파일 구조
```
src/
  server/
    lsp-server.js           - LSP 서버 메인 (요청 라우팅)
    json-rpc.js             - JSON-RPC 전송 (Content-Length 프로토콜)
    capabilities.js         - 서버 기능 선언
  parser/
    lexer.js                - MiniLang 토크나이저
    parser.js               - 재귀 하강 파서 (에러 복구)
    ast.js                  - AST 노드 정의
    incremental.js          - 증분 파싱 (변경 영역만 재파싱)
  analysis/
    symbol-table.js         - 심볼 테이블 (정의/해석/스코프)
    scope.js                - 스코프 체인 관리
    type-info.js            - 기본 타입 정보
  providers/
    diagnostic.js           - 진단 (에러/경고 감지)
    completion.js           - 자동완성
    definition.js           - Go-to-Definition
    hover.js                - 호버 정보
    references.js           - Find References (보너스)
  document/
    text-document.js        - 문서 모델 (버전 관리, 증분 변경)
    document-manager.js     - 열린 문서 관리
  index.js                  - 서버 진입점
tests/
  json-rpc.test.js          - JSON-RPC 프로토콜 테스트
  parser.test.js            - 파서 테스트 (정상 + 에러 복구)
  symbol-table.test.js      - 심볼 테이블 테스트
  diagnostic.test.js        - 진단 테스트
  completion.test.js        - 자동완성 테스트
  definition.test.js        - 정의 이동 테스트
  hover.test.js             - 호버 테스트
  integration.test.js       - LSP 프로토콜 통합 테스트
```

## 핵심 규칙
- LSP 스펙 3.17 준수 (메시지 형식, 메서드 이름)
- 에러 복구 파싱: 문법 에러가 있어도 AST 생성 (부분 파싱)
- 위치 정보: 0-based line/character (LSP 규격)
- 문서 동기화: incremental sync (전체가 아닌 변경분만)
- 심볼 스코프: 블록 레벨 (let), 함수 레벨 (fn)
- 내장 함수(print, len, push, type)는 글로벌 심볼로 사전 등록
