# Executor Patterns 참조

## Query Planner 연산자

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

## Expression Evaluator

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
```

## LIKE 패턴 매칭

```javascript
// % = 임의 문자열, _ = 단일 문자
matchLike(value, pattern) {
  const regex = pattern
    .replace(/%/g, '.*')
    .replace(/_/g, '.');
  return new RegExp(`^${regex}$`, 'i').test(value);
}
```

## JOIN 구현

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
