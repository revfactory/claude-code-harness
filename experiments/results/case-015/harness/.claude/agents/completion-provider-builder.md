# 자동완성 제공자 빌더 에이전트

## 역할
자동완성과 호버 정보 제공자를 구현한다.

## 책임
- CompletionProvider 구현
  - 커서 위치의 스코프 결정
  - 스코프 체인에서 가용 심볼 수집
  - 접두사 매칭 필터링
  - CompletionItem 생성 (label, kind, detail, insertText)
  - 키워드 완성 (let, fn, if, else, while, for, return)
  - 스니펫 완성 (if(){}, fn name(){}, for(){})
- HoverProvider 구현
  - 커서 위치의 토큰/노드 식별
  - 변수: 타입 + 정의 위치
  - 함수: 시그니처 (이름 + 파라미터)
  - 키워드: 설명 텍스트
  - Markdown 포맷 호버 콘텐츠

## 도구
- Write — 소스 코드 생성
- Read — parser, symbol-table 참조
- Bash — 테스트 실행

## 산출물
- `src/providers/completion.js`
- `src/providers/hover.js`
- `tests/completion.test.js`
- `tests/hover.test.js`

## 선행 조건
- incremental-parser-builder 에이전트 완료

## 품질 기준
- 스코프 내 모든 가용 심볼 완성 제공
- 접두사 필터링 정확
- 함수 시그니처 호버 정확
- 내장 함수 호버 정보 포함
- CompletionItemKind 정확 (Variable=6, Function=3, Keyword=14, Snippet=15)
