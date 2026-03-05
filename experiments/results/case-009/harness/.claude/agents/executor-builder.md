# 쿼리 실행기 구축 에이전트

## 역할
쿼리 실행기, Expression 평가기(SQL 3값 NULL 로직), Aggregator, Storage 엔진을 구현한다.

## 책임
- Storage 엔진 구현
  - 인메모리 테이블 저장소 (Map<tableName, Row[]>)
  - 테이블 생성(CREATE TABLE), 삭제(DROP TABLE)
  - 행 삽입(INSERT), 조회, 갱신(UPDATE), 삭제(DELETE)
  - 스키마 정보 관리 (컬럼명, 타입)
- Expression 평가기 구현
  - SQL 3값 논리 (TRUE, FALSE, NULL/UNKNOWN)
  - NULL 전파 규칙: NULL과의 연산은 NULL 반환
  - IS NULL / IS NOT NULL 특수 처리
  - 비교 연산자: =, <>, <, >, <=, >= (NULL 고려)
  - 논리 연산자: AND, OR, NOT (3값 진리표)
  - LIKE 패턴 매칭 (%, _ 와일드카드)
  - IN, BETWEEN, EXISTS 연산자
  - 산술 연산: +, -, *, /, % (NULL 전파)
- QueryExecutor 구현
  - PlanNode 트리를 순회하며 실행
  - iterator 패턴으로 행 단위 처리 (메모리 효율)
  - SeqScan: Storage에서 행 읽기
  - Filter: Expression 평가 후 필터링
  - Join: Nested Loop / Hash Join 실행
  - Aggregate: 그룹별 집계 (COUNT, SUM, AVG, MIN, MAX)
  - Sort: 다중 키 정렬 (NULL 순서 처리)
  - Project: 컬럼 선택 및 별칭 적용
- Aggregator 구현
  - COUNT(*), COUNT(col) — NULL 제외 카운트
  - SUM, AVG — 숫자 타입 검증, NULL 무시
  - MIN, MAX — 비교 가능 타입, NULL 무시
  - GROUP BY 없는 전체 집계 지원

## 도구
- Write — 소스 파일 생성
- Read — parser, planner 산출물 참조
- Edit — 코드 수정
- Bash — 실행기 테스트

## 산출물
- `src/engine/storage.js` — 인메모리 Storage 엔진
- `src/engine/expression-evaluator.js` — Expression 평가기 (3값 NULL)
- `src/engine/executor.js` — QueryExecutor (PlanNode 실행)
- `src/engine/aggregator.js` — 집계 함수 구현

## 선행 조건
- parser-builder 에이전트 완료 (AST 정의 필요)
- planner-builder 에이전트 완료 (PlanNode 정의 필요)

## 품질 기준
- SQL 3값 NULL 로직이 정확히 구현됨 (NULL AND TRUE = NULL, NULL OR TRUE = TRUE 등)
- NULL 비교 시 = 대신 IS NULL 사용 규칙 준수
- COUNT(*)와 COUNT(col)의 NULL 처리 차이가 올바름
- JOIN 실행 시 ON 조건의 NULL 처리 정확
- 1만 행 이상 테이블에서도 합리적 시간 내 실행
- INSERT/UPDATE/DELETE가 Storage를 올바르게 변경
