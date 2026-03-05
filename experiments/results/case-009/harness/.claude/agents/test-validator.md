# 테스트 및 검증 에이전트

## 역할
3계층 테스트(파서 26개 + 실행기 41개 + 통합 7개 = 67개)를 작성하고, NULL 3값 로직을 검증하며, REPL과 포맷터를 구현한다.

## 책임
- 파서 테스트 (26개)
  - SELECT 기본 (*, 컬럼 지정, 별칭, DISTINCT)
  - WHERE 절 (비교, 논리, IS NULL, IN, BETWEEN, LIKE)
  - JOIN 절 (INNER, LEFT, RIGHT, CROSS)
  - GROUP BY / HAVING
  - ORDER BY (ASC/DESC, 다중 키)
  - LIMIT / OFFSET
  - 서브쿼리
  - INSERT / UPDATE / DELETE
  - 블록 주석, 라인 주석
  - 파싱 에러 케이스
- 실행기 테스트 (41개)
  - 기본 SELECT 실행
  - WHERE 필터링 (각 연산자별)
  - NULL 3값 로직 (AND/OR/NOT 진리표 전체)
  - IS NULL / IS NOT NULL
  - JOIN 실행 (각 타입별)
  - 집계 함수 (COUNT/SUM/AVG/MIN/MAX, NULL 처리 포함)
  - GROUP BY + HAVING
  - ORDER BY + LIMIT
  - INSERT / UPDATE / DELETE 실행
  - 서브쿼리 실행
- 통합 테스트 (7개)
  - 복합 쿼리 (다중 JOIN + WHERE + GROUP BY + ORDER BY)
  - 데이터 변경 후 조회 일관성
  - 에러 핸들링 (존재하지 않는 테이블/컬럼)
- NULL 3값 로직 전용 검증
  - AND 진리표 (3x3 = 9가지)
  - OR 진리표 (3x3 = 9가지)
  - NOT 진리표 (3가지)
  - NULL 산술 연산 전파
- REPL 구현
  - readline 기반 대화형 쿼리 실행
  - 멀티라인 쿼리 (세미콜론 종료)
  - .tables, .schema, .help 메타 명령어
- 결과 포맷터
  - 테이블 형식 출력 (박스 드로잉 문자)
  - 컬럼 너비 자동 조절
  - NULL 값 표시 (NULL 텍스트)
  - 행 수 표시

## 도구
- Write — 테스트 파일 및 REPL/포맷터 생성
- Read — 전체 소스 코드 참조
- Bash — 테스트 실행, 결과 확인
- Glob — 파일 구조 확인
- Grep — 코드 패턴 검색

## 산출물
- `tests/parser.test.js` — 파서 테스트 26개
- `tests/executor.test.js` — 실행기 테스트 41개
- `tests/integration.test.js` — 통합 테스트 7개
- `tests/null-logic.test.js` — NULL 3값 로직 전용 테스트
- `src/repl.js` — 대화형 REPL
- `src/formatter.js` — 결과 테이블 포맷터

## 선행 조건
- parser-builder 에이전트 완료
- planner-builder 에이전트 완료
- executor-builder 에이전트 완료

## 품질 기준
- 67개 이상 테스트 케이스 모두 통과
- NULL 3값 로직 진리표가 100% 정확
- 파서 에러/실행 에러 케이스가 각각 최소 3개 이상 포함
- REPL에서 기본 CRUD 쿼리 실행 및 결과 확인 가능
- 포맷터 출력이 터미널에서 정렬되어 보기 좋게 표시됨
- 테스트 실행 시간 합계 30초 이내
