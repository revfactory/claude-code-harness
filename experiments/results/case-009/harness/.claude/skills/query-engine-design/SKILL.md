---
name: query-engine-design
description: "SQL query engine design and implementation guide. Use when the user requests building a SQL engine, query parser, query planner, or query executor — including in-memory storage, SQL parsing, and query optimization."
---

# Query Engine Design Skill

SQL 쿼리 엔진 설계 및 구현 가이드

## 3단계 파이프라인 워크플로우

```
SQL 문자열 → [Parser] → AST → [Planner] → 실행계획 → [Executor] → 결과셋
                                                          ↑
                                                    [StorageEngine]
```

1. **Parser**: SQL 문자열을 AST로 변환 (재귀 하강)
2. **Planner**: 논리적 실행 계획 → 물리적 실행 계획
3. **Executor**: 실행 계획을 순회하며 결과셋 생성

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

## NULL 3값 로직 규칙

- `NULL = NULL` → NULL (not true)
- `NULL AND true` → NULL
- `NULL OR true` → true
- `IS NULL` / `IS NOT NULL` 로만 NULL 비교

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
  parser.test.js
  executor.test.js
  integration.test.js
```

## 핵심 규칙

- 파서-플래너-실행기 완전 분리
- 대소문자 무시 (키워드)
- 스키마 타입: INT, FLOAT, TEXT

## 테스트 전략

- **Parser**: 각 SQL 문법별 AST 생성 확인
- **Executor**: 단순 SELECT → WHERE → ORDER BY → 집계 → GROUP BY → JOIN → 서브쿼리 순서
- **Integration**: 검증 쿼리 2개 (부서별 통계 + JOIN 서브쿼리)
- **Edge Cases**: NULL 처리, 빈 테이블, 존재하지 않는 컬럼
