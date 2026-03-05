# Query Engine Design Skill

SQL 쿼리 엔진 설계 및 구현 가이드

## Trigger Conditions
- SQL 엔진, 쿼리 파서, 실행기 구현 시

## Instructions

### SQL Lexer 토큰
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

### Parser - SELECT 문 AST
```javascript
// SELECT AST 구조
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

### Query Planner (논리적 → 물리적)
```javascript
// 실행 계획 = 연산자 트리
// Scan → Filter → Join → Group → Having → Sort → Project → Limit

class SeqScan { execute(table) → rows }
class Filter { execute(rows, predicate) → rows }
class NestedLoopJoin { execute(left, right, condition) → rows }
class HashAggregate { execute(rows, groupBy, aggregates) → rows }
class Sort { execute(rows, orderBy) → rows }
class Project { execute(rows, columns) → rows }
class Limit { execute(rows, limit, offset) → rows }
```

### Expression Evaluator
```javascript
evaluateExpr(expr, row) {
  switch (expr.type) {
    case 'Column': return row[resolveColumn(expr)];
    case 'Number': return expr.value;
    case 'String': return expr.value;
    case 'BinaryExpr': return evalBinary(expr, row);
    case 'InExpr': return expr.values.includes(evaluateExpr(expr.left, row));
    case 'BetweenExpr': {
      const val = evaluateExpr(expr.expr, row);
      return val >= evaluateExpr(expr.low, row) && val <= evaluateExpr(expr.high, row);
    }
    case 'LikeExpr': return matchLike(evaluateExpr(expr.left, row), expr.pattern);
    case 'IsNull': return evaluateExpr(expr.expr, row) === null;
    case 'Subquery': return executeSubquery(expr.query);
  }
}

// LIKE 패턴 매칭: % = 임의 문자열, _ = 단일 문자
matchLike(value, pattern) {
  const regex = pattern
    .replace(/%/g, '.*')
    .replace(/_/g, '.');
  return new RegExp(`^${regex}$`, 'i').test(value);
}
```

### JOIN 구현
```javascript
// Nested Loop Join
innerJoin(leftRows, rightRows, condition) {
  const result = [];
  for (const left of leftRows) {
    for (const right of rightRows) {
      const merged = { ...left, ...right }; // 별칭 충돌 주의
      if (evaluateExpr(condition, merged)) {
        result.push(merged);
      }
    }
  }
  return result;
}

// LEFT JOIN: 오른쪽 매칭 없으면 NULL로 채움
leftJoin(leftRows, rightRows, condition) {
  const result = [];
  for (const left of leftRows) {
    let matched = false;
    for (const right of rightRows) {
      const merged = { ...left, ...right };
      if (evaluateExpr(condition, merged)) {
        result.push(merged);
        matched = true;
      }
    }
    if (!matched) {
      result.push({ ...left, ...nullRow(rightColumns) });
    }
  }
  return result;
}
```

### 테스트 전략
- **Parser**: 각 SQL 문법별 AST 생성 확인
- **Executor**: 단순 SELECT → WHERE → ORDER BY → 집계 → GROUP BY → JOIN → 서브쿼리 순서
- **Integration**: 검증 쿼리 2개 (부서별 통계 + JOIN 서브쿼리)
- **Edge Cases**: NULL 처리, 빈 테이블, 존재하지 않는 컬럼
