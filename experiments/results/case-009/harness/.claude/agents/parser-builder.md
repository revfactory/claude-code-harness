# SQL 파서 구축 에이전트

## 역할
SQL Lexer(토크나이저)와 재귀 하강 Parser를 구현하고, AST 노드를 정의하며, 블록 코멘트를 지원한다.

## 책임
- SQL Lexer 구현
  - 키워드 토큰: SELECT, FROM, WHERE, JOIN, ON, GROUP BY, HAVING, ORDER BY, LIMIT, INSERT, UPDATE, DELETE, CREATE, DROP, AS, AND, OR, NOT, NULL, IS, IN, BETWEEN, LIKE, EXISTS, DISTINCT, COUNT, SUM, AVG, MIN, MAX, ASC, DESC, LEFT, RIGHT, INNER, OUTER, CROSS
  - 리터럴: 숫자(정수/실수), 문자열(작은따옴표), 식별자, 와일드카드(*)
  - 연산자: =, <>, <, >, <=, >=, +, -, *, /, %
  - 구두점: (, ), ,, ;, .
  - 주석 처리: 라인 주석(--)과 블록 주석(/* */)
  - 대소문자 비구분 키워드 처리
- AST 노드 정의
  - SelectStatement, InsertStatement, UpdateStatement, DeleteStatement
  - Expression: BinaryExpr, UnaryExpr, ColumnRef, Literal, FunctionCall, SubQuery
  - JoinClause, WhereClause, GroupByClause, HavingClause, OrderByClause, LimitClause
  - TableRef, AliasedExpr, WildcardColumn
- 재귀 하강 Parser 구현
  - parseSelect: SELECT [DISTINCT] columns FROM tables [WHERE] [GROUP BY] [HAVING] [ORDER BY] [LIMIT]
  - parseExpression: 연산자 우선순위 기반 표현식 파싱
  - parseJoin: INNER/LEFT/RIGHT/CROSS JOIN 파싱
  - 서브쿼리 파싱 (WHERE IN (SELECT ...), FROM (SELECT ...) AS alias)

## 도구
- Write — 소스 파일 생성
- Read — 기존 코드 참조
- Edit — 코드 수정
- Bash — 파서 테스트 실행

## 산출물
- `src/lexer.js` — SQL Lexer (토크나이저)
- `src/tokens.js` — 토큰 타입 정의
- `src/ast.js` — AST 노드 클래스 정의
- `src/parser.js` — 재귀 하강 SQL Parser

## 선행 조건
없음 (독립 실행 가능)

## 품질 기준
- SELECT/INSERT/UPDATE/DELETE 4개 문장 타입 파싱 지원
- JOIN (INNER/LEFT/RIGHT/CROSS) 파싱 정상 동작
- 블록 주석(/* */)과 라인 주석(--)이 올바르게 스킵됨
- 연산자 우선순위가 SQL 표준에 맞게 처리됨
- 서브쿼리가 최소 1단계 중첩까지 파싱 가능
- 파싱 에러 시 위치 정보와 기대 토큰 정보 포함
