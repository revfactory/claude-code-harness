'use strict';

class ExpressionEvaluator {
  constructor(executor) {
    this.executor = executor;
  }

  evaluate(expr, row) {
    if (expr === null || expr === undefined) return null;

    switch (expr.type) {
      case 'Number': return expr.value;
      case 'String': return expr.value;
      case 'Null': return null;

      case 'Column': return this.evaluateColumn(expr, row);
      case 'BinaryExpr': return this.evaluateBinary(expr, row);
      case 'UnaryExpr': return this.evaluateUnary(expr, row);
      case 'InExpr': return this.evaluateIn(expr, row);
      case 'BetweenExpr': return this.evaluateBetween(expr, row);
      case 'LikeExpr': return this.evaluateLike(expr, row);
      case 'IsNullExpr': return this.evaluateIsNull(expr, row);
      case 'Aggregate': return this.evaluateAggregate(expr, row);
      case 'Subquery': return this.evaluateSubquery(expr);

      default:
        throw new Error(`Unknown expression type: ${expr.type}`);
    }
  }

  evaluateColumn(expr, row) {
    if (!row) return null;

    // Try qualified name first (table.column)
    if (expr.table) {
      const qualifiedKey = `${expr.table}.${expr.name}`;
      if (qualifiedKey in row) return row[qualifiedKey];
    }

    // Try direct column name
    if (expr.name in row) return row[expr.name];

    // Try case-insensitive lookup
    const lowerName = expr.name.toLowerCase();
    for (const key of Object.keys(row)) {
      if (key.toLowerCase() === lowerName) return row[key];
      // Check if key is qualified (e.g., "t.col") and col matches
      const dotIdx = key.indexOf('.');
      if (dotIdx !== -1) {
        const colPart = key.slice(dotIdx + 1);
        if (colPart.toLowerCase() === lowerName) {
          if (!expr.table || key.slice(0, dotIdx).toLowerCase() === expr.table.toLowerCase()) {
            return row[key];
          }
        }
      }
    }

    return undefined;
  }

  evaluateBinary(expr, row) {
    // Short-circuit for AND/OR
    if (expr.op === 'AND') {
      const left = this.evaluate(expr.left, row);
      if (left === false) return false;
      const right = this.evaluate(expr.right, row);
      if (left === null || right === null) return null;
      return left && right;
    }
    if (expr.op === 'OR') {
      const left = this.evaluate(expr.left, row);
      if (left === true) return true;
      const right = this.evaluate(expr.right, row);
      if (left === null || right === null) return null;
      return left || right;
    }

    const left = this.evaluate(expr.left, row);
    const right = this.evaluate(expr.right, row);

    // NULL propagation for comparison and arithmetic
    if (left === null || right === null) {
      // For comparisons, NULL op anything = NULL
      return null;
    }

    switch (expr.op) {
      case '=':  return left === right;
      case '<>': return left !== right;
      case '<':  return left < right;
      case '>':  return left > right;
      case '<=': return left <= right;
      case '>=': return left >= right;
      case '+':  return left + right;
      case '-':  return left - right;
      case '*':  return left * right;
      case '/':  return right === 0 ? null : left / right;
      case '%':  return right === 0 ? null : left % right;
      default:
        throw new Error(`Unknown operator: ${expr.op}`);
    }
  }

  evaluateUnary(expr, row) {
    const val = this.evaluate(expr.operand, row);
    switch (expr.op) {
      case '-': return val === null ? null : -val;
      case 'NOT': return val === null ? null : !val;
      default:
        throw new Error(`Unknown unary operator: ${expr.op}`);
    }
  }

  evaluateIn(expr, row) {
    const val = this.evaluate(expr.expr, row);
    if (val === null) return null;

    let values;
    if (expr.values && expr.values.type === 'Subquery') {
      // Subquery IN - execute subquery and get first column values
      const result = this.executor.executeSelect(expr.values.query);
      values = result.rows.map(r => {
        const keys = Object.keys(r);
        return r[keys[0]];
      });
    } else {
      values = expr.values.map(v => this.evaluate(v, row));
    }

    const found = values.includes(val);
    return expr.negated ? !found : found;
  }

  evaluateBetween(expr, row) {
    const val = this.evaluate(expr.expr, row);
    const low = this.evaluate(expr.low, row);
    const high = this.evaluate(expr.high, row);
    if (val === null || low === null || high === null) return null;
    const result = val >= low && val <= high;
    return expr.negated ? !result : result;
  }

  evaluateLike(expr, row) {
    const val = this.evaluate(expr.expr, row);
    if (val === null) return null;
    const result = this.matchLike(String(val), expr.pattern);
    return expr.negated ? !result : result;
  }

  matchLike(value, pattern) {
    // Escape regex special chars except % and _
    const escaped = pattern.replace(/([.+?^${}()|[\]\\])/g, '\\$1');
    const regex = escaped.replace(/%/g, '.*').replace(/_/g, '.');
    return new RegExp(`^${regex}$`, 'i').test(value);
  }

  evaluateIsNull(expr, row) {
    const val = this.evaluate(expr.expr, row);
    const isNull = val === null || val === undefined;
    return expr.negated ? !isNull : isNull;
  }

  evaluateAggregate(expr, row) {
    // During row-level evaluation, aggregates are pre-computed and stored in the row
    const key = this.getAggregateKey(expr);
    if (row && key in row) return row[key];
    return null;
  }

  getAggregateKey(expr) {
    const argStr = expr.arg === '*' ? '*' :
      (expr.arg && expr.arg.distinct) ?
        `DISTINCT_${this.exprToString(expr.arg.expr)}` :
        this.exprToString(expr.arg);
    return `__agg_${expr.fn}_${argStr}`;
  }

  exprToString(expr) {
    if (!expr) return '';
    switch (expr.type) {
      case 'Column': return expr.table ? `${expr.table}.${expr.name}` : expr.name;
      case 'Number': return String(expr.value);
      case 'String': return `'${expr.value}'`;
      case 'BinaryExpr': return `(${this.exprToString(expr.left)}${expr.op}${this.exprToString(expr.right)})`;
      default: return JSON.stringify(expr);
    }
  }

  evaluateSubquery(expr) {
    const result = this.executor.executeSelect(expr.query);
    if (result.rows.length === 0) return null;
    // Scalar subquery - return first column of first row
    const keys = Object.keys(result.rows[0]);
    return result.rows[0][keys[0]];
  }

  // Check if expression is truthy (handles SQL 3-value logic)
  isTruthy(value) {
    if (value === null || value === undefined) return false;
    return !!value;
  }
}

module.exports = { ExpressionEvaluator };
