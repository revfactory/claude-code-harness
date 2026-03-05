# SQL Parser 참조

## SQL Lexer 토큰

```javascript
const SQLToken = {
  // 키워드 (대소문자 무시)
  SELECT, FROM, WHERE, INSERT, INTO, VALUES, CREATE, TABLE, DROP,
  UPDATE, SET, DELETE, ORDER, BY, ASC, DESC, LIMIT, OFFSET,
  GROUP, HAVING, JOIN, INNER, LEFT, ON, AS, DISTINCT,
  AND, OR, NOT, IN, BETWEEN, LIKE, IS, NULL,
  COUNT, AVG, SUM, MIN, MAX,
  // 연산자
  EQ, NEQ, LT, GT, LTE, GTE, STAR, PLUS, MINUS, SLASH, PERCENT,
  // 구분자
  LPAREN, RPAREN, COMMA, SEMICOLON, DOT,
  // 리터럴
  NUMBER, STRING, IDENTIFIER,
  EOF
};
```

## SELECT 문 AST 구조

```javascript
{
  type: 'SelectStatement',
  distinct: false,
  columns: [
    { expr: { type: 'Column', table: 'u', name: 'name' }, alias: 'user_name' },
    { expr: { type: 'Aggregate', fn: 'COUNT', arg: '*' }, alias: 'cnt' }
  ],
  from: {
    type: 'TableRef', name: 'users', alias: 'u',
    join: {
      type: 'INNER',
      table: { type: 'TableRef', name: 'orders', alias: 'o' },
      on: { type: 'BinaryExpr', op: '=', left: ..., right: ... }
    }
  },
  where: { type: 'BinaryExpr', ... },
  groupBy: [{ type: 'Column', name: 'city' }],
  having: { type: 'BinaryExpr', ... },
  orderBy: [{ expr: ..., direction: 'DESC' }],
  limit: 10,
  offset: 5
}
```

## Parser 패턴

- 재귀 하강 방식
- 각 SQL 절(SELECT, FROM, WHERE, ...)을 개별 메서드로 파싱
- 키워드는 대소문자 무시
- 표현식 파싱은 우선순위 기반 (AND < OR < 비교 < 산술)
