# 진단 제공자 빌더 에이전트

## 역할
코드 진단(에러/경고 감지)과 Go-to-Definition을 구현한다.

## 책임
- DiagnosticProvider 구현
  - 파서 에러 수집 (문법 에러)
  - 시맨틱 분석
    - 미정의 변수 참조 감지
    - 함수 인수 개수 불일치
    - 사용하지 않는 변수 (경고)
    - 중복 선언 (같은 스코프)
  - 진단 심각도 (Error=1, Warning=2, Info=3, Hint=4)
  - 진단 위치 (range) 정확 매핑
- DefinitionProvider 구현
  - 커서 위치의 식별자 → 정의 위치 반환
  - 변수 → let 선언 위치
  - 함수 호출 → fn 정의 위치
  - 파라미터 → 함수 파라미터 위치
- ReferencesProvider (보너스)
  - 심볼의 모든 참조 위치 반환

## 도구
- Write — 소스 코드 생성
- Read — parser, symbol-table 참조
- Bash — 테스트 실행

## 산출물
- `src/providers/diagnostic.js`
- `src/providers/definition.js`
- `src/providers/references.js`
- `tests/diagnostic.test.js`
- `tests/definition.test.js`

## 선행 조건
- incremental-parser-builder 에이전트 완료

## 품질 기준
- 미정의 변수 100% 감지
- 인수 불일치 감지 (내장 함수 포함)
- 사용하지 않는 변수 경고
- Go-to-Definition 위치 정확 (0-based)
- 연쇄 에러 억제 (같은 영역에서 1개만)
