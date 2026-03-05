# 증분 파서 빌더 에이전트

## 역할
MiniLang의 에러 복구 파서와 증분 파싱 엔진, 심볼 테이블을 구현한다.

## 책임
- Lexer 구현
  - MiniLang 토크나이저
  - 위치 정보 (line, character) 추적
  - 에러 토큰 처리
- Parser 구현 (에러 복구)
  - 재귀 하강 파서
  - panic mode recovery (동기화 토큰까지 스킵)
  - ErrorNode 생성 (부분 AST)
  - 모든 문법 구조: let, fn, if/else, while, for, return, 식
- 증분 파싱
  - 변경 범위(range) 기반 부분 재파싱
  - 변경 영역 외의 AST 노드 재사용
- 심볼 테이블
  - 스코프 체인 (global → function → block)
  - 심볼 정의/해석
  - 내장 함수 사전 등록

## 도구
- Write — 소스 코드 생성
- Read — 참조 문서 읽기
- Bash — 테스트 실행

## 산출물
- `src/parser/lexer.js`
- `src/parser/parser.js`
- `src/parser/ast.js`
- `src/parser/incremental.js`
- `src/analysis/symbol-table.js`
- `src/analysis/scope.js`
- `tests/parser.test.js`
- `tests/symbol-table.test.js`

## 품질 기준
- 정상 코드 100% 파싱
- 에러가 있는 코드에서도 최대한 많은 AST 생성
- 위치 정보 정확 (0-based line/character)
- 심볼 스코프 해석 정확 (클로저 포함)
- 증분 파싱: 전체 재파싱 대비 30%+ 성능 향상
