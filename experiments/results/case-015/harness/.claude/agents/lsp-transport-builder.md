# LSP 전송 레이어 빌더 에이전트

## 역할
JSON-RPC 전송 레이어와 LSP 서버 메인 라우터를 구현한다.

## 책임
- JsonRpcTransport 구현
  - stdin/stdout 기반 메시지 수신/발신
  - Content-Length 헤더 파싱/생성
  - 메시지 버퍼링 (불완전 메시지 처리)
  - JSON 파싱/직렬화
- LSP Server 구현
  - 요청/알림 라우팅 (method → handler)
  - initialize / initialized 핸들링
  - textDocument/didOpen → 파싱 + 진단 발행
  - textDocument/didChange → 증분 파싱 + 진단 갱신
  - textDocument/completion → 완성 항목 반환
  - textDocument/definition → 정의 위치 반환
  - textDocument/hover → 호버 정보 반환
  - shutdown / exit
- DocumentManager 구현
  - 열린 문서 추적 (uri → TextDocument)
  - 버전 관리
  - 증분 변경 적용
- TextDocument 구현
  - 텍스트 + 버전
  - 위치 ↔ 오프셋 변환
  - 증분 변경 적용 (range + newText)
- 서버 기능(capabilities) 선언

## 도구
- Write — 소스 코드 생성
- Read — providers, parser 참조
- Bash — 테스트 실행

## 산출물
- `src/server/json-rpc.js`
- `src/server/lsp-server.js`
- `src/server/capabilities.js`
- `src/document/text-document.js`
- `src/document/document-manager.js`
- `src/index.js`
- `tests/json-rpc.test.js`
- `tests/integration.test.js`

## 선행 조건
- incremental-parser-builder 완료
- completion-provider-builder 완료
- diagnostic-builder 완료

## 품질 기준
- JSON-RPC Content-Length 파싱 정확
- 불완전 메시지 버퍼링 처리
- LSP 생명주기 정확 (initialize → ... → shutdown → exit)
- 문서 동기화 정확 (incremental)
- 5개 핵심 시나리오 통합 테스트 통과
- 위치 변환 (line/character ↔ offset) 정확
