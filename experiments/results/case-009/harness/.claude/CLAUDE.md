# 인메모리 SQL 쿼리 엔진 프로젝트

## 아키텍처 (3단계 파이프라인)
```
SQL 문자열 → [Parser] → AST → [Planner] → 실행계획 → [Executor] → 결과셋
                                                          ↑
                                                    [StorageEngine]
```

## 파일 구조
```
src/
  lexer.js           - SQL 토크나이저
  parser.js          - 재귀 하강 SQL 파서
  ast.js             - SQL AST 노드 정의
  planner.js         - 논리적 → 물리적 쿼리 계획
  executor.js        - 쿼리 실행기
  storage.js         - 인메모리 테이블 저장소 + 스키마
  expression.js      - WHERE 절 / 산술식 평가기
  aggregator.js      - 집계 함수 (COUNT, AVG, SUM, MIN, MAX)
  formatter.js       - 결과 테이블 포맷터
  repl.js            - 대화형 SQL 실행
  index.js           - CLI 진입점
tests/
  parser.test.js     - SQL 파싱 테스트
  executor.test.js   - 쿼리 실행 테스트
  integration.test.js - 검증 쿼리 통합 테스트
```

## SQL 지원 범위 (우선순위)
1. CREATE TABLE, DROP TABLE, INSERT INTO
2. SELECT (*, columns, aliases)
3. WHERE (비교, AND/OR, LIKE, IN, BETWEEN, IS NULL)
4. ORDER BY, LIMIT/OFFSET
5. 집계 (COUNT, AVG, SUM, MIN, MAX)
6. GROUP BY + HAVING
7. JOIN (INNER, LEFT)
8. 서브쿼리 (WHERE IN subquery)
9. UPDATE, DELETE
10. DISTINCT

## 규칙
- 파서-플래너-실행기 완전 분리
- 대소문자 무시 (키워드)
- NULL 3값 로직 (NULL = NULL → NULL, not true)
- 스키마 타입: INT, FLOAT, TEXT
