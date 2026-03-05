'use strict';

class Aggregator {
  constructor(evaluator) {
    this.evaluator = evaluator;
  }

  /**
   * Group rows and compute aggregates.
   * @param {Array} rows - input rows
   * @param {Array|null} groupByExprs - GROUP BY expressions
   * @param {Array} aggregateExprs - aggregate expressions from SELECT/HAVING
   * @returns {Array} grouped rows with aggregate values injected
   */
  aggregate(rows, groupByExprs, aggregateExprs) {
    const groups = this.groupRows(rows, groupByExprs);
    const result = [];

    for (const [, groupRows] of groups) {
      const outputRow = groupByExprs ? { ...groupRows[0] } : {};

      // Copy group-by column values
      if (groupByExprs) {
        for (const expr of groupByExprs) {
          const val = this.evaluator.evaluate(expr, groupRows[0]);
          const key = this.evaluator.exprToString(expr);
          if (!(expr.name in outputRow) && !(key in outputRow)) {
            outputRow[key] = val;
          }
        }
      }

      // Compute each aggregate
      for (const aggExpr of aggregateExprs) {
        const key = this.evaluator.getAggregateKey(aggExpr);
        outputRow[key] = this.computeAggregate(aggExpr, groupRows);
      }

      result.push(outputRow);
    }

    return result;
  }

  groupRows(rows, groupByExprs) {
    const groups = new Map();

    if (!groupByExprs || groupByExprs.length === 0) {
      // All rows in one group
      groups.set('__all__', rows);
      return groups;
    }

    for (const row of rows) {
      const keyParts = groupByExprs.map(expr => {
        const val = this.evaluator.evaluate(expr, row);
        return val === null ? '__NULL__' : String(val);
      });
      const groupKey = keyParts.join('|||');

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey).push(row);
    }

    return groups;
  }

  computeAggregate(aggExpr, rows) {
    const fn = aggExpr.fn;
    const arg = aggExpr.arg;

    if (fn === 'COUNT') {
      if (arg === '*') return rows.length;
      let values = rows.map(r => this.evaluator.evaluate(arg.distinct ? arg.expr : arg, r));
      values = values.filter(v => v !== null && v !== undefined);
      if (arg.distinct) {
        values = [...new Set(values)];
      }
      return values.length;
    }

    // For other aggregates, extract non-null values
    const argExpr = (arg && arg.distinct) ? arg.expr : arg;
    let values = rows.map(r => this.evaluator.evaluate(argExpr, r));
    values = values.filter(v => v !== null && v !== undefined);

    if (arg && arg.distinct) {
      values = [...new Set(values)];
    }

    if (values.length === 0) return null;

    switch (fn) {
      case 'SUM': return values.reduce((a, b) => a + b, 0);
      case 'AVG': return values.reduce((a, b) => a + b, 0) / values.length;
      case 'MIN': return values.reduce((a, b) => a < b ? a : b);
      case 'MAX': return values.reduce((a, b) => a > b ? a : b);
      default:
        throw new Error(`Unknown aggregate function: ${fn}`);
    }
  }
}

module.exports = { Aggregator };
