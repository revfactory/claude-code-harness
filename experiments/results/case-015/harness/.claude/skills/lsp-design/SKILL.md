---
name: lsp-design
description: "Language Server Protocol 서버 구현 가이드. LSP 서버, 증분 파싱, 자동완성, 진단, Go-to-Definition, 호버를 구현할 때 사용한다."
---

# LSP Design Skill

## LSP 메시지 흐름
```
Client                          Server
  │                               │
  │── initialize ───────────────→ │
  │←── initialize result ────────│
  │── initialized ──────────────→ │
  │                               │
  │── textDocument/didOpen ─────→ │ → parse → diagnostics
  │←── publishDiagnostics ───────│
  │                               │
  │── textDocument/didChange ───→ │ → incremental parse → diagnostics
  │←── publishDiagnostics ───────│
  │                               │
  │── textDocument/completion ──→ │
  │←── completion items ─────────│
  │                               │
  │── textDocument/definition ──→ │
  │←── location ─────────────────│
  │                               │
  │── textDocument/hover ───────→ │
  │←── hover content ────────────│
  │                               │
  │── shutdown ─────────────────→ │
  │←── null ─────────────────────│
  │── exit ─────────────────────→ │
```

## 에러 복구 파싱
```
파서가 예상치 못한 토큰을 만났을 때:
1. 에러 진단 추가 (위치 + 메시지)
2. 동기화 토큰까지 스킵 (;, }, EOF)
3. 파싱 계속 → 추가 에러 감지
4. 결과: 부분 AST + 에러 목록
```

## 심볼 테이블 구조
```
GlobalScope
  ├── print (builtin function)
  ├── len (builtin function)
  ├── x (variable, line 1)
  ├── add (function, line 3)
  │   └── FunctionScope
  │       ├── a (parameter)
  │       └── b (parameter)
  └── main logic
      └── BlockScope (if/while/for)
          └── i (variable)
```

## 자동완성 전략
1. 커서 위치의 스코프 결정
2. 스코프 체인 순회하며 가용 심볼 수집
3. 접두사 필터링
4. 종류별 정렬: keywords < variables < functions

## 구현 순서
1. JSON-RPC Transport (프로토콜 레이어)
2. Lexer + Parser (에러 복구 포함)
3. TextDocument + DocumentManager
4. SymbolTable + Scope
5. DiagnosticProvider (파서 에러 + 시맨틱 에러)
6. CompletionProvider
7. DefinitionProvider
8. HoverProvider
9. LSP Server (요청 라우팅)
10. 통합 테스트
