'use strict';

/**
 * Query Planner: transforms AST into a logical execution plan.
 * Plan = chain of operators: Scan → Filter → Join → Group → Having → Sort → Project → Limit
 */

class PlanNode {
  constructor(type, props = {}) {
    this.type = type;
    Object.assign(this, props);
  }
}

class Planner {
  planSelect(ast) {
    // 1) Base scan
    let plan;
    if (ast.from) {
      plan = new PlanNode('SeqScan', { table: ast.from.name, alias: ast.from.alias });

      // 1b) Joins
      if (ast.from.joins && ast.from.joins.length > 0) {
        for (const join of ast.from.joins) {
          plan = new PlanNode('Join', {
            joinType: join.joinType,
            left: plan,
            right: new PlanNode('SeqScan', { table: join.table.name, alias: join.table.alias }),
            on: join.on
          });
        }
      }
    } else {
      // SELECT without FROM (e.g., SELECT 1+1)
      plan = new PlanNode('DualScan');
    }

    // 2) WHERE filter
    if (ast.where) {
      plan = new PlanNode('Filter', { input: plan, predicate: ast.where });
    }

    // 3) Detect aggregates in columns and having
    const aggregates = this.collectAggregates(ast);

    // 4) GROUP BY / Aggregation
    if (ast.groupBy || aggregates.length > 0) {
      plan = new PlanNode('Aggregate', {
        input: plan,
        groupBy: ast.groupBy,
        aggregates: aggregates
      });
    }

    // 5) HAVING filter (post-aggregation)
    if (ast.having) {
      plan = new PlanNode('Filter', { input: plan, predicate: ast.having });
    }

    // 6) Project columns
    plan = new PlanNode('Project', {
      input: plan,
      columns: ast.columns,
      distinct: ast.distinct
    });

    // 7) ORDER BY (after projection so aliases are available)
    if (ast.orderBy) {
      plan = new PlanNode('Sort', { input: plan, orderBy: ast.orderBy });
    }

    // 8) LIMIT / OFFSET
    if (ast.limit !== null || ast.offset !== null) {
      plan = new PlanNode('Limit', {
        input: plan,
        limit: ast.limit,
        offset: ast.offset
      });
    }

    return plan;
  }

  collectAggregates(ast) {
    const aggs = [];
    const seen = new Set();

    const collect = (node) => {
      if (!node) return;
      if (node.type === 'Aggregate') {
        const key = JSON.stringify(node);
        if (!seen.has(key)) {
          seen.add(key);
          aggs.push(node);
        }
        return;
      }
      // Recurse into child properties
      for (const val of Object.values(node)) {
        if (val && typeof val === 'object') {
          if (Array.isArray(val)) {
            val.forEach(item => {
              if (item && typeof item === 'object') collect(item);
            });
          } else {
            collect(val);
          }
        }
      }
    };

    // Collect from SELECT columns
    if (ast.columns) {
      for (const col of ast.columns) {
        collect(col.expr);
      }
    }
    // Collect from HAVING
    if (ast.having) {
      collect(ast.having);
    }
    // Collect from ORDER BY
    if (ast.orderBy) {
      for (const item of ast.orderBy) {
        collect(item.expr);
      }
    }

    return aggs;
  }
}

module.exports = { Planner, PlanNode };
